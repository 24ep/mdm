'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Square,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Save,
  Download,
  Upload,
  Settings,
  PanelLeft,
  PanelRight,
  Database,
  FileText,
  Code,
  FileCode,
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
  File,
  Folder,
  FolderOpen,
  RotateCw,
  Replace,
  GitMerge,
  ToggleLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotebookToolbarProps {
  notebook: {
    id: string
    name: string
    cells: any[]
    updatedAt: Date
  }
  isExecuting: boolean
  kernelStatus: 'idle' | 'busy' | 'error'
  executionCount: number
  showSidebar: boolean
  showVariables: boolean
  onExecuteAll: () => void
  onStopExecution: () => void
  onClearOutputs: () => void
  onSave: () => void
  onExport: () => void
  onImport: () => void
  onToggleSidebar: () => void
  onToggleVariables: () => void
  onToggleSettings: () => void
  onAddCell: (type: 'code' | 'markdown' | 'raw') => void
  onRunSelected: () => void
  onInterrupt: () => void
  onRestart: () => void
  onShutdown: () => void
  onShowTemplates: () => void
  toolbarPosition?: 'top' | 'body'
  onToggleToolbarPosition?: () => void
  showFileOps?: boolean
  showViewControls?: boolean
  // New handlers
  onUndo?: () => void
  onRedo?: () => void
  onFind?: () => void
  onReplace?: () => void
  onMergeCells?: () => void
  onSplitCell?: () => void
  onToggleCellType?: () => void
  onShowBookmarks?: () => void
  onShowTableOfContents?: () => void
  onShowSnippets?: () => void
  onExportToPDF?: () => void
  onExportToHTML?: () => void
  canEdit?: boolean
}

