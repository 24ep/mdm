'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  HardDrive, 
  Folder, 
  File, 
  Upload, 
  Download,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Settings,
  Eye,
  Copy,
  Move,
  Archive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Database,
  Image,
  Video,
  Music,
  FileText,
  Code,
  Archive as ArchiveIcon,
  FolderOpen,
  FolderPlus
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface FileSystemItem {
  id: string
  name: string
  type: 'file' | 'directory'
  path: string
  size: number
  permissions: string
  owner: string
  group: string
  modified: Date
  accessed: Date
  created: Date
  isHidden: boolean
  isSymlink: boolean
  mimeType?: string
  extension?: string
  spaceId?: string
  spaceName?: string
  isAttachment: boolean
  attachmentId?: string
}

interface StorageStats {
  totalSpace: number
  usedSpace: number
  freeSpace: number
  inodes: {
    total: number
    used: number
    free: number
  }
  mountPoint: string
  fileSystem: string
  readOnly: boolean
}

interface FileOperation {
  id: string
  type: 'upload' | 'download' | 'delete' | 'move' | 'copy' | 'rename'
  source: string
  destination?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  progress: number
  started: Date
  completed?: Date
  error?: string
}

interface DirectoryTree {
  name: string
  path: string
  type: 'directory' | 'file'
  size: number
  children?: DirectoryTree[]
  isExpanded?: boolean
}

