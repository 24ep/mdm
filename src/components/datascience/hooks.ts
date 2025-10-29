'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { notebookEngine, Kernel } from '@/lib/notebook-engine'
import { Notebook, NotebookState, NotebookActions } from './types'
import { createNewCell, generateNotebookId } from './utils'

export function useNotebookState(initialNotebook?: Notebook): [NotebookState, NotebookActions] {
  const [notebook, setNotebook] = useState<Notebook>(initialNotebook || {
    id: generateNotebookId(),
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
  const [selectedCellType, setSelectedCellType] = useState<'code' | 'markdown' | 'raw'>('code')
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

  const state: NotebookState = useMemo(() => ({
    notebook,
    activeCellId,
    selectedCellIds,
    isExecuting,
    showSidebar,
    showFileManager,
    showCollaboration,
    selectedCellType,
    notebookHistory,
    showHistory,
    showSettings,
    showExport,
    showTemplates,
    isFullscreen,
    layout,
    currentTheme,
    showVariables,
    showOutput,
    kernelStatus,
    executionCount,
    currentKernel,
    kernels,
    variables,
    files
  }), [
    notebook,
    activeCellId,
    selectedCellIds,
    isExecuting,
    showSidebar,
    showFileManager,
    showCollaboration,
    selectedCellType,
    notebookHistory,
    showHistory,
    showSettings,
    showExport,
    showTemplates,
    isFullscreen,
    layout,
    currentTheme,
    showVariables,
    showOutput,
    kernelStatus,
    executionCount,
    currentKernel,
    kernels,
    variables,
    files
  ])

  const actions: NotebookActions = useMemo(() => ({
    setNotebook,
    setActiveCellId,
    setSelectedCellIds,
    setIsExecuting,
    setShowSidebar,
    setShowFileManager,
    setShowCollaboration,
    setSelectedCellType,
    setNotebookHistory,
    setShowHistory,
    setShowSettings,
    setShowExport,
    setShowTemplates,
    setIsFullscreen,
    setLayout,
    setCurrentTheme,
    setShowVariables,
    setShowOutput,
    setKernelStatus,
    setExecutionCount,
    setCurrentKernel,
    setKernels,
    setVariables,
    setFiles
  }), [
    setNotebook,
    setActiveCellId,
    setSelectedCellIds,
    setIsExecuting,
    setShowSidebar,
    setShowFileManager,
    setShowCollaboration,
    setSelectedCellType,
    setNotebookHistory,
    setShowHistory,
    setShowSettings,
    setShowExport,
    setShowTemplates,
    setIsFullscreen,
    setLayout,
    setCurrentTheme,
    setShowVariables,
    setShowOutput,
    setKernelStatus,
    setExecutionCount,
    setCurrentKernel,
    setKernels,
    setVariables,
    setFiles
  ])

  return [state, actions]
}

export function useKernelInitialization() {
  const [kernels, setKernels] = useState<Kernel[]>([])
  const [currentKernel, setCurrentKernel] = useState<Kernel | null>(null)

  useEffect(() => {
    const availableKernels = notebookEngine.getAllKernels()
    setKernels(availableKernels)
    if (availableKernels.length > 0) {
      setCurrentKernel(availableKernels[0])
    }
  }, [])

  return { kernels, currentKernel, setCurrentKernel }
}

export function useNotebookRefs() {
  const notebookRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const scrollToCell = useCallback((cellId: string) => {
    const cellElement = cellRefs.current.get(cellId)
    if (cellElement) {
      cellElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const focusCell = useCallback((cellId: string) => {
    const cellElement = cellRefs.current.get(cellId)
    if (cellElement) {
      const textarea = cellElement.querySelector('textarea')
      if (textarea) {
        textarea.focus()
      }
    }
  }, [])

  return {
    notebookRef,
    cellRefs,
    scrollToCell,
    focusCell
  }
}

export function useAutoSave(notebook: Notebook, onSave?: (notebook: Notebook) => void) {
  useEffect(() => {
    if (notebook.settings.autoSave && onSave) {
      const timeoutId = setTimeout(() => {
        onSave(notebook)
      }, 2000) // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId)
    }
  }, [notebook, onSave])
}

export function useKeyboardNavigation(
  notebook: Notebook,
  activeCellId: string | null,
  setActiveCellId: (id: string | null) => void
) {
  const focusNextCell = useCallback(() => {
    const currentIndex = notebook.cells.findIndex(cell => cell.id === activeCellId)
    if (currentIndex < notebook.cells.length - 1) {
      setActiveCellId(notebook.cells[currentIndex + 1].id)
    }
  }, [notebook.cells, activeCellId, setActiveCellId])

  const focusPreviousCell = useCallback(() => {
    const currentIndex = notebook.cells.findIndex(cell => cell.id === activeCellId)
    if (currentIndex > 0) {
      setActiveCellId(notebook.cells[currentIndex - 1].id)
    }
  }, [notebook.cells, activeCellId, setActiveCellId])

  const focusFirstCell = useCallback(() => {
    if (notebook.cells.length > 0) {
      setActiveCellId(notebook.cells[0].id)
    }
  }, [notebook.cells, setActiveCellId])

  const focusLastCell = useCallback(() => {
    if (notebook.cells.length > 0) {
      setActiveCellId(notebook.cells[notebook.cells.length - 1].id)
    }
  }, [notebook.cells, setActiveCellId])

  return {
    focusNextCell,
    focusPreviousCell,
    focusFirstCell,
    focusLastCell
  }
}
