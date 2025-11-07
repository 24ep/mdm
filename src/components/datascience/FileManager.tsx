'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Upload,
  Download,
  File,
  Folder,
  FolderOpen,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileCode,
  Database,
  Trash2,
  Edit,
  Copy,
  Share,
  Users,
  Eye,
  EyeOff,
  Plus,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Save,
  FolderPlus,
  FilePlus,
  Archive,
  Star,
  StarOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  mimeType?: string
  size: number
  createdAt: Date
  updatedAt: Date
  isPublic: boolean
  isStarred: boolean
  tags: string[]
  owner: string
  path: string
  content?: string
  metadata?: Record<string, any>
}

interface CollaborationSession {
  id: string
  notebookId: string
  participants: Array<{
    id: string
    name: string
    email: string
    role: 'owner' | 'editor' | 'viewer'
    cursor?: { line: number; column: number }
    lastSeen: Date
  }>
  isActive: boolean
  createdAt: Date
}

interface FileManagerProps {
  onFileSelect: (file: FileItem) => void
  onFileUpload: (file: File) => Promise<string>
  onFileCreate: (name: string, type: 'file' | 'folder', parentId?: string) => Promise<FileItem>
  onFileDelete: (fileId: string) => Promise<void>
  onFileRename: (fileId: string, newName: string) => Promise<void>
  onFileShare: (fileId: string, permissions: 'read' | 'write') => Promise<string>
  currentNotebookId?: string
}

