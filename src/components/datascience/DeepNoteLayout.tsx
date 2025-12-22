'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Play, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Upload, 
  Copy, 
  Edit, 
  Eye, 
  EyeOff,
  BarChart3,
  FileText,
  Code,
  Database,
  Settings,
  Bookmark,
  History,
  Share,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  Square,
  RotateCcw,
  FileCode,
  Terminal,
  Calculator,
  TrendingUp,
  PieChart,
  LineChart,
  BarChart,
  Activity,
  Layers,
  Brain,
  Target,
  Filter,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Info,
  Users,
  File,
  Folder,
  FolderOpen,
  Star,
  StarOff,
  Globe,
  Lock,
  Unlock,
  MoreHorizontal,
  Menu,
  Maximize,
  Minimize,
  Split,
  Grid,
  List,
  Layout,
  Palette,
  Sun,
  Moon,
  Monitor,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Move,
  GripVertical,
  Command,
  Zap,
  Wand2,
  Sparkles,
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
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
  ChevronUp,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  Play as PlayIcon,
  Square as SquareIcon,
  RotateCcw as RotateCcwIcon,
  Copy as CopyIcon,
  Trash2 as Trash2Icon,
  Edit as EditIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Code as CodeIcon,
  FileText as FileTextIcon,
  Terminal as TerminalIcon,
  FileImage as FileImageIcon,
  FileSpreadsheet as FileSpreadsheetIcon,
  FolderOpen as FolderOpenIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  RefreshCw as RefreshCwIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Clock as ClockIcon,
  AlertCircle as AlertCircleIcon,
  Info as InfoIcon,
  Menu as MenuIcon,
  MoreHorizontal as MoreHorizontalIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { JupyterCell } from './JupyterCell'
import { NotebookToolbar } from './NotebookToolbar'
import { NotebookSidebar } from './NotebookSidebar'
import { NotebookTemplates } from './NotebookTemplates'
import { notebookEngine, ExecutionResult, Kernel } from '@/lib/notebook-engine'
import { useNotebookKeyboardShortcuts } from '@/hooks/useNotebookKeyboardShortcuts'

// Enhanced Cell Types
export type CellType = 'code' | 'markdown' | 'raw'

export interface NotebookCell {
  id: string
  type: CellType
  content: string
  output?: any
  status: 'idle' | 'running' | 'success' | 'error'
  executionTime?: number
  timestamp: Date
  metadata: Record<string, any>
}

export interface Notebook {
  id: string
  name: string
  description: string
  cells: NotebookCell[]
  createdAt: Date
  updatedAt: Date
  tags: string[]
  isPublic: boolean
  author: string
  theme: 'light' | 'dark'
  settings: {
    autoSave: boolean
    executionMode: 'sequential' | 'parallel'
    showLineNumbers: boolean
    fontSize: number
    tabSize: number
    wordWrap: boolean
  }
}

interface DeepNoteLayoutProps {
  initialNotebook?: Notebook
  onSave?: (notebook: Notebook) => void
  onLoad?: (notebookId: string) => void
  dataSource?: { data: any[]; metadata: any }
  enableCollaboration?: boolean
  enableFileManager?: boolean
  enableExport?: boolean
  enableVersionControl?: boolean
}

