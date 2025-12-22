'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Zap,
  Settings,
  Bookmark,
  History,
  Share,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  Square,
  RotateCcw,
  Download as DownloadIcon,
  Upload as UploadIcon,
  FileCode,
  Terminal,
  Calculator,
  TrendingUp,
  PieChart,
  ScatterChart,
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
  Monitor
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// Import our enhanced components
import { CodeCell } from './CodeCell'
import { MarkdownCell } from './MarkdownCell'
import { SQLCell } from './SQLCell'
import { DataVisualization } from './DataVisualization'
import { FileManager } from './FileManager'
import { CollaborationPanel } from './CollaborationPanel'
import { notebookEngine, ExecutionResult, Kernel, createNotebookId, createCellId, formatExecutionTime } from '@/lib/notebook-engine'

// Enhanced Cell Types
export type CellType = 'code' | 'markdown' | 'sql' | 'python' | 'r' | 'javascript' | 'typescript' | 'visualization' | 'data_exploration' | 'ml_pipeline'

export interface NotebookCell {
  id: string
  type: CellType
  content: string
  output?: ExecutionResult
  status: 'idle' | 'running' | 'success' | 'error'
  executionTime?: number
  timestamp: Date
  metadata?: Record<string, any>
  isCollapsed?: boolean
  isSelected?: boolean
  tags?: string[]
  isStarred?: boolean
}

export interface Notebook {
  id: string
  name: string
  description?: string
  cells: NotebookCell[]
  createdAt: Date
  updatedAt: Date
  tags: string[]
  isPublic: boolean
  author: string
  collaborators?: string[]
  theme?: 'light' | 'dark' | 'auto'
  settings?: {
    autoSave: boolean
    executionMode: 'sequential' | 'parallel'
    showLineNumbers: boolean
    fontSize: number
    tabSize: number
    wordWrap: boolean
  }
}

interface DataScienceNotebookProps {
  initialNotebook?: Notebook
  onSave?: (notebook: Notebook) => void
  onLoad?: (notebookId: string) => Promise<Notebook>
  dataSource?: any
  enableCollaboration?: boolean
  enableFileManager?: boolean
  enableExport?: boolean
  enableVersionControl?: boolean
}

