'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  File,
  Folder,
  FolderOpen,
  FileText,
  Code,
  FileCode,
  Database,
  BarChart3,
  Brain,
  Calculator,
  Zap,
  Wand2,
  Sparkles,
  FileText as NotebookPen,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  Send,
  Smile,
  Paperclip,
  UserPlus,
  UserCheck,
  UserX,
  SortAsc,
  SortDesc,
  Maximize2,
  Minimize2,
  SplitSquareHorizontal,
  SplitSquareVertical,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Menu,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Grid,
  List,
  Layout,
  Palette,
  Sun,
  Moon,
  Monitor,
  Target,
  Filter,
  Search,
  Globe,
  Lock,
  Unlock,
  Star,
  StarOff,
  Bookmark,
  History,
  Share,
  Edit,
  Terminal,
  Activity,
  Layers,
  TrendingUp,
  PieChart,
  Scatter,
  LineChart,
  BarChart,
  Users,
  Plus,
  Trash2,
  Copy,
  Save,
  Download,
  Upload,
  Settings,
  MoreVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Pencil, Download as DownloadIcon, History as HistoryIcon } from 'lucide-react'
import { VersionsDrawer } from './VersionsDrawer'

interface NotebookSidebarProps {
  notebook: {
    id: string
    name: string
    cells: any[]
    updatedAt: Date
  }
  variables: Array<{
    name: string
    type: string
    value: string
    size?: string
  }>
  files: Array<{
    name: string
    type: 'file' | 'folder'
    size?: string
    modified: Date
  }>
  onAddCell: (type: 'code' | 'markdown' | 'raw') => void
  onOpenFile: (filePath: string) => void
  onNewFile: () => void
  onCreateFile?: (name: string) => void
  onCreateFolder?: (name: string) => void
  onNewFolder: () => void
  onUploadFile: () => void
  onDeleteFile: (filePath: string) => void
  onRenameFile: (filePath: string, newName: string) => void
  onMoveFile: (filePath: string, newPath: string) => void
  onExportFile?: (filePath?: string) => void
  onShowVersions?: (filePath?: string) => void
}