export function DeepNoteLayout({ 
  initialNotebook, 
  onSave, 
  onLoad,
  dataSource,
  enableCollaboration = true,
  enableFileManager = true,
  enableExport = true,
  enableVersionControl = true
}: DeepNoteLayoutProps) {
  const [notebook, setNotebook] = useState<Notebook>(initialNotebook || {
    id: 'notebook-1',
    name: 'Untitled Notebook',
    description: '',
    cells: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    isPublic: false,
    author: 'Current User',
    theme: 'light',
    settings: {
      autoSave: true,
      executionMode: 'sequential',
      showLineNumbers: true,
      fontSize: 14,
      tabSize: 2,
      wordWrap: true
    }
  })
  
  const [activeCellId, setActiveCellId] = useState<string | null>(null)
  const [selectedCellIds, setSelectedCellIds] = useState<Set<string>>(new Set())
  const [isExecuting, setIsExecuting] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showFileManager, setShowFileManager] = useState(false)
  const [showCollaboration, setShowCollaboration] = useState(false)
  const [selectedCellType, setSelectedCellType] = useState<CellType>('code')
  const [notebookHistory, setNotebookHistory] = useState<Notebook[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [layout, setLayout] = useState<'single' | 'split' | 'grid'>('single')
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'auto'>('light')
  const [showVariables, setShowVariables] = useState(true)
  const [showOutput, setShowOutput] = useState(true)
  const [kernelStatus, setKernelStatus] = useState<'idle' | 'busy' | 'error'>('idle')
  const [executionCount, setExecutionCount] = useState(0)
  const [currentKernel, setCurrentKernel] = useState<Kernel | null>(null)
  const [kernels, setKernels] = useState<Kernel[]>([])
  const [variables, setVariables] = useState([
    { name: 'df', type: 'DataFrame', value: 'Shape: (1000, 5)', size: '1000 rows × 5 columns' },
    { name: 'x', type: 'int', value: '42' },
    { name: 'y', type: 'str', value: '"hello"' },
    { name: 'data', type: 'list', value: '[1, 2, 3, 4, 5]', size: '5 items' }
  ])
  const [files, setFiles] = useState([
    { name: 'notebook.ipynb', type: 'file' as const, size: '2.3 KB', modified: new Date() },
    { name: 'data.csv', type: 'file' as const, size: '1.2 MB', modified: new Date() },
    { name: 'scripts', type: 'folder' as const, modified: new Date() },
    { name: 'utils.py', type: 'file' as const, size: '856 B', modified: new Date() },
    { name: 'README.md', type: 'file' as const, size: '1.1 KB', modified: new Date() }
  ])
  
  const notebookRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Initialize kernels
  useEffect(() => {
    const availableKernels = notebookEngine.getAllKernels()
    setKernels(availableKernels)
    if (availableKernels.length > 0) {
      setCurrentKernel(availableKernels[0])
    }
  }, [])

  // Create new cell
  const createNewCell = (type: CellType, position?: 'above' | 'below', targetCellId?: string) => {
    const newCell: NotebookCell = {
      id: `cell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: getDefaultContent(type),
      status: 'idle',
      timestamp: new Date(),
      metadata: {}
    }

    setNotebook(prev => {
      const newCells = [...prev.cells]
      if (targetCellId) {
        const targetIndex = newCells.findIndex(cell => cell.id === targetCellId)
        if (targetIndex !== -1) {
          const insertIndex = position === 'above' ? targetIndex : targetIndex + 1
          newCells.splice(insertIndex, 0, newCell)
        } else {
          newCells.push(newCell)
        }
      } else {
        newCells.push(newCell)
      }
      
      return {
        ...prev,
        cells: newCells,
        updatedAt: new Date()
      }
    })

    setActiveCellId(newCell.id)
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} cell added`)
  }

  const getDefaultContent = (type: CellType): string => {
    switch (type) {
      case 'code':
        return '# Write your code here\nprint("Hello, World!")'
      case 'markdown':
        return '# Markdown Cell\n\nWrite your markdown content here...'
      case 'raw':
        return 'Raw text content...'
      default:
        return ''
    }
  }

  // Execute cell
  const executeCell = async (cellId: string) => {
    const cell = notebook.cells.find(c => c.id === cellId)
    if (!cell || cell.type !== 'code') return

    if (!currentKernel) {
      toast.error('No kernel available')
      return
    }

    setIsExecuting(true)
    setKernelStatus('busy')
    
    // Update cell status
    setNotebook(prev => ({
      ...prev,
      cells: prev.cells.map(c => 
        c.id === cellId ? { ...c, status: 'running' } : c
      )
    }))

    try {
      const startTime = Date.now()
      
      // Execute using the notebook engine
      const result = await notebookEngine.executeCode(
        cell.content,
        'python', // Default to Python for now
        {
          kernelId: currentKernel.id,
          variables: currentKernel.variables || {},
          imports: [],
          dataSources: dataSource || {}
        }
      )

      const executionTime = Date.now() - startTime

      // Update cell with results
      setNotebook(prev => ({
        ...prev,
        cells: prev.cells.map(c => 
          c.id === cellId 
            ? { 
                ...c, 
                output: result, 
                status: 'success', 
                executionTime,
                timestamp: new Date()
              } 
            : c
        ),
        updatedAt: new Date()
      }))

      // Update variables from kernel
      if (currentKernel.variables) {
        const newVariables = Object.entries(currentKernel.variables).map(([name, value]) => ({
          name,
          type: typeof value === 'object' ? 'object' : typeof value,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          size: Array.isArray(value) ? `${value.length} items` : undefined
        }))
        setVariables(newVariables)
      }

      setKernelStatus('idle')
      setExecutionCount(prev => prev + 1)
      toast.success(`Cell executed in ${executionTime}ms`)
    } catch (error) {
      setNotebook(prev => ({
        ...prev,
        cells: prev.cells.map(c => 
          c.id === cellId 
            ? { 
                ...c, 
                output: { 
                  error: error instanceof Error ? error.message : 'Execution failed',
                  details: error 
                }, 
                status: 'error',
                timestamp: new Date()
              } 
            : c
        ),
        updatedAt: new Date()
      }))
      setKernelStatus('error')
      toast.error('Cell execution failed')
    } finally {
      setIsExecuting(false)
    }
  }

  // Execute all cells
  const executeAllCells = async () => {
    const codeCells = notebook.cells.filter(cell => cell.type === 'code')
    for (const cell of codeCells) {
      await executeCell(cell.id)
    }
  }

  // Delete cell
  const deleteCell = (cellId: string) => {
    setNotebook(prev => ({
      ...prev,
      cells: prev.cells.filter(cell => cell.id !== cellId),
      updatedAt: new Date()
    }))
    setActiveCellId(null)
    toast.success('Cell deleted')
  }

  // Update cell content
  const updateCellContent = (cellId: string, content: string) => {
    setNotebook(prev => ({
      ...prev,
      cells: prev.cells.map(cell => 
        cell.id === cellId ? { ...cell, content, timestamp: new Date() } : cell
      ),
      updatedAt: new Date()
    }))
  }

  // Move cell
  const moveCell = (cellId: string, direction: 'up' | 'down') => {
    setNotebook(prev => {
      const cells = [...prev.cells]
      const currentIndex = cells.findIndex(cell => cell.id === cellId)
      
      if (currentIndex === -1) return prev
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      
      if (newIndex < 0 || newIndex >= cells.length) return prev
      
      const temp = cells[currentIndex]
      cells[currentIndex] = cells[newIndex]
      cells[newIndex] = temp
      
      return {
        ...prev,
        cells,
        updatedAt: new Date()
      }
    })
  }

  // Clear all outputs
  const clearAllOutputs = () => {
    setNotebook(prev => ({
      ...prev,
      cells: prev.cells.map(cell => ({ ...cell, output: undefined, status: 'idle' })),
      updatedAt: new Date()
    }))
    setExecutionCount(0)
    toast.success('All outputs cleared')
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  // Render cell
  const renderCell = (cell: NotebookCell, index: number) => {
    const isActive = activeCellId === cell.id
    const isSelected = selectedCellIds.has(cell.id)

    return (
      <div
        key={cell.id}
        ref={el => {
          if (el) {
            cellRefs.current.set(cell.id, el)
          }
        }}
        className={cn(
          "group relative border-l-4 transition-all duration-200",
          isActive ? "border-blue-500 bg-blue-50/50" : "border-transparent hover:border-gray-300",
          isSelected ? "bg-blue-100/50" : "",
          cell.status === 'running' ? "bg-yellow-50" : "",
          cell.status === 'error' ? "bg-red-50" : ""
        )}
        onClick={() => setActiveCellId(cell.id)}
      >
        {/* Cell Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500">In [{index + 1}]:</span>
            {cell.status !== 'idle' && getStatusIcon(cell.status)}
            {cell.executionTime && (
              <span className="text-xs text-gray-500">
                {cell.executionTime}ms
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                executeCell(cell.id)
              }}
              disabled={cell.type !== 'code' || cell.status === 'running'}
              className="h-6 w-6 p-0"
            >
              <Play className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                moveCell(cell.id, 'up')
              }}
              className="h-6 w-6 p-0"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                moveCell(cell.id, 'down')
              }}
              className="h-6 w-6 p-0"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                deleteCell(cell.id)
              }}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Cell Content */}
        <div className="p-4">
          {cell.type === 'code' ? (
            <div className="space-y-4">
              <textarea
                value={cell.content}
                onChange={(e) => updateCellContent(cell.id, e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your code here..."
              />
              
              {cell.output && (
                <div className="bg-gray-900 text-green-400 p-3 rounded-md font-mono text-sm whitespace-pre-wrap">
                  {cell.output.output || cell.output.error}
                </div>
              )}
            </div>
          ) : cell.type === 'markdown' ? (
            <div className="space-y-4">
              <textarea
                value={cell.content}
                onChange={(e) => updateCellContent(cell.id, e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your markdown here..."
              />
              
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ 
                  __html: cell.content
                    .replace(/\n/g, '<br>')
                    .replace(/# (.*)/g, '<h1>$1</h1>')
                    .replace(/## (.*)/g, '<h2>$1</h2>')
                    .replace(/### (.*)/g, '<h3>$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                }} />
              </div>
            </div>
          ) : (
            <textarea
              value={cell.content}
              onChange={(e) => updateCellContent(cell.id, e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Raw text content..."
            />
          )}
        </div>
      </div>
    )
  }

  // Handler functions for toolbar
  const handleSave = () => {
    onSave?.(notebook)
    toast.success('Notebook saved')
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(notebook, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${notebook.name.replace(/\s+/g, '_')}.ipynb`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Notebook exported')
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.ipynb,.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const importedNotebook = JSON.parse(e.target?.result as string)
            setNotebook(importedNotebook)
            toast.success('Notebook imported')
          } catch (error) {
            toast.error('Failed to import notebook')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleRunSelected = () => {
    const selectedCells = notebook.cells.filter(cell => selectedCellIds.has(cell.id) && cell.type === 'code')
    selectedCells.forEach(cell => executeCell(cell.id))
  }

  const handleInterrupt = () => {
    setIsExecuting(false)
    setKernelStatus('idle')
    toast.success('Execution interrupted')
  }

  const handleRestart = () => {
    setKernelStatus('idle')
    setExecutionCount(0)
    clearAllOutputs()
    toast.success('Kernel restarted')
  }

  const handleShutdown = () => {
    setKernelStatus('idle')
    setExecutionCount(0)
    clearAllOutputs()
    toast.success('Kernel shutdown')
  }

  const handleOpenFile = (filePath: string) => {
    toast.success(`Opening file: ${filePath}`)
  }

  const handleNewFile = () => {
    toast.success('Creating new file')
  }

  const handleNewFolder = () => {
    toast.success('Creating new folder')
  }

  const handleUploadFile = () => {
    toast.success('Uploading file')
  }

  const handleDeleteFile = (filePath: string) => {
    setFiles(prev => prev.filter(file => file.name !== filePath))
    toast.success(`Deleted: ${filePath}`)
  }

  const handleRenameFile = (filePath: string, newName: string) => {
    setFiles(prev => prev.map(file => 
      file.name === filePath ? { ...file, name: newName } : file
    ))
    toast.success(`Renamed to: ${newName}`)
  }

  const handleMoveFile = (filePath: string, newPath: string) => {
    toast.success(`Moved ${filePath} to ${newPath}`)
  }

  // Navigation functions
  const focusNextCell = () => {
    const currentIndex = notebook.cells.findIndex(cell => cell.id === activeCellId)
    if (currentIndex < notebook.cells.length - 1) {
      setActiveCellId(notebook.cells[currentIndex + 1].id)
    }
  }

  const focusPreviousCell = () => {
    const currentIndex = notebook.cells.findIndex(cell => cell.id === activeCellId)
    if (currentIndex > 0) {
      setActiveCellId(notebook.cells[currentIndex - 1].id)
    }
  }

  const selectAllCells = () => {
    setSelectedCellIds(new Set(notebook.cells.map(cell => cell.id)))
  }

  const copyCell = async (cellId: string) => {
    const cell = notebook.cells.find(c => c.id === cellId)
    if (cell) {
      const { copyToClipboard } = await import('@/lib/clipboard')
      const success = await copyToClipboard(JSON.stringify(cell))
      if (success) {
        toast.success('Cell copied to clipboard')
      } else {
        toast.error('Failed to copy cell')
      }
    }
  }

  const pasteCell = async () => {
    try {
      const { pasteFromClipboard } = await import('@/lib/clipboard')
      const text = await pasteFromClipboard()
      if (text) {
        const cell = JSON.parse(text)
        const newCell = { ...cell, id: `cell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }
        setNotebook(prev => ({
          ...prev,
          cells: [...prev.cells, newCell],
          updatedAt: new Date()
        }))
        setActiveCellId(newCell.id)
        toast.success('Cell pasted')
      }
    } catch {
      toast.error('Invalid cell data in clipboard')
    }
  }

  const mergeCells = () => {
    if (selectedCellIds.size < 2) {
      toast.error('Select at least 2 cells to merge')
      return
    }
    // Implementation for merging cells
    toast.success('Merge cells feature coming soon')
  }

  const splitCell = (cellId: string) => {
    // Implementation for splitting cells
    toast.success('Split cell feature coming soon')
  }

  const toggleCellType = (cellId: string) => {
    setNotebook(prev => ({
      ...prev,
      cells: prev.cells.map(cell => 
        cell.id === cellId 
          ? { 
              ...cell, 
              type: cell.type === 'code' ? 'markdown' : cell.type === 'markdown' ? 'raw' : 'code',
              content: getDefaultContent(cell.type === 'code' ? 'markdown' : cell.type === 'markdown' ? 'raw' : 'code')
            } 
          : cell
      ),
      updatedAt: new Date()
    }))
  }

  const toggleOutput = () => {
    setShowOutput(!showOutput)
  }

  const find = () => {
    toast.success('Find feature coming soon')
  }

  const replace = () => {
    toast.success('Replace feature coming soon')
  }

  const undo = () => {
    toast.success('Undo feature coming soon')
  }

  const redo = () => {
    toast.success('Redo feature coming soon')
  }

  const handleSelectTemplate = (template: Notebook) => {
    setNotebook(template)
    setShowTemplates(false)
    toast.success(`Template "${template.name}" loaded`)
  }

  // Initialize keyboard shortcuts
  useNotebookKeyboardShortcuts({
    activeCellId,
    selectedCellIds,
    notebook,
    onExecuteCell: executeCell,
    onExecuteAll: executeAllCells,
    onCreateCell: createNewCell,
    onDeleteCell: deleteCell,
    onMoveCell: moveCell,
    onClearOutputs: clearAllOutputs,
    onSave: handleSave,
    onFocusNextCell: focusNextCell,
    onFocusPreviousCell: focusPreviousCell,
    onSelectAll: selectAllCells,
    onCopyCell: copyCell,
    onPasteCell: pasteCell,
    onMergeCells: mergeCells,
    onSplitCell: splitCell,
    onToggleCellType: toggleCellType,
    onToggleOutput: toggleOutput,
    onToggleSidebar: () => setShowSidebar(!showSidebar),
    onToggleVariables: () => setShowVariables(!showVariables),
    onFind: find,
    onReplace: replace,
    onUndo: undo,
    onRedo: redo
  })

  return (
    <div className={cn(
      "h-screen bg-white flex flex-col transition-all duration-300",
      currentTheme === 'dark' ? "dark bg-gray-900" : "",
      isFullscreen ? "fixed inset-0 z-50" : ""
    )}>
      {/* Toolbar */}
      <NotebookToolbar
        notebook={notebook}
        isExecuting={isExecuting}
        kernelStatus={kernelStatus}
        executionCount={executionCount}
        showSidebar={showSidebar}
        showVariables={showVariables}
        onExecuteAll={executeAllCells}
        onStopExecution={handleInterrupt}
        onClearOutputs={clearAllOutputs}
        onSave={handleSave}
        onExport={handleExport}
        onImport={handleImport}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onToggleVariables={() => setShowVariables(!showVariables)}
        onToggleSettings={() => setShowSettings(true)}
        onAddCell={createNewCell}
        onShowTemplates={() => setShowTemplates(true)}
        onRunSelected={handleRunSelected}
        onInterrupt={handleInterrupt}
        onRestart={handleRestart}
        onShutdown={handleShutdown}
      />

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar */}
        {showSidebar && (
          <NotebookSidebar
            notebook={notebook}
            variables={variables}
            files={files}
            onAddCell={createNewCell}
            onOpenFile={handleOpenFile}
            onNewFile={handleNewFile}
            onNewFolder={handleNewFolder}
            onUploadFile={handleUploadFile}
            onDeleteFile={handleDeleteFile}
            onRenameFile={handleRenameFile}
            onMoveFile={handleMoveFile}
          />
        )}

        {/* Notebook Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto" ref={notebookRef}>
            {notebook.cells.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Start Your Notebook</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Add your first cell to begin</p>
                  <div className="space-x-2">
                    <Button onClick={() => createNewCell('code')}>
                      <Code className="h-4 w-4 mr-2" />
                      Add Code Cell
                    </Button>
                    <Button variant="outline" onClick={() => createNewCell('markdown')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Add Markdown
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {notebook.cells.map((cell, index) => (
                  <JupyterCell
                    key={cell.id}
                    cell={cell}
                    index={index}
                    isActive={activeCellId === cell.id}
                    isSelected={selectedCellIds.has(cell.id)}
                    onExecute={executeCell}
                    onDelete={deleteCell}
                    onMove={moveCell}
                    onContentChange={updateCellContent}
                    onTypeChange={(cellId, type) => {
                      setNotebook(prev => ({
                        ...prev,
                        cells: prev.cells.map(cell => 
                          cell.id === cellId ? { ...cell, type, content: getDefaultContent(type) } : cell
                        )
                      }))
                    }}
                    onFocus={setActiveCellId}
                    onSelect={(cellId, selected) => {
                      const newSelected = new Set(selectedCellIds)
                      if (selected) {
                        newSelected.add(cellId)
                      } else {
                        newSelected.delete(cellId)
                      }
                      setSelectedCellIds(newSelected)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>Cells: {notebook.cells.length}</span>
            <span>Executed: {notebook.cells.filter(c => c.status === 'success').length}</span>
            <span>Errors: {notebook.cells.filter(c => c.status === 'error').length}</span>
            <span>Kernel: Python 3.9</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Last saved: {notebook.updatedAt.toLocaleTimeString()}</span>
            {isExecuting && (
              <div className="flex items-center gap-2 text-blue-600">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Executing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <NotebookTemplates
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  )
}