export function DataScienceNotebook({ 
  initialNotebook, 
  onSave, 
  onLoad,
  dataSource,
  enableCollaboration = true,
  enableFileManager = true,
  enableExport = true,
  enableVersionControl = true
}: DataScienceNotebookProps) {
  const [notebook, setNotebook] = useState<Notebook>(initialNotebook || {
    id: createNotebookId(),
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
  const [selectedCellType, setSelectedCellType] = useState<CellType>('python')
  const [notebookHistory, setNotebookHistory] = useState<Notebook[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [currentKernel, setCurrentKernel] = useState<Kernel | null>(null)
  const [kernels, setKernels] = useState<Kernel[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [layout, setLayout] = useState<'single' | 'split' | 'grid'>('single')
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'auto'>('light')
  
  const notebookRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Initialize kernels
  useEffect(() => {
    const availableKernels = notebookEngine.getAllKernels()
    setKernels(availableKernels)
    setCurrentKernel(availableKernels.find(k => k.language === 'python') || availableKernels[0])
  }, [])

  // Auto-save functionality
  useEffect(() => {
    if (notebook.settings?.autoSave && notebook.cells.length > 0) {
      const timer = setTimeout(() => {
        handleSaveNotebook()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [notebook])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            handleSaveNotebook()
            break
          case 'Enter':
            e.preventDefault()
            if (activeCellId) executeCell(activeCellId)
            break
          case 'Shift':
            e.preventDefault()
            executeAllCells()
            break
          case 'n':
            e.preventDefault()
            addNewCell(selectedCellType)
            break
          case 'd':
            e.preventDefault()
            if (activeCellId) deleteCell(activeCellId)
            break
          case 'a':
            e.preventDefault()
            selectAllCells()
            break
          case 'c':
            e.preventDefault()
            copySelectedCells()
            break
          case 'v':
            e.preventDefault()
            pasteCells()
            break
          case 'z':
            e.preventDefault()
            undo()
            break
          case 'y':
            e.preventDefault()
            redo()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeCellId, selectedCellType])

  const addNewCell = (type: CellType = 'python', position?: 'above' | 'below') => {
    const newCell: NotebookCell = {
      id: createCellId(),
      type,
      content: getDefaultContent(type),
      status: 'idle',
      timestamp: new Date(),
      metadata: {},
      isCollapsed: false,
      isSelected: false,
      tags: [],
      isStarred: false
    }

    setNotebook(prev => {
      const newCells = [...prev.cells]
      const activeIndex = activeCellId ? newCells.findIndex(c => c.id === activeCellId) : -1
      
      if (position === 'above' && activeIndex >= 0) {
        newCells.splice(activeIndex, 0, newCell)
      } else if (position === 'below' && activeIndex >= 0) {
        newCells.splice(activeIndex + 1, 0, newCell)
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
    toast.success(`Added new ${type} cell`)
  }

  const deleteCell = (cellId: string) => {
    setNotebook(prev => ({
      ...prev,
      cells: prev.cells.filter(cell => cell.id !== cellId),
      updatedAt: new Date()
    }))
    
    if (activeCellId === cellId) {
      setActiveCellId(null)
    }
    
    setSelectedCellIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(cellId)
      return newSet
    })
    
    toast.success('Cell deleted')
  }

  const updateCellContent = (cellId: string, content: string) => {
    setNotebook(prev => ({
      ...prev,
      cells: prev.cells.map(cell => 
        cell.id === cellId ? { ...cell, content, updatedAt: new Date() } : cell
      ),
      updatedAt: new Date()
    }))
  }

  const executeCell = async (cellId?: string) => {
    const targetCellId = cellId || activeCellId
    if (!targetCellId) return

    const cell = notebook.cells.find(c => c.id === targetCellId)
    if (!cell) return

    setIsExecuting(true)
    
    // Update cell status
    setNotebook(prev => ({
      ...prev,
      cells: prev.cells.map(c => 
        c.id === targetCellId ? { ...c, status: 'running' } : c
      )
    }))

    try {
      const startTime = Date.now()
      
      // Execute using the notebook engine
      const result = await notebookEngine.executeCode(
        cell.content,
        cell.type === 'code' ? 'python' : cell.type,
        {
          kernelId: currentKernel?.id || '',
          variables: currentKernel?.variables || {},
          imports: [],
          dataSources: dataSource || {}
        }
      )

      const executionTime = Date.now() - startTime

      // Update cell with results
      setNotebook(prev => ({
        ...prev,
        cells: prev.cells.map(c => 
          c.id === targetCellId 
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

      toast.success(`Cell executed in ${formatExecutionTime(executionTime)}`)
    } catch (error) {
      setNotebook(prev => ({
        ...prev,
        cells: prev.cells.map(c => 
          c.id === targetCellId 
            ? { 
                ...c, 
                output: { 
                  error: error instanceof Error ? error.message : 'Execution failed',
                  executionTime: Date.now() - Date.now()
                }, 
                status: 'error',
                timestamp: new Date()
              } 
            : c
        ),
        updatedAt: new Date()
      }))
      
      toast.error('Cell execution failed')
    } finally {
      setIsExecuting(false)
    }
  }

  const executeAllCells = async () => {
    setIsExecuting(true)
    
    for (const cell of notebook.cells) {
      if (cell.type !== 'markdown') {
        await executeCell(cell.id)
        // Add delay between executions for sequential mode
        if (notebook.settings?.executionMode === 'sequential') {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    }
    
    setIsExecuting(false)
    toast.success('All cells executed')
  }

  const clearAllOutputs = () => {
    setNotebook(prev => ({
      ...prev,
      cells: prev.cells.map(cell => ({ ...cell, output: undefined, status: 'idle' })),
      updatedAt: new Date()
    }))
    toast.success('All outputs cleared')
  }

  const handleSaveNotebook = async () => {
    try {
      if (onSave) {
        await onSave(notebook)
      } else {
        // Default save to localStorage
        localStorage.setItem(`notebook-${notebook.id}`, JSON.stringify(notebook))
      }
      
      // Add to history
      setNotebookHistory(prev => [notebook, ...prev.slice(0, 9)])
      
      toast.success('Notebook saved')
    } catch (error) {
      toast.error('Failed to save notebook')
    }
  }

  const exportNotebook = async (format: 'json' | 'ipynb' | 'html' | 'pdf' | 'py') => {
    try {
      if (format === 'json') {
        // Handle JSON export separately
        const jsonStr = JSON.stringify(notebook, null, 2)
        const blob = new Blob([jsonStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${notebook.name || 'notebook'}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        return
      }
      const blob = await notebookEngine.exportNotebook(notebook, format as 'ipynb' | 'html' | 'pdf' | 'py')
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${notebook.name.replace(/\s+/g, '_')}.${format}`
      link.click()
      
      URL.revokeObjectURL(url)
      toast.success(`Notebook exported as ${format}`)
    } catch (error) {
      toast.error('Failed to export notebook')
    }
  }

  const duplicateCell = (cellId: string) => {
    const cell = notebook.cells.find(c => c.id === cellId)
    if (!cell) return

    const newCell: NotebookCell = {
      ...cell,
      id: createCellId(),
      timestamp: new Date()
    }

    setNotebook(prev => {
      const newCells = [...prev.cells]
      const cellIndex = newCells.findIndex(c => c.id === cellId)
      newCells.splice(cellIndex + 1, 0, newCell)
      
      return {
        ...prev,
        cells: newCells,
        updatedAt: new Date()
      }
    })

    setActiveCellId(newCell.id)
    toast.success('Cell duplicated')
  }

  const moveCell = (cellId: string, direction: 'up' | 'down') => {
    setNotebook(prev => {
      const newCells = [...prev.cells]
      const cellIndex = newCells.findIndex(c => c.id === cellId)
      
      if (direction === 'up' && cellIndex > 0) {
        [newCells[cellIndex], newCells[cellIndex - 1]] = [newCells[cellIndex - 1], newCells[cellIndex]]
      } else if (direction === 'down' && cellIndex < newCells.length - 1) {
        [newCells[cellIndex], newCells[cellIndex + 1]] = [newCells[cellIndex + 1], newCells[cellIndex]]
      }
      
      return {
        ...prev,
        cells: newCells,
        updatedAt: new Date()
      }
    })
  }

  const selectAllCells = () => {
    const allCellIds = new Set(notebook.cells.map(cell => cell.id))
    setSelectedCellIds(allCellIds)
  }

  const copySelectedCells = async () => {
    const selectedCells = notebook.cells.filter(cell => selectedCellIds.has(cell.id))
    const { copyToClipboard } = await import('@/lib/clipboard')
    await copyToClipboard(JSON.stringify(selectedCells, null, 2))
    toast.success(`${selectedCells.length} cells copied`)
  }

  const pasteCells = async () => {
    try {
      const { pasteFromClipboard } = await import('@/lib/clipboard')
      const text = await pasteFromClipboard()
      if (text) {
        const pastedCells = JSON.parse(text)
        if (Array.isArray(pastedCells)) {
          const newCells = pastedCells.map(cell => ({
            ...cell,
            id: createCellId(),
            timestamp: new Date()
          }))
          
          setNotebook(prev => ({
            ...prev,
            cells: [...prev.cells, ...newCells],
            updatedAt: new Date()
          }))
          
          toast.success(`${newCells.length} cells pasted`)
        }
      }
    } catch {
      toast.error('Failed to paste cells')
    }
  }

  const undo = () => {
    // Implement undo functionality
    toast('Undo functionality coming soon')
  }

  const redo = () => {
    // Implement redo functionality
    toast('Redo functionality coming soon')
  }

  const getDefaultContent = (type: CellType): string => {
    switch (type) {
      case 'python':
        return '# Python Code\nimport pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\n# Your code here\nprint("Hello, Data Science!")'
      case 'r':
        return '# R Code\nlibrary(ggplot2)\nlibrary(dplyr)\nlibrary(tidyr)\n\n# Your R code here\nprint("Hello, R!")'
      case 'sql':
        return '-- SQL Query\nSELECT \n    column1,\n    column2,\n    COUNT(*) as count\nFROM your_table\nWHERE condition = \'value\'\nGROUP BY column1, column2\nORDER BY count DESC\nLIMIT 10;'
      case 'javascript':
        return '// JavaScript Code\nconsole.log("Hello, JavaScript!");\n\n// Your code here\nconst data = [1, 2, 3, 4, 5];\nconst sum = data.reduce((a, b) => a + b, 0);\nconsole.log("Sum:", sum);'
      case 'typescript':
        return '// TypeScript Code\ninterface DataPoint {\n  id: number;\n  value: number;\n}\n\nconst processData = (data: DataPoint[]): number => {\n  return data.reduce((sum, point) => sum + point.value, 0);\n};\n\nconsole.log("Hello, TypeScript!");'
      case 'markdown':
        return '# Markdown Cell\n\nWrite your documentation here using **Markdown** syntax.\n\n## Features\n- **Bold text**\n- *Italic text*\n- `Code snippets`\n- [Links](https://example.com)\n- Lists\n- Tables\n- And more!'
      case 'visualization':
        return '// Visualization Code\n// Create interactive charts and plots'
      case 'data_exploration':
        return '# Data Exploration\n# Statistical analysis and data profiling'
      case 'ml_pipeline':
        return '# Machine Learning Pipeline\n# Model training and evaluation'
      default:
        return '// Code Cell\n// Write your code here'
    }
  }

  const getCellIcon = (type: CellType) => {
    switch (type) {
      case 'python': return <FileCode className="h-4 w-4 text-blue-600" />
      case 'r': return <FileCode className="h-4 w-4 text-purple-600" />
      case 'sql': return <Database className="h-4 w-4 text-green-600" />
      case 'javascript': return <Code className="h-4 w-4 text-yellow-600" />
      case 'typescript': return <Code className="h-4 w-4 text-blue-500" />
      case 'markdown': return <FileText className="h-4 w-4 text-green-500" />
      case 'visualization': return <BarChart3 className="h-4 w-4 text-purple-500" />
      case 'data_exploration': return <Calculator className="h-4 w-4 text-orange-500" />
      case 'ml_pipeline': return <Brain className="h-4 w-4 text-red-500" />
      default: return <Code className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <PlayCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const renderCell = (cell: NotebookCell, index: number) => {
    const commonProps = {
      id: cell.id,
      timestamp: cell.timestamp,
      isActive: activeCellId === cell.id,
      onDelete: () => deleteCell(cell.id),
      onDuplicate: () => duplicateCell(cell.id),
      onMoveUp: () => moveCell(cell.id, 'up'),
      onMoveDown: () => moveCell(cell.id, 'down'),
      onFocus: () => setActiveCellId(cell.id)
    }

    switch (cell.type) {
      case 'python':
      case 'r':
      case 'javascript':
      case 'typescript':
      case 'code':
        return (
          <CodeCell
            {...commonProps}
            language={cell.type as any}
            content={cell.content}
            output={cell.output}
            status={cell.status}
            executionTime={cell.executionTime}
            onContentChange={(content) => updateCellContent(cell.id, content)}
            onExecute={() => executeCell(cell.id)}
          />
        )
      
      case 'markdown':
        return (
          <MarkdownCell
            {...commonProps}
            content={cell.content}
            output={cell.output}
            status={cell.status}
            executionTime={cell.executionTime}
            onContentChange={(content) => updateCellContent(cell.id, content)}
            onExecute={() => executeCell(cell.id)}
          />
        )
      
      case 'sql':
        return (
          <SQLCell
            cell={cell as any}
            isActive={activeCellId === cell.id}
            isSelected={selectedCellIds.has(cell.id)}
            onExecute={() => executeCell(cell.id)}
            onContentChange={(cellId, content) => updateCellContent(cellId, content)}
            onVariableNameChange={(cellId, variableName) => {
              // Handle variable name change
            }}
            onConnectionChange={(cellId, connection) => {
              // Handle connection change
            }}
            onFocus={() => setActiveCellId(cell.id)}
            onSelect={(cellId, selected) => {
              if (selected) {
                setSelectedCellIds(new Set([...selectedCellIds, cellId]))
              } else {
                const newSet = new Set(selectedCellIds)
                newSet.delete(cellId)
                setSelectedCellIds(newSet)
              }
            }}
            onTitleChange={(cellId, title) => {
              // Handle title change
            }}
            canEdit={true}
            canExecute={true}
          />
        )
      
      case 'visualization':
        return (
          <DataVisualization
            data={cell.metadata?.data || []}
            columns={cell.metadata?.columns || []}
            onUpdate={(config) => {
              setNotebook(prev => ({
                ...prev,
                cells: prev.cells.map(c => 
                  c.id === cell.id ? { 
                    ...c, 
                    metadata: { ...c.metadata, config },
                    updatedAt: new Date()
                  } : c
                ),
                updatedAt: new Date()
              }))
            }}
            className="w-full"
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className={cn(
      "h-screen bg-gray-50 flex flex-col transition-all duration-300 p-6",
      currentTheme === 'dark' ? "dark bg-gray-900" : "",
      isFullscreen ? "fixed inset-0 z-50 p-0" : ""
    )}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileCode className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Data Science Notebook</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {notebook.cells.length} cells
              </Badge>
              {currentKernel && (
                <Badge variant="secondary" className="text-xs">
                  {currentKernel.name}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setCurrentTheme(currentTheme === 'light' ? 'dark' : 'light')}>
              {currentTheme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
            {enableCollaboration && (
              <Button size="sm" variant="outline" onClick={() => setShowCollaboration(!showCollaboration)}>
                <Users className="h-4 w-4 mr-1" />
                Collaborate
              </Button>
            )}
            {enableFileManager && (
              <Button size="sm" variant="outline" onClick={() => setShowFileManager(!showFileManager)}>
                <Folder className="h-4 w-4 mr-1" />
                Files
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
            <Button size="sm" variant="outline" onClick={handleSaveNotebook}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            {enableExport && (
              <Button size="sm" variant="outline" onClick={() => setShowExport(true)}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => addNewCell(selectedCellType)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Cell
            </Button>
            
            <Button size="sm" variant="outline" onClick={() => executeAllCells()} disabled={isExecuting}>
              <Play className="h-4 w-4 mr-1" />
              Run All
            </Button>
            
            <Button size="sm" variant="outline" onClick={clearAllOutputs}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear Outputs
            </Button>

            <div className="flex items-center gap-1 border rounded-md">
              {(['python', 'r', 'sql', 'markdown', 'visualization'] as CellType[]).map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={selectedCellType === type ? "default" : "ghost"}
                  onClick={() => setSelectedCellType(type)}
                  className="h-8 px-2"
                >
                  {getCellIcon(type)}
                  <span className="ml-1 capitalize">{type}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowSidebar(!showSidebar)}>
              {showSidebar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 bg-white dark:bg-gray-800 rounded-b-lg">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto rounded-bl-lg">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Notebook Info</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div>Name: {notebook.name}</div>
                <div>Cells: {notebook.cells.length}</div>
                <div>Last Updated: {notebook.updatedAt.toLocaleString()}</div>
                <div>Author: {notebook.author}</div>
              </div>

              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 mt-6">Quick Actions</h3>
              <div className="space-y-2">
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Create Visualization
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <Brain className="h-4 w-4 mr-2" />
                  ML Pipeline
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <Calculator className="h-4 w-4 mr-2" />
                  Statistical Analysis
                </Button>
              </div>

              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 mt-6">Kernels</h3>
              <div className="space-y-1">
                {kernels.map((kernel) => (
                  <div
                    key={kernel.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded cursor-pointer",
                      currentKernel?.id === kernel.id ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                    onClick={() => setCurrentKernel(kernel)}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      kernel.status === 'idle' ? "bg-green-500" :
                      kernel.status === 'busy' ? "bg-yellow-500" :
                      kernel.status === 'error' ? "bg-red-500" : "bg-gray-400"
                    )} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{kernel.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notebook Cells */}
        <div className="flex-1 overflow-y-auto p-4 rounded-br-lg" ref={notebookRef}>
          {notebook.cells.length === 0 ? (
            <div className="text-center py-12">
              <FileCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Start Your Data Science Journey</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first cell to begin analyzing data</p>
              <Button onClick={() => addNewCell('python')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Python Cell
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {notebook.cells.map((cell, index) => (
                <div
                  key={cell.id}
                  ref={(el) => {
                    if (el) cellRefs.current.set(cell.id, el)
                  }}
                >
                  {renderCell(cell, index)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File Manager */}
        {showFileManager && enableFileManager && (
          <div className="w-96 border-l border-gray-200 dark:border-gray-700">
            <FileManager
              onFileSelect={(file) => {
                // Handle file selection
                toast.success(`Selected: ${file.name}`)
              }}
              onFileUpload={async (file) => {
                // Mock file upload
                return `file_${Date.now()}`
              }}
              onFileCreate={async (name, type) => {
                // Mock file creation
                return {
                  id: `file_${Date.now()}`,
                  name,
                  type,
                  size: 0,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  isPublic: false,
                  isStarred: false,
                  tags: [],
                  owner: 'Current User',
                  path: `/${name}`
                }
              }}
              onFileDelete={async (fileId) => {
                // Mock file deletion
                toast.success('File deleted')
              }}
              onFileRename={async (fileId, newName) => {
                // Mock file rename
                toast.success('File renamed')
              }}
              onFileShare={async (fileId, permissions) => {
                // Mock file sharing
                return `https://notebook.app/share/${fileId}`
              }}
              currentNotebookId={notebook.id}
            />
          </div>
        )}

        {/* Collaboration Panel */}
        {showCollaboration && enableCollaboration && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700">
            <CollaborationPanel
              notebookId={notebook.id}
              currentUser={{
                id: 'current_user',
                name: 'Current User',
                email: 'user@example.com',
                role: 'owner',
                status: 'online',
                lastSeen: new Date(),
                isTyping: false,
                color: '#3B82F6'
              }}
              onUserJoin={(user) => {
                toast.success(`${user.name} joined the collaboration`)
              }}
              onUserLeave={(userId) => {
                toast('User left the collaboration')
              }}
              onCursorUpdate={(userId, cursor) => {
                // Handle cursor updates
              }}
              onTypingStart={(userId) => {
                // Handle typing start
              }}
              onTypingStop={(userId) => {
                // Handle typing stop
              }}
              onMessage={(message) => {
                toast(`New message from ${message.userName}`)
              }}
              onPermissionChange={(permissions) => {
                toast.success('Permissions updated')
              }}
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 rounded-b-lg mt-6">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>Cells: {notebook.cells.length}</span>
            <span>Executed: {notebook.cells.filter(c => c.status === 'success').length}</span>
            <span>Errors: {notebook.cells.filter(c => c.status === 'error').length}</span>
            {currentKernel && (
              <span>Kernel: {currentKernel.name}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>Auto-save: {notebook.settings?.autoSave ? 'On' : 'Off'}</span>
            <span>Mode: {notebook.settings?.executionMode}</span>
            {isExecuting && (
              <div className="flex items-center gap-2 text-blue-600">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span className="font-medium">Executing...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}