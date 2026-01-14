'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Plus,
    Folder,
    FolderOpen,
    File,
    ChevronRight,
    ChevronDown,
    RefreshCw,
    HardDrive,
    Cloud,
    Server,
    FileText,
    Image as ImageIcon,
    FileArchive,
    Film,
    Music,
    AlertCircle,
    Home,
    Database
} from 'lucide-react'
import { StorageConnectionDialog } from '@/app/admin/features/system/components/StorageConnectionDialog'
import { StorageConnectionFormData } from '@/app/admin/features/system/components/StorageConnectionForm'
import toast from 'react-hot-toast'

interface StorageConnection {
    id: string
    name: string
    type: string
    description?: string
}

interface FolderNode {
    name: string
    path: string
    isExpanded?: boolean
    children?: FolderNode[]
}

interface FileItem {
    name: string
    path: string
    size: number
    lastModified: string
    type: 'file' | 'folder'
}

interface AttachmentBrowserProps {
    spaceId: string
}

export function AttachmentBrowser({ spaceId }: AttachmentBrowserProps) {
    const [connections, setConnections] = useState<StorageConnection[]>([])
    const [selectedConnectionId, setSelectedConnectionId] = useState<string>('')
    const [isLoadingConnections, setIsLoadingConnections] = useState(false)
    const [showNewConnectionDialog, setShowNewConnectionDialog] = useState(false)

    // File browser state
    const [currentPath, setCurrentPath] = useState('/')
    const [folderTree, setFolderTree] = useState<FolderNode[]>([])
    const [directoryContents, setDirectoryContents] = useState<FileItem[]>([])
    const [isLoadingBrowser, setIsLoadingBrowser] = useState(false)
    const [browserError, setBrowserError] = useState<string | null>(null)

    // Load available connections
    useEffect(() => {
        loadConnections()
    }, [])

    // Load directory when connection or path changes
    useEffect(() => {
        if (selectedConnectionId) {
            loadDirectory(currentPath)
        }
    }, [selectedConnectionId, currentPath])

    const loadConnections = async () => {
        setIsLoadingConnections(true)
        try {
            const res = await fetch('/api/storage/available')
            if (res.ok) {
                const data = await res.json()
                setConnections(data.connections || [])
                // Auto-select first connection if available
                if (data.connections?.length > 0 && !selectedConnectionId) {
                    setSelectedConnectionId(data.connections[0].id)
                }
            }
        } catch (error) {
            console.error('Failed to load connections:', error)
        } finally {
            setIsLoadingConnections(false)
        }
    }

    const loadDirectory = async (path: string) => {
        if (!selectedConnectionId) return

        setIsLoadingBrowser(true)
        setBrowserError(null)
        try {
            const res = await fetch(`/api/storage/${selectedConnectionId}/browse?path=${encodeURIComponent(path)}`)
            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to load directory')
            }
            const data = await res.json()
            setDirectoryContents(data.items || [])

            // Update folder tree if at root
            if (path === '/') {
                const folders = (data.items || [])
                    .filter((item: FileItem) => item.type === 'folder')
                    .map((f: FileItem) => ({ name: f.name, path: f.path, children: undefined }))
                setFolderTree(folders)
            }
        } catch (error: any) {
            setBrowserError(error.message)
            setDirectoryContents([])
        } finally {
            setIsLoadingBrowser(false)
        }
    }

    const handleConnectionChange = (connectionId: string) => {
        setSelectedConnectionId(connectionId)
        setCurrentPath('/')
        setFolderTree([])
        setDirectoryContents([])
    }

    const handleCreateConnection = async (data: StorageConnectionFormData) => {
        try {
            const res = await fetch('/api/admin/storage/connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    type: data.type,
                    description: data.description,
                    isActive: true,
                    config: data.config
                })
            })

            if (!res.ok) throw new Error('Failed to create connection')

            const result = await res.json()
            toast.success('Connection created successfully')
            setShowNewConnectionDialog(false)
            await loadConnections()
            setSelectedConnectionId(result.connection.id)
        } catch (error: any) {
            toast.error(error.message || 'Failed to create connection')
            throw error
        }
    }

    const handleFolderClick = (folder: FileItem | FolderNode) => {
        setCurrentPath(folder.path)
    }

    const handleBreadcrumbClick = (path: string) => {
        setCurrentPath(path)
    }

    const getFileIcon = (item: FileItem) => {
        if (item.type === 'folder') {
            return <Folder className="h-5 w-5 text-yellow-500" />
        }

        const ext = item.name.split('.').pop()?.toLowerCase() || ''
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
            return <ImageIcon className="h-5 w-5 text-green-500" />
        }
        if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
            return <Film className="h-5 w-5 text-purple-500" />
        }
        if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
            return <Music className="h-5 w-5 text-pink-500" />
        }
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
            return <FileArchive className="h-5 w-5 text-orange-500" />
        }
        if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) {
            return <FileText className="h-5 w-5 text-blue-500" />
        }
        return <File className="h-5 w-5 text-muted-foreground" />
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const getBreadcrumbs = () => {
        const parts = currentPath.split('/').filter(Boolean)
        const crumbs = [{ name: 'Root', path: '/' }]
        let accPath = ''
        for (const part of parts) {
            accPath += '/' + part
            crumbs.push({ name: part, path: accPath })
        }
        return crumbs
    }

    const getConnectionIcon = (type: string) => {
        if (['s3', 'minio', 'google_drive', 'onedrive'].includes(type)) {
            return <Cloud className="h-4 w-4" />
        }
        return <Server className="h-4 w-4" />
    }

    const selectedConnection = connections.find(c => c.id === selectedConnectionId)

    return (
        <div className="space-y-4">
            {/* Connection Selector Header */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Database Connection:</span>
                </div>
                <div className="flex-1 max-w-md">
                    <Select value={selectedConnectionId} onValueChange={handleConnectionChange}>
                        <SelectTrigger>
                            <SelectValue placeholder={isLoadingConnections ? 'Loading...' : 'Select a database connection'} />
                        </SelectTrigger>
                        <SelectContent>
                            {connections.map(conn => (
                                <SelectItem key={conn.id} value={conn.id}>
                                    <div className="flex items-center gap-2">
                                        {getConnectionIcon(conn.type)}
                                        <span>{conn.name}</span>
                                        <Badge variant="outline" className="text-xs ml-2">{conn.type}</Badge>
                                    </div>
                                </SelectItem>
                            ))}
                            {connections.length === 0 && !isLoadingConnections && (
                                <div className="p-2 text-sm text-muted-foreground text-center">
                                    No connections available
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowNewConnectionDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                </Button>
                {selectedConnectionId && (
                    <Button variant="ghost" size="sm" onClick={() => loadDirectory(currentPath)}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* File Browser */}
            {selectedConnectionId ? (
                <div className="grid grid-cols-12 gap-4 min-h-[500px]">
                    {/* Left Panel - Folder Tree */}
                    <Card className="col-span-4 bg-card">
                        <CardHeader className="py-3 px-4 border-b">
                            <CardTitle className="text-sm font-medium">Folders on Bucket</CardTitle>
                        </CardHeader>
                        <ScrollArea className="h-[450px]">
                            <div className="p-2">
                                {/* Root folder */}
                                <button
                                    onClick={() => handleBreadcrumbClick('/')}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-muted transition-colors ${currentPath === '/' ? 'bg-primary/10 text-primary' : ''}`}
                                >
                                    <Home className="h-4 w-4" />
                                    <span className="text-sm">Root</span>
                                </button>

                                {/* Folder tree */}
                                {folderTree.map(folder => (
                                    <FolderTreeItem
                                        key={folder.path}
                                        folder={folder}
                                        currentPath={currentPath}
                                        onSelect={handleFolderClick}
                                        level={1}
                                    />
                                ))}

                                {isLoadingBrowser && folderTree.length === 0 && (
                                    <div className="flex items-center justify-center p-8">
                                        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </Card>

                    {/* Right Panel - Directory Contents */}
                    <Card className="col-span-8 bg-card">
                        <CardHeader className="py-3 px-4 border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">Folder Directory</CardTitle>
                                <div className="flex items-center gap-1 text-sm">
                                    {getBreadcrumbs().map((crumb, idx, arr) => (
                                        <span key={crumb.path} className="flex items-center">
                                            <button
                                                onClick={() => handleBreadcrumbClick(crumb.path)}
                                                className={`hover:text-primary transition-colors ${idx === arr.length - 1 ? 'font-medium' : 'text-muted-foreground'}`}
                                            >
                                                {crumb.name}
                                            </button>
                                            {idx < arr.length - 1 && <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />}
                                        </span>
                                    ))}
                                </div>
                                <Badge variant="secondary">{directoryContents.length} items</Badge>
                            </div>
                        </CardHeader>
                        <ScrollArea className="h-[450px]">
                            <div className="p-2">
                                {browserError ? (
                                    <div className="flex flex-col items-center justify-center p-8 text-center">
                                        <AlertCircle className="h-10 w-10 text-destructive mb-2" />
                                        <p className="text-destructive font-medium">Failed to load directory</p>
                                        <p className="text-sm text-muted-foreground mt-1">{browserError}</p>
                                        <Button variant="outline" size="sm" className="mt-4" onClick={() => loadDirectory(currentPath)}>
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Retry
                                        </Button>
                                    </div>
                                ) : isLoadingBrowser ? (
                                    <div className="flex items-center justify-center p-8">
                                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : directoryContents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                        <Folder className="h-10 w-10 mb-2 opacity-50" />
                                        <p>This folder is empty</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {directoryContents.map(item => (
                                            <div
                                                key={item.path}
                                                onClick={() => item.type === 'folder' && handleFolderClick(item)}
                                                className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-muted transition-colors ${item.type === 'folder' ? 'cursor-pointer' : ''}`}
                                            >
                                                {getFileIcon(item)}
                                                <span className="flex-1 text-sm truncate">{item.name}</span>
                                                {item.type === 'file' && (
                                                    <>
                                                        <span className="text-xs text-muted-foreground">{formatFileSize(item.size)}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(item.lastModified).toLocaleDateString()}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </Card>
                </div>
            ) : (
                <Card className="bg-muted/30 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <HardDrive className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Connection Selected</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Select a storage connection above to browse files, or create a new one.
                        </p>
                        <Button onClick={() => setShowNewConnectionDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Connection
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* New Connection Dialog */}
            <StorageConnectionDialog
                open={showNewConnectionDialog}
                onOpenChange={setShowNewConnectionDialog}
                onSubmit={handleCreateConnection}
                title="Add Storage Connection"
                description="Configure a new storage connection for attachments"
            />
        </div>
    )
}

// Folder Tree Item Component
function FolderTreeItem({
    folder,
    currentPath,
    onSelect,
    level
}: {
    folder: FolderNode
    currentPath: string
    onSelect: (folder: FolderNode) => void
    level: number
}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const isSelected = currentPath === folder.path

    return (
        <div>
            <button
                onClick={() => {
                    onSelect(folder)
                    setIsExpanded(!isExpanded)
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-muted transition-colors ${isSelected ? 'bg-primary/10 text-primary' : ''}`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                {folder.children && folder.children.length > 0 ? (
                    isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
                ) : (
                    <span className="w-3" />
                )}
                {isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-yellow-500" />
                ) : (
                    <Folder className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-sm truncate">{folder.name}</span>
            </button>
            {isExpanded && folder.children?.map(child => (
                <FolderTreeItem
                    key={child.path}
                    folder={child}
                    currentPath={currentPath}
                    onSelect={onSelect}
                    level={level + 1}
                />
            ))}
        </div>
    )
}