export function FileManager({
  onFileSelect,
  onFileUpload,
  onFileCreate,
  onFileDelete,
  onFileRename,
  onFileShare,
  currentNotebookId
}: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [collaborationSessions, setCollaborationSessions] = useState<CollaborationSession[]>([])
  const [currentPath, setCurrentPath] = useState<string>('/')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterType, setFilterType] = useState<'all' | 'notebooks' | 'data' | 'images' | 'documents'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showCollaboration, setShowCollaboration] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newFolderName, setNewFolderName] = useState('')

  // Initialize with empty list; integrate real data source via props/API elsewhere
  useEffect(() => {
    setFiles([])
  }, [])

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') {
      return <Folder className="h-5 w-5 text-blue-500" />
    }
    
    switch (file.mimeType) {
      case 'application/json':
        return <FileCode className="h-5 w-5 text-yellow-500" />
      case 'text/csv':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />
      case 'image/png':
      case 'image/jpeg':
      case 'image/gif':
        return <FileImage className="h-5 w-5 text-purple-500" />
      case 'text/plain':
        return <FileText className="h-5 w-5 text-gray-500" />
      default:
        return <File className="h-5 w-5 text-gray-400" />
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const filteredFiles = files
    .filter(file => {
      if (filterType !== 'all') {
        switch (filterType) {
          case 'notebooks':
            return file.mimeType === 'application/json' || file.name.endsWith('.ipynb')
          case 'data':
            return file.mimeType === 'text/csv' || file.name.endsWith('.csv')
          case 'images':
            return file.mimeType?.startsWith('image/')
          case 'documents':
            return file.mimeType === 'text/plain' || file.name.endsWith('.txt')
          default:
            return true
        }
      }
      return true
    })
    .filter(file => {
      if (!searchQuery) return true
      return file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          const aUpdated = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt || 0)
          const bUpdated = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt || 0)
          const aUpdatedTime = isNaN(aUpdated.getTime()) ? 0 : aUpdated.getTime()
          const bUpdatedTime = isNaN(bUpdated.getTime()) ? 0 : bUpdated.getTime()
          comparison = aUpdatedTime - bUpdatedTime
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'type':
          comparison = a.mimeType?.localeCompare(b.mimeType || '') || 0
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setIsUploading(true)
    
    for (const file of Array.from(files)) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
        
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
        }
        
        const fileId = await onFileUpload(file)
        
        const newFile: FileItem = {
          id: fileId,
          name: file.name,
          type: 'file',
          mimeType: file.type,
          size: file.size,
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublic: false,
          isStarred: false,
          tags: [],
          owner: 'Current User',
          path: `/${file.name}`
        }
        
        setFiles(prev => [newFile, ...prev])
        toast.success(`${file.name} uploaded successfully`)
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    
    setIsUploading(false)
    setUploadProgress({})
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    
    try {
      const newFolder = await onFileCreate(newFolderName.trim(), 'folder')
      setFiles(prev => [newFolder, ...prev])
      setNewFolderName('')
      setShowCreateFolder(false)
      toast.success('Folder created successfully')
    } catch (error) {
      toast.error('Failed to create folder')
    }
  }

  const handleFileRename = async (fileId: string, newName: string) => {
    try {
      await onFileRename(fileId, newName)
      setFiles(prev => prev.map(file => 
        file.id === fileId ? { ...file, name: newName, updatedAt: new Date() } : file
      ))
      toast.success('File renamed successfully')
    } catch (error) {
      toast.error('Failed to rename file')
    }
  }

  const handleFileDelete = async (fileId: string) => {
    try {
      await onFileDelete(fileId)
      setFiles(prev => prev.filter(file => file.id !== fileId))
      toast.success('File deleted successfully')
    } catch (error) {
      toast.error('Failed to delete file')
    }
  }

  const handleFileShare = async (fileId: string) => {
    try {
      const shareLink = await onFileShare(fileId, 'read')
      navigator.clipboard.writeText(shareLink)
      toast.success('Share link copied to clipboard')
    } catch (error) {
      toast.error('Failed to create share link')
    }
  }

  const toggleStar = (fileId: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, isStarred: !file.isStarred } : file
    ))
  }

  const togglePublic = (fileId: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, isPublic: !file.isPublic } : file
    ))
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">File Manager</h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCollaboration(true)}
              className="h-8 px-3"
            >
              <Users className="h-4 w-4 mr-1" />
              Collaborate
            </Button>
            <Button
              size="sm"
              onClick={() => setShowUpload(true)}
              className="h-8 px-3"
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-8"
            />
          </div>
          
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Files</SelectItem>
              <SelectItem value="notebooks">Notebooks</SelectItem>
              <SelectItem value="data">Data Files</SelectItem>
              <SelectItem value="images">Images</SelectItem>
              <SelectItem value="documents">Documents</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-8 w-8 p-0"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="h-8 w-8 p-0"
            >
              {viewMode === 'grid' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No files found</h3>
            <p>Upload files or create folders to get started</p>
          </div>
        ) : (
          <div className={cn(
            "gap-4",
            viewMode === 'grid' ? "grid grid-cols-4" : "space-y-2"
          )}>
            {filteredFiles.map((file) => (
              <Card
                key={file.id}
                className={cn(
                  "transition-all duration-200 cursor-pointer hover:shadow-md",
                  selectedFiles.has(file.id) ? "ring-2 ring-blue-500" : ""
                )}
                onClick={() => onFileSelect(file)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </h4>
                        {file.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                        {file.isPublic && <Eye className="h-3 w-3 text-green-500" />}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {file.type === 'file' ? formatFileSize(file.size) : 'Folder'}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {file.updatedAt.toLocaleDateString()}
                        </span>
                      </div>
                      
                      {file.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {file.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                              {tag}
                            </Badge>
                          ))}
                          {file.tags.length > 2 && (
                            <span className="text-xs text-gray-400">+{file.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleStar(file.id)
                        }}
                        className="h-6 w-6 p-0"
                      >
                        {file.isStarred ? (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        ) : (
                          <StarOff className="h-3 w-3" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFileShare(file.id)
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Share className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFileDelete(file.id)
                        }}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {isUploading && Object.keys(uploadProgress).length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Uploading Files</h4>
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{filename}</span>
                <span className="text-gray-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        accept=".ipynb,.csv,.json,.txt,.png,.jpg,.jpeg,.gif"
      />
    </div>
  )
}
