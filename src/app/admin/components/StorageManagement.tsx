'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  HardDrive, 
  Folder, 
  File,
  Upload,
  Download,
  Trash2,
  MoreVertical,
  Search,
  Plus,
  RefreshCw,
  Copy,
  Eye,
  FolderPlus,
  Grid3x3,
  List,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Archive,
  Music,
  Code,
  FileImage,
  ExternalLink,
  ChevronRight,
  Settings,
  X,
  Check,
  Loader2,
  Share2,
  Edit,
  Info,
  Lock,
  Unlock,
  Move,
  Rename,
  Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { FileViewer } from '@/components/storage/FileViewer'

interface Bucket {
  id: string
  name: string
  public: boolean
  fileCount: number
  totalSize: number
  created: Date
  spaceId?: string
  spaceName?: string
}

interface StorageFile {
  id: string
  name: string
  size: number
  mimeType: string
  updatedAt: Date
  createdAt: Date
  publicUrl?: string
  bucketId: string
  bucketName: string
  path?: string
  uploadedBy?: string
  uploadedByName?: string
  type?: 'file' | 'folder'
}

export function StorageManagement() {
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [files, setFiles] = useState<StorageFile[]>([])
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [showCreateBucket, setShowCreateBucket] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')
  const [isPublicBucket, setIsPublicBucket] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [showFilePreview, setShowFilePreview] = useState<StorageFile | null>(null)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showMetadata, setShowMetadata] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [showMove, setShowMove] = useState(false)
  const [selectedFileForAction, setSelectedFileForAction] = useState<StorageFile | null>(null)
  const [renameValue, setRenameValue] = useState('')

  useEffect(() => {
    loadBuckets()
  }, [])

  useEffect(() => {
    if (selectedBucket) {
      loadFiles(selectedBucket, currentPath)
    }
  }, [selectedBucket, currentPath])

  const loadBuckets = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/storage/buckets')
      if (response.ok) {
        const data = await response.json()
        setBuckets(data.buckets || [])
        if (!selectedBucket && data.buckets?.length > 0) {
          setSelectedBucket(data.buckets[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading buckets:', error)
      toast.error('Failed to load buckets')
    } finally {
      setIsLoading(false)
    }
  }

  const loadFiles = async (bucketId: string, path: string[] = []) => {
    setIsLoading(true)
    try {
      const pathParam = path.length > 0 ? path.join('/') : ''
      const response = await fetch(`/api/admin/storage/buckets/${bucketId}/files?path=${encodeURIComponent(pathParam)}&search=${encodeURIComponent(searchTerm)}`)
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error('Error loading files:', error)
      toast.error('Failed to load files')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) return

    try {
      const response = await fetch('/api/admin/storage/buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBucketName,
          public: isPublicBucket
        })
      })

      if (response.ok) {
        toast.success('Bucket created successfully')
        setShowCreateBucket(false)
        setNewBucketName('')
        setIsPublicBucket(false)
        loadBuckets()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create bucket')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create bucket')
    }
  }

  const handleUpload = async () => {
    if (!selectedBucket || uploadFiles.length === 0) return

    const formData = new FormData()
    uploadFiles.forEach(file => {
      formData.append('files', file)
    })
    formData.append('path', currentPath.join('/'))

    try {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          uploadFiles.forEach((file, index) => {
            const progress = ((e.loaded / e.total) * 100) / uploadFiles.length
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
          })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          toast.success('Files uploaded successfully')
          setShowUploadDialog(false)
          setUploadFiles([])
          setUploadProgress({})
          loadFiles(selectedBucket, currentPath)
        }
      })

      xhr.open('POST', `/api/admin/storage/buckets/${selectedBucket}/upload`)
      xhr.send(formData)
    } catch (error) {
      toast.error('Failed to upload files')
    }
  }

  const handleDeleteFiles = async (fileIds: string[]) => {
    const filesToDelete = files.filter(f => fileIds.includes(f.id))
    const folderCount = filesToDelete.filter(f => f.type === 'folder' || f.mimeType === 'folder').length
    const fileCount = filesToDelete.length - folderCount
    
    let message = 'Are you sure you want to delete '
    if (folderCount > 0 && fileCount > 0) {
      message += `${folderCount} folder${folderCount > 1 ? 's' : ''} and ${fileCount} file${fileCount > 1 ? 's' : ''}?`
    } else if (folderCount > 0) {
      message += `${folderCount} folder${folderCount > 1 ? 's' : ''}?`
    } else {
      message += `${fileCount} file${fileCount > 1 ? 's' : ''}?`
    }
    
    if (!confirm(message)) return

    try {
      const response = await fetch('/api/admin/storage/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds })
      })

      if (response.ok) {
        const itemType = folderCount > 0 && fileCount === 0 ? 'Folder' : folderCount === 0 ? 'File' : 'Items'
        toast.success(`${itemType} deleted successfully`)
        setSelectedFiles(new Set())
        loadFiles(selectedBucket!, currentPath)
      }
    } catch (error) {
      toast.error('Failed to delete items')
    }
  }

  const handleDeleteBucket = async (bucketId: string) => {
    if (!confirm('Are you sure you want to delete this bucket? All files will be removed.')) return

    try {
      const response = await fetch(`/api/admin/storage/buckets/${bucketId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Bucket deleted successfully')
        if (selectedBucket === bucketId) {
          setSelectedBucket(null)
          setFiles([])
        }
        loadBuckets()
      }
    } catch (error) {
      toast.error('Failed to delete bucket')
    }
  }

  const handleDownload = async (file: StorageFile) => {
    try {
      const response = await fetch(`/api/admin/storage/files/${file.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      toast.error('Failed to download file')
    }
  }

  const handleCopyUrl = (file: StorageFile) => {
    if (file.publicUrl) {
      navigator.clipboard.writeText(file.publicUrl)
      toast.success('Public URL copied to clipboard')
    }
  }

  const handleCreateFolder = async () => {
    if (!selectedBucket || !newFolderName.trim()) return

    try {
      const response = await fetch(`/api/admin/storage/buckets/${selectedBucket}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          path: currentPath.join('/')
        })
      })

      if (response.ok) {
        toast.success('Folder created successfully')
        setShowCreateFolder(false)
        setNewFolderName('')
        loadFiles(selectedBucket, currentPath)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create folder')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create folder')
    }
  }

  const handleFolderClick = (file: StorageFile) => {
    // If it's a folder, navigate into it
    if (file.type === 'folder' || file.mimeType === 'folder') {
      // Extract the folder name from the path
      const pathParts = file.path ? file.path.split('/').filter(p => p) : []
      const folderName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : file.name
      setCurrentPath([...currentPath, folderName])
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(new Date(date))
  }

  const getFileIcon = (file: StorageFile) => {
    // Check if it's a folder first
    if (file.type === 'folder' || file.mimeType === 'folder') {
      return <Folder className="h-5 w-5 text-yellow-500" />
    }
    const mimeType = file.mimeType || ''
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-500" />
    if (mimeType.startsWith('video/')) return <VideoIcon className="h-5 w-5 text-purple-500" />
    if (mimeType.startsWith('audio/')) return <Music className="h-5 w-5 text-pink-500" />
    if (mimeType.startsWith('text/') || mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />
    if (mimeType.includes('zip') || mimeType.includes('archive')) return <Archive className="h-5 w-5 text-yellow-500" />
    if (mimeType.startsWith('application/javascript') || mimeType.includes('code')) return <Code className="h-5 w-5 text-green-500" />
    return <File className="h-5 w-5 text-gray-500" />
  }

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentBucket = buckets.find(b => b.id === selectedBucket)
  const breadcrumb = currentBucket ? [currentBucket.name, ...currentPath] : []

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Left Sidebar - Buckets */}
      <div className="w-64 border-r bg-white dark:bg-gray-950 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Buckets</h2>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setShowCreateBucket(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              setShowCreateBucket(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New bucket
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {buckets.map(bucket => (
              <button
                key={bucket.id}
                onClick={() => {
                  setSelectedBucket(bucket.id)
                  setCurrentPath([])
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  selectedBucket === bucket.id && "bg-gray-100 dark:bg-gray-800 font-medium"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Folder className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{bucket.name}</span>
                  </div>
                  {bucket.public && (
                    <Badge variant="outline" className="text-xs ml-2">Public</Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1 ml-6">
                  {bucket.fileCount} files • {formatBytes(bucket.totalSize)}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="border-b bg-white dark:bg-gray-950 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setCurrentPath([])}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Storage
              </button>
              {breadcrumb.map((segment, index) => (
                <div key={index} className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  <button
                    onClick={() => setCurrentPath(breadcrumb.slice(1, index + 1))}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    {segment}
                  </button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadFiles(selectedBucket!, currentPath)}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
              {selectedBucket && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateFolder(true)}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New folder
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploadDialog(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload file
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* File Browser */}
        <ScrollArea className="flex-1">
          {!selectedBucket ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <HardDrive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No bucket selected</h3>
                <p className="text-gray-500 mb-4">Select a bucket from the sidebar or create a new one</p>
                <Button onClick={() => setShowCreateBucket(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create bucket
                </Button>
              </div>
            </div>
          ) : isLoading && files.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No files found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 'Try a different search term' : 'Upload your first file to get started'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowUploadDialog(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload file
                  </Button>
                )}
              </div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles(new Set(filteredFiles.map(f => f.id)))
                          } else {
                            setSelectedFiles(new Set())
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Last modified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map(file => {
                    const isFolder = file.type === 'folder' || file.mimeType === 'folder'
                    return (
                    <TableRow
                      key={file.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                      onClick={(e) => {
                        // Don't open preview if clicking checkbox or menu
                        if ((e.target as HTMLElement).closest('input[type="checkbox"]') || 
                            (e.target as HTMLElement).closest('[role="menuitem"]')) {
                          return
                        }
                        if (isFolder) {
                          handleFolderClick(file)
                        } else {
                          setShowFilePreview(file)
                        }
                      }}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            const newSelected = new Set(selectedFiles)
                            if (e.target.checked) {
                              newSelected.add(file.id)
                            } else {
                              newSelected.delete(file.id)
                            }
                            setSelectedFiles(newSelected)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(file)}
                          <span className="font-medium">{file.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500">{isFolder ? '—' : formatBytes(file.size)}</TableCell>
                      <TableCell className="text-gray-500">{formatDate(file.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem 
                              onClick={(e) => { 
                                e.stopPropagation()
                                setShowFilePreview(file)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View / Preview
                            </DropdownMenuItem>
                            {!isFolder && (
                              <>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(file) }}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                {file.publicUrl && (
                                  <>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyUrl(file) }}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy URL
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(file.publicUrl, '_blank') }}>
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Open in new tab
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => { 
                                e.stopPropagation()
                                setSelectedFileForAction(file)
                                setRenameValue(file.name)
                                setShowRename(true)
                              }}
                            >
                              <Rename className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { 
                                e.stopPropagation()
                                setSelectedFileForAction(file)
                                setShowMove(true)
                              }}
                            >
                              <Move className="h-4 w-4 mr-2" />
                              Move
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { 
                                e.stopPropagation()
                                setSelectedFileForAction(file)
                                setShowPermissions(true)
                              }}
                            >
                              <Lock className="h-4 w-4 mr-2" />
                              Permissions
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { 
                                e.stopPropagation()
                                setSelectedFileForAction(file)
                                setShowMetadata(true)
                              }}
                            >
                              <Info className="h-4 w-4 mr-2" />
                              Metadata
                            </DropdownMenuItem>
                            {!isFolder && (
                              <DropdownMenuItem 
                                onClick={(e) => { 
                                  e.stopPropagation()
                                  setSelectedFileForAction(file)
                                  // TODO: Implement share functionality
                                  toast.success('Share functionality coming soon')
                                }}
                              >
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteFiles([file.id])
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredFiles.map(file => {
                const isFolder = file.type === 'folder' || file.mimeType === 'folder'
                return (
                <div
                  key={file.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer group relative"
                  onClick={(e) => {
                    // Don't open preview if clicking menu
                    if ((e.target as HTMLElement).closest('[role="menuitem"]')) {
                      return
                    }
                    if (isFolder) {
                      handleFolderClick(file)
                    } else {
                      setShowFilePreview(file)
                    }
                  }}
                >
                  <div className="aspect-square mb-3 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
                    {file.mimeType?.startsWith('image/') && file.publicUrl ? (
                      <img
                        src={file.publicUrl}
                        alt={file.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="flex items-center justify-center">
                        {getFileIcon(file)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{isFolder ? 'Folder' : formatBytes(file.size)}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem 
                          onClick={(e) => { 
                            e.stopPropagation()
                            setShowFilePreview(file)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View / Preview
                        </DropdownMenuItem>
                        {!isFolder && (
                          <>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(file) }}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            {file.publicUrl && (
                              <>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyUrl(file) }}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy URL
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(file.publicUrl, '_blank') }}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open in new tab
                                </DropdownMenuItem>
                              </>
                            )}
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => { 
                            e.stopPropagation()
                            setSelectedFileForAction(file)
                            setRenameValue(file.name)
                            setShowRename(true)
                          }}
                        >
                          <Rename className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => { 
                            e.stopPropagation()
                            setSelectedFileForAction(file)
                            setShowMove(true)
                          }}
                        >
                          <Move className="h-4 w-4 mr-2" />
                          Move
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => { 
                            e.stopPropagation()
                            setSelectedFileForAction(file)
                            setShowPermissions(true)
                          }}
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => { 
                            e.stopPropagation()
                            setSelectedFileForAction(file)
                            setShowMetadata(true)
                          }}
                        >
                          <Info className="h-4 w-4 mr-2" />
                          Metadata
                        </DropdownMenuItem>
                        {!isFolder && (
                          <DropdownMenuItem 
                            onClick={(e) => { 
                              e.stopPropagation()
                              setSelectedFileForAction(file)
                              toast.success('Share functionality coming soon')
                            }}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFiles([file.id])
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )})}
            </div>
          )}
        </ScrollArea>

        {/* Selected Files Actions Bar */}
        {selectedFiles.size > 0 && (
          <div className="border-t bg-white dark:bg-gray-950 px-6 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteFiles(Array.from(selectedFiles))}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFiles(new Set())}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Bucket Dialog */}
      <Dialog open={showCreateBucket} onOpenChange={setShowCreateBucket}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new bucket</DialogTitle>
            <DialogDescription>
              Buckets are containers for your files. Choose a unique name for your bucket.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
                placeholder="bucket-name"
                className="font-mono"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Public bucket</label>
                <p className="text-xs text-gray-500">Anyone with the URL can access files</p>
              </div>
              <button
                onClick={() => setIsPublicBucket(!isPublicBucket)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  isPublicBucket ? "bg-green-500" : "bg-gray-200"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    isPublicBucket ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateBucket(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBucket} disabled={!newBucketName.trim()}>
              Create bucket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload files</DialogTitle>
            <DialogDescription>
              Select files to upload to {currentBucket?.name || 'bucket'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-sm font-medium text-primary">Click to upload</span>
                <span className="text-sm text-gray-500"> or drag and drop</span>
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  setUploadFiles(files)
                }}
              />
            </div>
            {uploadFiles.length > 0 && (
              <div className="space-y-2">
                {uploadFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">{formatBytes(file.size)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowUploadDialog(false)
              setUploadFiles([])
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploadFiles.length === 0}>
              Upload {uploadFiles.length} file{uploadFiles.length > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new folder</DialogTitle>
            <DialogDescription>
              {currentPath.length > 0 
                ? `Create a folder in ${currentPath.join(' / ')}`
                : 'Create a folder in the current location'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Folder name</label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="my-folder"
                className="font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFolderName.trim()) {
                    handleCreateFolder()
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateFolder(false)
              setNewFolderName('')
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      {showFilePreview && (
        <Dialog open={!!showFilePreview} onOpenChange={() => setShowFilePreview(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    {getFileIcon(showFilePreview)}
                    {showFilePreview.name}
                  </DialogTitle>
                  <DialogDescription>
                    {formatBytes(showFilePreview.size)} • {formatDate(showFilePreview.updatedAt)} • {showFilePreview.mimeType}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(showFilePreview)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilePreview(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="mt-4">
              <FileViewer
                fileId={showFilePreview.id}
                fileName={showFilePreview.name}
                mimeType={showFilePreview.mimeType || 'application/octet-stream'}
                publicUrl={showFilePreview.publicUrl}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Metadata Dialog */}
      <Dialog open={showMetadata} onOpenChange={setShowMetadata}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File Metadata</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedFileForAction?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedFileForAction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-sm mt-1">{selectedFileForAction.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Size</label>
                  <p className="text-sm mt-1">{formatBytes(selectedFileForAction.size)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">MIME Type</label>
                  <p className="text-sm mt-1">{selectedFileForAction.mimeType || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-sm mt-1">{selectedFileForAction.type || 'file'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Path</label>
                  <p className="text-sm mt-1">{selectedFileForAction.path || 'Root'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Bucket</label>
                  <p className="text-sm mt-1">{selectedFileForAction.bucketName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm mt-1">{formatDate(selectedFileForAction.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Modified</label>
                  <p className="text-sm mt-1">{formatDate(selectedFileForAction.updatedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Uploaded By</label>
                  <p className="text-sm mt-1">{selectedFileForAction.uploadedByName || 'Unknown'}</p>
                </div>
                {selectedFileForAction.publicUrl && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Public URL</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={selectedFileForAction.publicUrl} readOnly className="text-xs" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyUrl(selectedFileForAction!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowMetadata(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File Permissions</DialogTitle>
            <DialogDescription>
              Manage access permissions for {selectedFileForAction?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedFileForAction && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Public Access</label>
                  <p className="text-xs text-gray-500">Allow public access via URL</p>
                </div>
                <button
                  onClick={() => {
                    // TODO: Implement permission toggle
                    toast.success('Permission update coming soon')
                  }}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    selectedFileForAction.publicUrl ? "bg-green-500" : "bg-gray-200"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      selectedFileForAction.publicUrl ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
              <div className="border-t pt-4">
                <label className="text-sm font-medium mb-2 block">Access Control</label>
                <p className="text-xs text-gray-500 mb-4">Fine-grained permissions coming soon</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Owner</span>
                    <Badge variant="outline">Full Access</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Space Members</span>
                    <Badge variant="outline">View</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissions(false)}>Cancel</Button>
            <Button onClick={() => {
              toast.success('Permissions updated')
              setShowPermissions(false)
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {selectedFileForAction?.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
            <DialogDescription>
              Enter a new name for {selectedFileForAction?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Enter new name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && renameValue.trim()) {
                    // TODO: Implement rename
                    toast.success('Rename functionality coming soon')
                    setShowRename(false)
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRename(false)
              setRenameValue('')
            }}>Cancel</Button>
            <Button onClick={() => {
              // TODO: Implement rename API call
              toast.success('Rename functionality coming soon')
              setShowRename(false)
              setRenameValue('')
            }} disabled={!renameValue.trim()}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={showMove} onOpenChange={setShowMove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move {selectedFileForAction?.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
            <DialogDescription>
              Select a destination folder for {selectedFileForAction?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Destination</label>
              <p className="text-xs text-gray-500 mb-4">
                Current location: {currentPath.length > 0 ? currentPath.join(' / ') : 'Root'}
              </p>
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-500">Folder selection coming soon</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMove(false)}>Cancel</Button>
            <Button onClick={() => {
              toast.success('Move functionality coming soon')
              setShowMove(false)
            }}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