export function FileSystemManagement() {
  const [currentPath, setCurrentPath] = useState('/')
  const [items, setItems] = useState<FileSystemItem[]>([])
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [operations, setOperations] = useState<FileOperation[]>([])
  const [directoryTree, setDirectoryTree] = useState<DirectoryTree[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [spaces, setSpaces] = useState<Array<{id: string, name: string}>>([])
  const [selectedSpace, setSelectedSpace] = useState<string>('all')

  const [newFolderName, setNewFolderName] = useState('')
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null)

  useEffect(() => {
    loadSpaces()
    loadStorageStats()
    loadDirectoryTree()
    loadOperations()
  }, [])

  const loadSpaces = async () => {
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data.spaces || [])
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
    }
  }

  useEffect(() => {
    loadDirectoryContents(currentPath)
  }, [currentPath])

  const loadStorageStats = async () => {
    try {
      const response = await fetch('/api/admin/filesystem/stats')
      if (response.ok) {
        const data = await response.json()
        setStorageStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading storage stats:', error)
    }
  }

  const loadDirectoryContents = async (path: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/filesystem/contents?path=${encodeURIComponent(path)}`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items.map((item: any) => ({
          ...item,
          modified: new Date(item.modified),
          accessed: new Date(item.accessed),
          created: new Date(item.created)
        })))
      }
    } catch (error) {
      console.error('Error loading directory contents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDirectoryTree = async () => {
    try {
      const response = await fetch('/api/admin/filesystem/tree')
      if (response.ok) {
        const data = await response.json()
        setDirectoryTree(data.tree)
      }
    } catch (error) {
      console.error('Error loading directory tree:', error)
    }
  }

  const loadOperations = async () => {
    try {
      const response = await fetch('/api/admin/filesystem/operations')
      if (response.ok) {
        const data = await response.json()
        setOperations(data.operations.map((op: any) => ({
          ...op,
          started: new Date(op.started),
          completed: op.completed ? new Date(op.completed) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading operations:', error)
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const response = await fetch('/api/admin/filesystem/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentPath,
          name: newFolderName
        })
      })

      if (response.ok) {
        setShowCreateFolderDialog(false)
        setNewFolderName('')
        loadDirectoryContents(currentPath)
        loadDirectoryTree()
      }
    } catch (error) {
      console.error('Error creating folder:', error)
    }
  }

  const handleUploadFiles = async () => {
    if (!uploadFiles || uploadFiles.length === 0) return

    const formData = new FormData()
    Array.from(uploadFiles).forEach(file => {
      formData.append('files', file)
    })
    formData.append('path', currentPath)

    try {
      const response = await fetch('/api/admin/filesystem/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        setShowUploadDialog(false)
        setUploadFiles(null)
        loadDirectoryContents(currentPath)
        loadOperations()
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    }
  }

  const deleteItems = async (itemIds: string[]) => {
    if (!confirm(`Are you sure you want to delete ${itemIds.length} item(s)?`)) return

    try {
      const response = await fetch('/api/admin/filesystem/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds })
      })

      if (response.ok) {
        setSelectedItems([])
        loadDirectoryContents(currentPath)
        loadOperations()
      }
    } catch (error) {
      console.error('Error deleting items:', error)
    }
  }

  const downloadItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/admin/filesystem/download/${itemId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = items.find(item => item.id === itemId)?.name || 'download'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading item:', error)
    }
  }

  const getFileIcon = (item: FileSystemItem) => {
    if (item.type === 'directory') {
      return <Folder className="h-4 w-4 text-blue-500" />
    }

    const mimeType = item.mimeType || ''
    const extension = item.extension || ''

    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-green-500" />
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4 text-purple-500" />
    if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4 text-pink-500" />
    if (mimeType.startsWith('text/')) return <FileText className="h-4 w-4 text-gray-500" />
    if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs'].includes(extension)) {
      return <Code className="h-4 w-4 text-orange-500" />
    }
    if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(extension)) {
      return <ArchiveIcon className="h-4 w-4 text-yellow-500" />
    }

    return <File className="h-4 w-4 text-gray-500" />
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSpace = selectedSpace === 'all' || item.spaceId === selectedSpace
      return matchesSearch && matchesSpace
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'modified':
          comparison = a.modified.getTime() - b.modified.getTime()
          break
        default:
          comparison = 0
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HardDrive className="h-6 w-6" />
            File System Management
          </h2>
          <p className="text-muted-foreground">
            File system monitoring, storage management, and file operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadDirectoryContents(currentPath)} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Storage Statistics */}
      {storageStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Space</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(storageStats.totalSpace)}</div>
              <div className="text-xs text-muted-foreground">
                {storageStats.fileSystem} filesystem
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Used Space</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(storageStats.usedSpace)}</div>
              <div className="text-xs text-muted-foreground">
                {((storageStats.usedSpace / storageStats.totalSpace) * 100).toFixed(1)}% used
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Free Space</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(storageStats.freeSpace)}</div>
              <div className="text-xs text-muted-foreground">
                Available space
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inodes</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storageStats.inodes.used.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {storageStats.inodes.free.toLocaleString()} free
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="files" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="tree">Tree</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-6">
          {/* Navigation and Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPath(currentPath.split('/').slice(0, -1).join('/') || '/')}
                disabled={currentPath === '/'}
              >
                ← Back
              </Button>
              <span className="text-sm text-muted-foreground font-mono">
                {currentPath}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by space" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Spaces</SelectItem>
                  {spaces.map(space => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search files..."
                className="w-64"
              />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                  <SelectItem value="modified">Modified</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Files</DialogTitle>
                  <DialogDescription>
                    Select files to upload to {currentPath}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Select Files</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={(e) => setUploadFiles(e.target.files)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUploadFiles} disabled={!uploadFiles || uploadFiles.length === 0}>
                    Upload Files
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Folder</DialogTitle>
                  <DialogDescription>
                    Create a new folder in {currentPath}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="folder-name">Folder Name</Label>
                    <Input
                      id="folder-name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="New Folder"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateFolderDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createFolder} disabled={!newFolderName.trim()}>
                    Create Folder
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {selectedItems.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => deleteItems(selectedItems)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedItems.length})
              </Button>
            )}
          </div>

          {/* File List */}
          <Card>
            <CardHeader>
              <CardTitle>Directory Contents</CardTitle>
              <CardDescription>
                {filteredItems.length} items in {currentPath}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading directory contents...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No files found</h3>
                  <p className="text-muted-foreground">
                    This directory is empty or no files match your search
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer ${
                        selectedItems.includes(item.id) ? 'bg-muted' : ''
                      }`}
                      onClick={() => {
                        if (item.type === 'directory') {
                          setCurrentPath(item.path)
                        } else {
                          setSelectedItems(prev => 
                            prev.includes(item.id) 
                              ? prev.filter(id => id !== item.id)
                              : [...prev, item.id]
                          )
                        }
                      }}
                    >
                      <div className="flex-shrink-0">
                        {getFileIcon(item)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{item.name}</span>
                          {item.isHidden && (
                            <Badge variant="outline" className="text-xs">Hidden</Badge>
                          )}
                          {item.isSymlink && (
                            <Badge variant="outline" className="text-xs">Symlink</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.type === 'directory' ? 'Directory' : `${formatBytes(item.size)} • ${item.mimeType || 'Unknown type'}`}
                          {item.spaceName && (
                            <span className="ml-2 text-blue-600">• {item.spaceName}</span>
                          )}
                          {item.isAttachment && (
                            <Badge variant="outline" className="ml-2 text-xs">Attachment</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Modified: {formatDate(item.modified)} • {item.permissions} • {item.owner}:{item.group}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.type === 'file' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadItem(item.id)
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tree" className="space-y-6">
          <h3 className="text-lg font-semibold">Directory Tree</h3>
          <Card>
            <CardContent className="p-4">
              <ScrollArea className="h-[600px]">
                <div className="space-y-1">
                  {directoryTree.map(item => (
                    <div key={item.path} className="flex items-center gap-2 py-1">
                      {item.type === 'directory' ? (
                        <Folder className="h-4 w-4 text-blue-500" />
                      ) : (
                        <File className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="text-sm">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({formatBytes(item.size)})
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <h3 className="text-lg font-semibold">File Operations</h3>
          <div className="space-y-4">
            {operations.map(operation => (
              <Card key={operation.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(operation.status)}
                      <div>
                        <div className="font-medium">{operation.type.toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground">
                          {operation.source} {operation.destination && `→ ${operation.destination}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Started: {formatDate(operation.started)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(operation.status)}>
                        {operation.status}
                      </Badge>
                      {operation.status === 'in_progress' && (
                        <div className="w-20">
                          <Progress value={operation.progress} />
                        </div>
                      )}
                    </div>
                  </div>
                  {operation.error && (
                    <div className="mt-2 text-sm text-red-600">
                      Error: {operation.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <h3 className="text-lg font-semibold">Storage Analytics</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Storage Usage</CardTitle>
                <CardDescription>Disk space utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Used', value: storageStats?.usedSpace || 0, fill: '#FF8042' },
                        { name: 'Free', value: storageStats?.freeSpace || 0, fill: '#00C49F' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {[0, 1].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatBytes(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>File Types</CardTitle>
                <CardDescription>Distribution of file types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Images</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Documents</span>
                    <span className="text-sm font-medium">30%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Videos</span>
                    <span className="text-sm font-medium">15%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Other</span>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
