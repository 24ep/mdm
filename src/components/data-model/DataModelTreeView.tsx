'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Database, 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  FolderPlus,
  Move,
  Share2,
  Eye,
  EyeOff,
  GripVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface DataModel {
  id: string
  name: string
  display_name?: string
  description?: string
  folder_id?: string
  icon?: string
  primary_color?: string
  tags?: string[]
  shared_spaces?: any[]
  created_at?: string
  updated_at?: string
}

interface Folder {
  id: string
  name: string
  description?: string
  parent_id?: string
  children?: Folder[]
  models?: DataModel[]
  created_at?: string
  updated_at?: string
}

interface DataModelTreeViewProps {
  models: DataModel[]
  folders: Folder[]
  loading?: boolean
  searchValue: string
  onSearchChange: (value: string) => void
  onModelEdit: (model: DataModel) => void
  onModelDelete: (model: DataModel) => void
  onModelMove: (modelId: string, folderId: string | null) => void
  onModelShare: (model: DataModel) => void
  onCreateModel: () => void
  onCreateFolder: (name: string, parentId?: string) => void
  onEditFolder: (folder: Folder) => void
  onDeleteFolder: (folder: Folder) => void
  onFolderExpand?: (folderId: string) => void
  onFolderCollapse?: (folderId: string) => void
  expandedFolders?: Set<string>
}

