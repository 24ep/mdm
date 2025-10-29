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
  NotebookPen,
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
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  onNewFolder: () => void
  onUploadFile: () => void
  onDeleteFile: (filePath: string) => void
  onRenameFile: (filePath: string, newName: string) => void
  onMoveFile: (filePath: string, newPath: string) => void
}

export function NotebookSidebar({
  notebook,
  variables,
  files,
  onAddCell,
  onOpenFile,
  onNewFile,
  onNewFolder,
  onUploadFile,
  onDeleteFile,
  onRenameFile,
  onMoveFile
}: NotebookSidebarProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'variables' | 'outline'>('files')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

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
          onClick={onNewFile}
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
                "flex items-center gap-2 px-2 py-1 rounded text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
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
            >
              <div className="flex items-center gap-1">
                {getFileIcon(file.name, file.type)}
                <span className="truncate">{file.name}</span>
              </div>
              {file.type === 'file' && file.size && (
                <span className="text-xs text-gray-500 ml-auto">{file.size}</span>
              )}
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
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <NotebookPen className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-gray-900 dark:text-white text-sm">
            {notebook.name}
          </span>
        </div>
        
        {/* Tabs */}
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
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'files' && renderFilesTab()}
        {activeTab === 'variables' && renderVariablesTab()}
        {activeTab === 'outline' && renderOutlineTab()}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <Button
            size="sm"
            onClick={() => onAddCell('code')}
            className="w-full h-8 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Code Cell
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddCell('markdown')}
            className="w-full h-8 text-xs"
          >
            <FileText className="h-3 w-3 mr-1" />
            Add Markdown
          </Button>
        </div>
      </div>
    </div>
  )
}