export function NotebookToolbar({
  notebook,
  isExecuting,
  kernelStatus,
  executionCount,
  showSidebar,
  showVariables,
  onExecuteAll,
  onStopExecution,
  onClearOutputs,
  onSave,
  onExport,
  onImport,
  onToggleSidebar,
  onToggleVariables,
  onToggleSettings,
  onAddCell,
  onRunSelected,
  onInterrupt,
  onRestart,
  onShutdown,
  onShowTemplates,
  toolbarPosition = 'top',
  onToggleToolbarPosition,
  showFileOps = true,
  showViewControls = true,
  onUndo,
  onRedo,
  onFind,
  onReplace,
  onMergeCells,
  onSplitCell,
  onToggleCellType,
  onShowBookmarks,
  onShowTableOfContents,
  onShowSnippets,
  onExportToPDF,
  onExportToHTML,
  canEdit = true
}: NotebookToolbarProps) {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showKernelMenu, setShowKernelMenu] = useState(false)

  const getKernelStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-green-500'
      case 'busy': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getKernelStatusText = (status: string) => {
    switch (status) {
      case 'idle': return 'Ready'
      case 'busy': return 'Busy'
      case 'error': return 'Error'
      default: return 'Unknown'
    }
  }

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2",
      toolbarPosition === 'body' ? "rounded-lg border" : ""
    )}>
      <div className="flex items-center justify-between">
        {/* Left Section - show selected notebook/file name */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <NotebookPen className="h-5 w-5 text-blue-600 shrink-0" />
            <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[320px]">{notebook.name}</span>
          </div>
          {/* Status Badges (hide cell count, hide 'Ready') */}
          <div className="flex items-center gap-2">
            {kernelStatus !== 'idle' && (
              <Badge 
                variant={kernelStatus === 'busy' ? 'default' : 'destructive'}
                className="text-xs"
              >
                <div className={cn("w-2 h-2 rounded-full mr-1", getKernelStatusColor(kernelStatus))} />
                {getKernelStatusText(kernelStatus)}
              </Badge>
            )}
            {executionCount > 0 && (
              <Badge variant="outline" className="text-xs">
                [{executionCount}]
              </Badge>
            )}
          </div>
        </div>

        {/* Center Section - Main Actions */}
        <div className="flex items-center gap-1">
          {/* Execution Controls */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onExecuteAll}
              disabled={isExecuting || notebook.cells.length === 0}
              className="h-8 px-3"
            >
              <Play className="h-4 w-4 mr-1" />
              Run All
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={onRunSelected}
              disabled={isExecuting}
              className="h-8 px-3"
            >
              <Play className="h-4 w-4 mr-1" />
              Run Selected
            </Button>
            
            {isExecuting && (
              <Button
                size="sm"
                variant="outline"
                onClick={onStopExecution}
                className="h-8 px-3 text-red-600 hover:text-red-700"
              >
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={onClearOutputs}
              className="h-8 px-3"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>

          {/* Edit Operations */}
          {canEdit && (
            <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
              {onUndo && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onUndo}
                  className="h-8 w-8 p-0"
                  title="Undo (Ctrl+Z)"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              {onRedo && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRedo}
                  className="h-8 w-8 p-0"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              )}
              {onFind && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onFind}
                  className="h-8 w-8 p-0"
                  title="Find (Ctrl+F)"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
              {onReplace && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onReplace}
                  className="h-8 w-8 p-0"
                  title="Replace (Ctrl+H)"
                >
                  <Replace className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Cell Operations */}
          {canEdit && (
            <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
              {onMergeCells && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onMergeCells}
                  className="h-8 px-3"
                  title="Merge selected cells (Ctrl+J)"
                >
                  <GitMerge className="h-4 w-4 mr-1" />
                  Merge
                </Button>
              )}
              {onSplitCell && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSplitCell}
                  className="h-8 px-3"
                  title="Split cell (Ctrl+S)"
                >
                  <SplitSquareHorizontal className="h-4 w-4 mr-1" />
                  Split
                </Button>
              )}
              {onToggleCellType && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onToggleCellType}
                  className="h-8 px-3"
                  title="Toggle cell type (Ctrl+Y)"
                >
                  <ToggleLeft className="h-4 w-4 mr-1" />
                  Toggle Type
                </Button>
              )}
            </div>
          )}

          {/* Add Cell Menu removed per request */}

          {/* Kernel Menu */}
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowKernelMenu(!showKernelMenu)}
              className="h-8 px-3"
            >
              <Terminal className="h-4 w-4 mr-1" />
              Kernel
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
            
            {showKernelMenu && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onInterrupt()
                      setShowKernelMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Interrupt
                  </button>
                  <button
                    onClick={() => {
                      onRestart()
                      setShowKernelMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restart
                  </button>
                  <button
                    onClick={() => {
                      onShutdown()
                      setShowKernelMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Shutdown
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          {showViewControls && (
            <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onToggleSidebar}
                className={cn("h-8 w-8 p-0", showSidebar && "bg-blue-100 text-blue-700")}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={onToggleVariables}
                className={cn("h-8 w-8 p-0", showVariables && "bg-blue-100 text-blue-700")}
              >
                <Database className="h-4 w-4" />
              </Button>
              
              {onShowBookmarks && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onShowBookmarks}
                  className="h-8 w-8 p-0"
                  title="Bookmarks"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              )}
              
              {onShowTableOfContents && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onShowTableOfContents}
                  className="h-8 w-8 p-0"
                  title="Table of Contents"
                >
                  <List className="h-4 w-4" />
                </Button>
              )}
              
              {onShowSnippets && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onShowSnippets}
                  className="h-8 w-8 p-0"
                  title="Code Snippets"
                >
                  <Code className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {showFileOps && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={onSave}
                className="h-8 w-8 p-0"
              >
                <Save className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={onExport}
                className="h-8 w-8 p-0"
                title="Export Notebook"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              {onExportToPDF && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onExportToPDF}
                  className="h-8 w-8 p-0"
                  title="Export to PDF"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}
              
              {onExportToHTML && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onExportToHTML}
                  className="h-8 w-8 p-0"
                  title="Export to HTML"
                >
                  <Globe className="h-4 w-4" />
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={onImport}
                className="h-8 w-8 p-0"
              >
                <Upload className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={onShowTemplates}
                className="h-8 px-3"
              >
                <FileText className="h-4 w-4 mr-1" />
                Templates
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={onToggleSettings}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