export function DataModelTreeView({
  models,
  folders,
  loading = false,
  searchValue,
  onSearchChange,
  onModelEdit,
  onModelDelete,
  onModelMove,
  onModelShare,
  onCreateModel,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onFolderExpand,
  onFolderCollapse,
  expandedFolders = new Set()
}: DataModelTreeViewProps) {
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [selectedParentFolder, setSelectedParentFolder] = useState<string | null>(null)
  const [draggedModel, setDraggedModel] = useState<DataModel | null>(null)
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null)

  // Build tree structure
  const treeStructure = useMemo(() => {
    const folderMap = new Map<string, Folder>()
    const rootFolders: Folder[] = []
    
    // Create folder map
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [], models: [] })
    })
    
    // Build hierarchy
    folders.forEach(folder => {
      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id)
        if (parent) {
          parent.children!.push(folderMap.get(folder.id)!)
        }
      } else {
        rootFolders.push(folderMap.get(folder.id)!)
      }
    })
    
    // Add models to folders
    models.forEach(model => {
      if (model.folder_id) {
        const folder = folderMap.get(model.folder_id)
        if (folder) {
          folder.models!.push(model)
        }
      }
    })
    
    return rootFolders
  }, [folders, models])

  // Filter models based on search
  const filteredModels = useMemo(() => {
    if (!searchValue) return models
    
    const query = searchValue.toLowerCase()
    return models.filter(model => 
      (model.name || '').toLowerCase().includes(query) ||
      (model.display_name || '').toLowerCase().includes(query) ||
      (model.description || '').toLowerCase().includes(query) ||
      (model.tags || []).some(tag => tag.toLowerCase().includes(query))
    )
  }, [models, searchValue])

  const rootModels = filteredModels.filter(model => !model.folder_id)

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('Folder name is required')
      return
    }
    
    onCreateFolder(newFolderName.trim(), selectedParentFolder || undefined)
    setNewFolderName('')
    setNewFolderDescription('')
    setSelectedParentFolder(null)
    setShowCreateFolderDialog(false)
  }

  const handleDragStart = (e: React.DragEvent, model: DataModel) => {
    setDraggedModel(model)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', model.id)
  }

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverFolder(folderId)
  }

  const handleDragLeave = () => {
    setDragOverFolder(null)
  }

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault()
    setDragOverFolder(null)
    
    if (!draggedModel) return
    
    // Don't move if dropping on the same folder
    if (draggedModel.folder_id === targetFolderId) return
    
    onModelMove(draggedModel.id, targetFolderId)
    setDraggedModel(null)
  }

  const handleDragEnd = () => {
    setDraggedModel(null)
    setDragOverFolder(null)
  }

  const toggleFolder = (folderId: string) => {
    if (expandedFolders.has(folderId)) {
      onFolderCollapse?.(folderId)
    } else {
      onFolderExpand?.(folderId)
    }
  }

  const renderFolder = (folder: Folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const hasModels = folder.models && folder.models.length > 0
    const hasChildren = folder.children && folder.children.length > 0
    
    return (
      <div key={folder.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-50 transition-colors",
            level > 0 && "ml-4",
            dragOverFolder === folder.id && "bg-blue-100 border-2 border-blue-300 border-dashed"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
        >
          <button
            onClick={() => toggleFolder(folder.id)}
            className="p-1 hover:bg-gray-200 rounded"
            disabled={!hasModels && !hasChildren}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
          
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500" />
          )}
          
          <span className="font-medium text-gray-900 flex-1">{folder.name}</span>
          
          {folder.description && (
            <span className="text-sm text-gray-500 truncate max-w-32">
              {folder.description}
            </span>
          )}
          
          <Badge variant="outline" className="text-xs">
            {folder.models?.length || 0} models
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditFolder(folder)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Folder
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteFolder(folder)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {isExpanded && (
          <div className="ml-4">
            {/* Render folder models */}
            {folder.models?.map(model => (
              <div
                key={model.id}
                className={cn(
                  "flex items-center gap-2 p-2 ml-4 rounded-md hover:bg-gray-50 transition-colors cursor-move",
                  draggedModel?.id === model.id && "opacity-50"
                )}
                draggable
                onDragStart={(e) => handleDragStart(e, model)}
                onDragEnd={handleDragEnd}
              >
                <GripVertical className="h-3 w-3 text-gray-400" />
                <Database className="h-4 w-4 text-gray-500" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {model.display_name || model.name}
                  </div>
                  {model.description && (
                    <div className="text-xs text-gray-500 truncate">
                      {model.description}
                    </div>
                  )}
                  {model.tags && model.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {model.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {model.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{model.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onModelEdit(model)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onModelShare(model)}
                    className="h-6 w-6 p-0"
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onModelDelete(model)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Render child folders */}
            {folder.children?.map(childFolder => renderFolder(childFolder, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderRootModels = () => {
    if (rootModels.length === 0) return null
    
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 p-2 text-sm font-medium text-gray-700 border-b">
          <Database className="h-4 w-4" />
          Root Models ({rootModels.length})
        </div>
        {rootModels.map(model => (
          <div
            key={model.id}
            className={cn(
              "flex items-center gap-2 p-2 ml-4 rounded-md hover:bg-gray-50 transition-colors cursor-move",
              draggedModel?.id === model.id && "opacity-50"
            )}
            draggable
            onDragStart={(e) => handleDragStart(e, model)}
            onDragEnd={handleDragEnd}
          >
            <GripVertical className="h-3 w-3 text-gray-400" />
            <Database className="h-4 w-4 text-gray-500" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {model.display_name || model.name}
              </div>
              {model.description && (
                <div className="text-xs text-gray-500 truncate">
                  {model.description}
                </div>
              )}
              {model.tags && model.tags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {model.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {model.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{model.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onModelEdit(model)}
                className="h-6 w-6 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onModelShare(model)}
                className="h-6 w-6 p-0"
              >
                <Share2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onModelDelete(model)}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <span>Data Models</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreateFolderDialog(true)}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button size="sm" onClick={onCreateModel}>
              <Plus className="h-4 w-4 mr-2" />
              New Model
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Organize your data models in folders and categories
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search models and folders..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tree View */}
        <div className="border rounded-lg p-4 min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Root Models Drop Zone */}
              <div
                className={cn(
                  "p-4 rounded-lg border-2 border-dashed transition-colors",
                  dragOverFolder === 'root' 
                    ? "bg-blue-100 border-blue-300" 
                    : "border-gray-200 hover:border-gray-300"
                )}
                onDragOver={(e) => handleDragOver(e, 'root')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, null)}
              >
                <div className="text-center text-sm text-gray-500 mb-2">
                  Drop models here to move them to root level
                </div>
                
                {/* Root Models */}
                {renderRootModels()}
              </div>
              
              {/* Folders */}
              {treeStructure.map(folder => renderFolder(folder))}
              
              {/* Empty State */}
              {models.length === 0 && folders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No data models yet</p>
                  <p className="text-sm">Create your first data model to get started</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your data models
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name..."
                autoFocus
              />
            </div>
            
            <div>
              <Label htmlFor="folder-description">Description (Optional)</Label>
              <Input
                id="folder-description"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                placeholder="Enter folder description..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateFolderDialog(false)
                setNewFolderName('')
                setNewFolderDescription('')
                setSelectedParentFolder(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