export function NotebookSidebar({
  notebook,
  variables,
  files,
  onAddCell,
  onOpenFile,
  onNewFile,
  onCreateFile,
  onCreateFolder,
  onNewFolder,
  onUploadFile,
  onDeleteFile,
  onRenameFile,
  onMoveFile,
  onExportFile,
  onShowVersions
}: NotebookSidebarProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'variables' | 'outline'>('files')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [showVersionsFor, setShowVersionsFor] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createStep, setCreateStep] = useState<'kind' | 'filetype' | 'folderName'>('kind')
  const [selectedFileType, setSelectedFileType] = useState<'ipynb' | 'csv' | 'md' | null>(null)
  const [createName, setCreateName] = useState('')
  const isNotebookSelected = selectedFile?.toLowerCase().endsWith('.ipynb') ?? false

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath)
    } else {
      newExpanded.add(folderPath)
    }
    setExpandedFolders(newExpanded)
  }

  const getFileIcon = (fileName: string, type: 'file' | 'folder') => {
    if (type === 'folder') {
      return expandedFolders.has(fileName) ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />
    }
    
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'py': return <Code className="h-4 w-4 text-blue-500" />
      case 'ipynb': return <NotebookPen className="h-4 w-4 text-orange-500" />
      case 'md': return <FileText className="h-4 w-4 text-gray-500" />
      case 'txt': return <FileText className="h-4 w-4 text-gray-500" />
      case 'csv': return <FileSpreadsheet className="h-4 w-4 text-green-500" />
      case 'json': return <FileCode className="h-4 w-4 text-yellow-500" />
      case 'png': case 'jpg': case 'jpeg': case 'gif': return <FileImage className="h-4 w-4 text-purple-500" />
      case 'mp4': case 'avi': case 'mov': return <FileVideo className="h-4 w-4 text-red-500" />
      case 'mp3': case 'wav': case 'flac': return <FileAudio className="h-4 w-4 text-pink-500" />
      default: return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const renderFilesTab = () => (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-8 text-sm"
        />
      </div>

      {/* File Actions */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => { setShowCreate(true); setCreateStep('kind') }}
          className="h-7 px-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          New
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onNewFolder}
          className="h-7 px-2 text-xs"
        >
          <Folder className="h-3 w-3 mr-1" />
          Folder
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onUploadFile}
          className="h-7 px-2 text-xs"
        >
          <Upload className="h-3 w-3 mr-1" />
          Upload
        </Button>
      </div>

      {/* File Tree */}
      <div className="space-y-1">
        {files
          .filter(file => 
            searchQuery === '' || 
            file.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((file, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 px-2 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700",
                selectedFile === file.name && "bg-blue-100 dark:bg-blue-900"
              )}
              onClick={() => {
                if (file.type === 'folder') {
                  toggleFolder(file.name)
                } else {
                  setSelectedFile(file.name)
                  onOpenFile(file.name)
                }
              }}
              draggable={file.type === 'file'}
              onDragStart={(e) => { 
                if (file.type === 'file') {
                  setDragIndex(index)
                  e.dataTransfer.effectAllowed = 'move'
                }
              }}
              onDragOver={(e) => { 
                e.preventDefault()
                if (file.type === 'folder' && dragIndex !== null) {
                  e.currentTarget.classList.add('bg-blue-100', 'dark:bg-blue-900')
                }
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900')
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900')
                
                if (dragIndex !== null && dragIndex !== index) {
                  const draggedFile = files[dragIndex]
                  // If dropping on a folder, move file into folder
                  if (file.type === 'folder') {
                    onMoveFile(draggedFile.name, `${file.name}/${draggedFile.name}`)
                  } else {
                    // Otherwise move to position
                    onMoveFile(draggedFile.name, `index:${index}`)
                  }
                }
                setDragIndex(null)
              }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getFileIcon(file.name, file.type)}
                <span className="truncate">{file.name}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {file.type === 'folder' && (
                    <DropdownMenuItem onClick={(e) => { 
                      e.stopPropagation()
                      const folderName = prompt('New folder name:', 'New Folder')
                      if (folderName && onCreateFolder) {
                        onCreateFolder(`${file.name}/${folderName}`)
                      }
                    }}>
                      <Folder className="h-4 w-4 mr-2" /> New Folder Inside
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const newName = prompt('Rename to:', file.name); if (newName) onRenameFile(file.name, newName) }}>
                    <Pencil className="h-4 w-4 mr-2" /> Rename
                  </DropdownMenuItem>
                  {file.type === 'file' && (
                    <>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onExportFile && onExportFile(file.name) }}>
                        <DownloadIcon className="h-4 w-4 mr-2" /> Export
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowVersionsFor(file.name) }}>
                        <HistoryIcon className="h-4 w-4 mr-2" /> Versions
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteFile(file.name) }} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
      </div>
    </div>
  )

  const renderVariablesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Variables</h3>
        <Badge variant="outline" className="text-xs">
          {variables.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {variables.map((variable, index) => (
          <div
            key={index}
            className="p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                {variable.name}
              </div>
              <Badge variant="secondary" className="text-xs">
                {variable.type}
              </Badge>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {variable.value}
            </div>
            {variable.size && (
              <div className="text-xs text-gray-500 mt-1">
                Size: {variable.size}
              </div>
            )}
          </div>
        ))}
        
        {variables.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No variables defined</p>
            <p className="text-xs">Run some code to see variables here</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderOutlineTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Outline</h3>
        <Badge variant="outline" className="text-xs">
          {notebook.cells.length}
        </Badge>
      </div>

      <div className="space-y-1">
        {notebook.cells.map((cell, index) => (
          <div
            key={cell.id}
            className="flex items-center gap-2 px-2 py-1 rounded text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <div className="flex items-center gap-1">
              {cell.type === 'code' && <Code className="h-3 w-3 text-blue-500" />}
              {cell.type === 'markdown' && <FileText className="h-3 w-3 text-gray-500" />}
              {cell.type === 'raw' && <FileCode className="h-3 w-3 text-gray-500" />}
              <span className="text-xs text-gray-500">[{index + 1}]</span>
            </div>
            <span className="truncate text-xs text-gray-600 dark:text-gray-400">
              {cell.content.substring(0, 50)}
              {cell.content.length > 50 && '...'}
            </span>
            {cell.status === 'success' && <CheckCircle className="h-3 w-3 text-green-500" />}
            {cell.status === 'error' && <XCircle className="h-3 w-3 text-red-500" />}
            {cell.status === 'running' && <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />}
          </div>
        ))}
        
        {notebook.cells.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <NotebookPen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No cells yet</p>
            <p className="text-xs">Add cells to see them here</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Tabs */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded p-1">
          <button
            onClick={() => setActiveTab('files')}
            className={cn(
              "flex-1 px-2 py-1 text-xs rounded transition-colors",
              activeTab === 'files' 
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white" 
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            Files
          </button>
          {isNotebookSelected && (
          <button
            onClick={() => setActiveTab('variables')}
            className={cn(
              "flex-1 px-2 py-1 text-xs rounded transition-colors",
              activeTab === 'variables' 
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white" 
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            Variables
          </button>
          )}
          {isNotebookSelected && (
          <button
            onClick={() => setActiveTab('outline')}
            className={cn(
              "flex-1 px-2 py-1 text-xs rounded transition-colors",
              activeTab === 'outline' 
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white" 
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            Outline
          </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'files' && renderFilesTab()}
        {activeTab === 'variables' && renderVariablesTab()}
        {activeTab === 'outline' && renderOutlineTab()}
      </div>

      {/* Versions Drawer */}
      {showVersionsFor && (
        <VersionsDrawer
          filePath={showVersionsFor}
          onClose={() => setShowVersionsFor(null)}
          onShowVersions={onShowVersions}
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl w-[520px] max-w-[92vw]">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-medium text-sm">
                Create New
              </div>
              <div className="p-4">
                {createStep === 'kind' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-4 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-left" onClick={() => { setCreateStep('folderName'); setCreateName('New Folder') }}>
                      <Folder className="h-6 w-6 mb-2" />
                      <div className="text-sm font-medium">Folder</div>
                    </button>
                    <button className="p-4 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-left" onClick={() => setCreateStep('filetype')}>
                      <File className="h-6 w-6 mb-2" />
                      <div className="text-sm font-medium">File</div>
                    </button>
                  </div>
                )}
                {createStep === 'filetype' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <button className="p-4 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-left" onClick={() => { setSelectedFileType('ipynb'); setCreateName('Untitled.ipynb') }}>
                        <NotebookPen className="h-6 w-6 mb-2 text-orange-500" />
                        <div className="text-sm font-medium">Notebook (.ipynb)</div>
                      </button>
                      <button className="p-4 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-left" onClick={() => { setSelectedFileType('csv'); setCreateName('data.csv') }}>
                        <FileSpreadsheet className="h-6 w-6 mb-2 text-green-600" />
                        <div className="text-sm font-medium">CSV (.csv)</div>
                      </button>
                      <button className="p-4 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-left" onClick={() => { setSelectedFileType('md'); setCreateName('notes.md') }}>
                        <FileText className="h-6 w-6 mb-2 text-gray-600" />
                        <div className="text-sm font-medium">Markdown (.md)</div>
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-600 dark:text-gray-400">File name</label>
                      <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Enter file name" />
                    </div>
                  </div>
                )}
                {createStep === 'folderName' && (
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600 dark:text-gray-400">Folder name</label>
                    <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Enter folder name" />
                  </div>
                )}
              </div>
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Close</Button>
                {createStep !== 'kind' && (
                  <Button size="sm" variant="outline" onClick={() => setCreateStep('kind')}>Back</Button>
                )}
                {createStep === 'filetype' && (
                  <Button size="sm" onClick={() => { if (createName && selectedFileType) { onCreateFile ? onCreateFile(createName) : onNewFile(); setShowCreate(false) } }}>Create</Button>
                )}
                {createStep === 'folderName' && (
                  <Button size="sm" onClick={() => { if (createName) { onCreateFolder ? onCreateFolder(createName) : onNewFolder(); setShowCreate(false) } }}>Create</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-[10px] text-gray-500">Files and data sources</div>
    </div>
  )
}
