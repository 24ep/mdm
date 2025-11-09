"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Filter, SortAsc, SortDesc, Grid, List, Download, Trash2, Share2, Tag, Folder } from 'lucide-react'
import { FilePreview } from '@/components/ui/file-preview'
import { useDebounce } from '@/hooks/use-debounce'

interface FileSearchProps {
  spaceId: string
  onFileSelect?: (file: any) => void
  onFilesSelect?: (files: any[]) => void
  allowMultiSelect?: boolean
  showFilters?: boolean
  showActions?: boolean
}

interface SearchFilters {
  query: string
  fileType: string
  category: string
  tag: string
  dateFrom: string
  dateTo: string
  sizeMin: string
  sizeMax: string
  uploadedBy: string
  sortBy: string
  sortOrder: string
}

interface SearchResult {
  files: any[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  filters: {
    fileTypes: string[]
    categories: string[]
    tags: string[]
    dateRange: {
      from: string
      to: string
    }
    sizeRange: {
      min: number
      max: number
    }
  }
}

export function FileSearch({
  spaceId,
  onFileSelect,
  onFilesSelect,
  allowMultiSelect = false,
  showFilters = true,
  showActions = true
}: FileSearchProps) {
  const { data: session } = useSession()
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    fileType: '',
    category: '',
    tag: '',
    dateFrom: '',
    dateTo: '',
    sizeMin: '',
    sizeMax: '',
    uploadedBy: '',
    sortBy: 'uploaded_at',
    sortOrder: 'desc'
  })

  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const debouncedQuery = useDebounce(searchFilters.query, 300)

  // Search files
  const searchFiles = useCallback(async (filters: SearchFilters, page = 1) => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        spaceId,
        page: page.toString(),
        limit: '20',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      })

      const response = await fetch(`/api/files/search?${params}`, {
        headers: {
          'x-user-id': session.user.id
        }
      })

      if (!response.ok) {
        throw new Error('Failed to search files')
      }

      const result = await response.json()
      setSearchResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [spaceId])

  // Search when filters change
  useEffect(() => {
    if (spaceId) {
      searchFiles(searchFilters)
    }
  }, [spaceId, debouncedQuery, searchFilters.fileType, searchFilters.category, searchFilters.tag, searchFilters.sortBy, searchFilters.sortOrder])

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleFileSelect = (file: any) => {
    if (allowMultiSelect) {
      const newSelected = new Set(selectedFiles)
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id)
      } else {
        newSelected.add(file.id)
      }
      setSelectedFiles(newSelected)
      
      if (onFilesSelect) {
        const selectedFilesList = searchResult?.files.filter(f => newSelected.has(f.id)) || []
        onFilesSelect(selectedFilesList)
      }
    } else {
      if (onFileSelect) {
        onFileSelect(file)
      }
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedFiles.size === 0) return

    const selectedFilesList = searchResult?.files.filter(f => selectedFiles.has(f.id)) || []
    
    switch (action) {
      case 'download':
        // Implement bulk download
        console.log('Bulk download:', selectedFilesList)
        break
      case 'delete':
        // Implement bulk delete
        console.log('Bulk delete:', selectedFilesList)
        break
      case 'share':
        // Implement bulk share
        console.log('Bulk share:', selectedFilesList)
        break
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word')) return '📝'
    if (mimeType.includes('excel')) return '📊'
    if (mimeType.includes('powerpoint')) return '📈'
    return '📁'
  }

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>File Search</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <div className="flex items-center space-x-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search files..."
              value={searchFilters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="flex-1"
            />
            <Select value={searchFilters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uploaded_at">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange('sortOrder', searchFilters.sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {searchFilters.sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <label className="text-sm font-medium">File Type</label>
                <Select value={searchFilters.fileType} onValueChange={(value) => handleFilterChange('fileType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    {searchResult?.filters.fileTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={searchFilters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {searchResult?.filters.categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Date From</label>
                <Input
                  type="date"
                  value={searchFilters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Date To</label>
                <Input
                  type="date"
                  value={searchFilters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {allowMultiSelect && selectedFiles.size > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">{selectedFiles.size} files selected</span>
              <Button size="sm" onClick={() => handleBulkAction('download')}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('share')}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {searchResult && !loading && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {searchResult.pagination.total} files found
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Page {searchResult.pagination.page} of {searchResult.pagination.pages}
              </span>
            </div>
          </div>

          {/* Files Grid/List */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
            {searchResult.files.map((file) => (
              <Card
                key={file.id}
                className={`cursor-pointer transition-colors ${
                  selectedFiles.has(file.id) ? 'ring-2 ring-primary' : ''
                } ${allowMultiSelect ? 'hover:bg-muted' : ''}`}
                onClick={() => handleFileSelect(file)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getFileIcon(file.mime_type)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{file.file_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.file_size)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(file.uploaded_at).toLocaleDateString()}
                      </p>
                      
                      {/* Categories and Tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {file.categories?.map((category: any) => (
                          <Badge key={category.id} variant="secondary" className="text-xs">
                            <Folder className="w-3 h-3 mr-1" />
                            {category.name}
                          </Badge>
                        ))}
                        {file.tags?.map((tag: any) => (
                          <Badge key={tag.id} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {searchResult.pagination.pages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={searchResult.pagination.page === 1}
                onClick={() => searchFiles(searchFilters, searchResult.pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {searchResult.pagination.page} of {searchResult.pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={searchResult.pagination.page === searchResult.pagination.pages}
                onClick={() => searchFiles(searchFilters, searchResult.pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
