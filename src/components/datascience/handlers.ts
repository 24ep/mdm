'use client'

import toast from 'react-hot-toast'
import { notebookEngine } from '@/lib/notebook-engine'
import { Notebook, NotebookCell, CellType, Variable, FileItem } from './types'
import { createNewCell, getDefaultContent, generateCellId, exportNotebook, importNotebook, copyToClipboard } from './utils'

export interface NotebookHandlers {
  // Cell operations
  createNewCell: (type: CellType, position?: 'above' | 'below', targetCellId?: string) => void
  deleteCell: (cellId: string) => void
  updateCellContent: (cellId: string, content: string) => void
  moveCell: (cellId: string, direction: 'up' | 'down') => void
  executeCell: (cellId: string) => Promise<void>
  executeAllCells: () => Promise<void>
  clearAllOutputs: () => void
  
  // Cell selection and navigation
  focusNextCell: () => void
  focusPreviousCell: () => void
  selectAllCells: () => void
  copyCell: (cellId: string) => void
  pasteCell: () => void
  mergeCells: () => void
  splitCell: (cellId: string) => void
  toggleCellType: (cellId: string) => void
  
  // File operations
  handleSave: () => void
  handleExport: () => void
  handleImport: () => void
  handleOpenFile: (filePath: string) => void
  handleNewFile: () => void
  handleNewFolder: () => void
  handleUploadFile: () => void
  handleDeleteFile: (filePath: string) => void
  handleRenameFile: (filePath: string, newName: string) => void
  handleMoveFile: (filePath: string, newPath: string) => void
  
  // Kernel operations
  handleInterrupt: () => void
  handleRestart: () => void
  handleShutdown: () => void
  handleRunSelected: () => void
  
  // UI operations
  toggleOutput: () => void
  find: () => void
  replace: () => void
  undo: () => void
  redo: () => void
  handleSelectTemplate: (template: Notebook) => void
}

export function createNotebookHandlers(
  state: any,
  actions: any,
  dataSource?: { data: any[]; metadata: any },
  onSave?: (notebook: Notebook) => void
): NotebookHandlers {
  const {
    notebook,
    activeCellId,
    selectedCellIds,
    currentKernel,
    variables,
    files
  } = state

  const {
    setNotebook,
    setActiveCellId,
    setSelectedCellIds,
    setIsExecuting,
    setKernelStatus,
    setExecutionCount,
    setVariables,
    setFiles,
    setShowTemplates,
    setShowOutput
  } = actions

  // Cell operations
  const createNewCellHandler = (type: CellType, position?: 'above' | 'below', targetCellId?: string) => {
    const newCell = createNewCell(type)

    setNotebook((prev: Notebook) => {
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

  const deleteCell = (cellId: string) => {
    setNotebook((prev: Notebook) => ({
      ...prev,
      cells: prev.cells.filter(cell => cell.id !== cellId),
      updatedAt: new Date()
    }))
    setActiveCellId(null)
    toast.success('Cell deleted')
  }

  const updateCellContent = (cellId: string, content: string) => {
    setNotebook((prev: Notebook) => ({
      ...prev,
      cells: prev.cells.map(cell => 
        cell.id === cellId ? { ...cell, content, timestamp: new Date() } : cell
      ),
      updatedAt: new Date()
    }))
  }

  const moveCell = (cellId: string, direction: 'up' | 'down') => {
    setNotebook((prev: Notebook) => {
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
    setNotebook((prev: Notebook) => ({
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
      setNotebook((prev: Notebook) => ({
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
      setNotebook((prev: Notebook) => ({
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

  const executeAllCells = async () => {
    const codeCells = notebook.cells.filter(cell => cell.type === 'code')
    for (const cell of codeCells) {
      await executeCell(cell.id)
    }
  }

  const clearAllOutputs = () => {
    setNotebook((prev: Notebook) => ({
      ...prev,
      cells: prev.cells.map(cell => ({ ...cell, output: undefined, status: 'idle' })),
      updatedAt: new Date()
    }))
    setExecutionCount(0)
    toast.success('All outputs cleared')
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

  const copyCell = (cellId: string) => {
    const cell = notebook.cells.find(c => c.id === cellId)
    if (cell) {
      copyToClipboard(JSON.stringify(cell))
      toast.success('Cell copied to clipboard')
    }
  }

  const pasteCell = () => {
    navigator.clipboard.readText().then(text => {
      try {
        const cell = JSON.parse(text)
        const newCell = { ...cell, id: generateCellId() }
        setNotebook((prev: Notebook) => ({
          ...prev,
          cells: [...prev.cells, newCell],
          updatedAt: new Date()
        }))
        setActiveCellId(newCell.id)
        toast.success('Cell pasted')
      } catch (error) {
        toast.error('Invalid cell data in clipboard')
      }
    })
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
    setNotebook((prev: Notebook) => ({
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

  // File operations
  const handleSave = () => {
    onSave?.(notebook)
    toast.success('Notebook saved')
  }

  const handleExport = () => {
    exportNotebook(notebook)
    toast.success('Notebook exported')
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.ipynb,.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const importedNotebook = await importNotebook(file)
          setNotebook(importedNotebook)
          toast.success('Notebook imported')
        } catch (error) {
          toast.error('Failed to import notebook')
        }
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
    setFiles((prev: FileItem[]) => prev.filter(file => file.name !== filePath))
    toast.success(`Deleted: ${filePath}`)
  }

  const handleRenameFile = (filePath: string, newName: string) => {
    setFiles((prev: FileItem[]) => prev.map(file => 
      file.name === filePath ? { ...file, name: newName } : file
    ))
    toast.success(`Renamed to: ${newName}`)
  }

  const handleMoveFile = (filePath: string, newPath: string) => {
    toast.success(`Moved ${filePath} to ${newPath}`)
  }

  const toggleOutput = () => {
    setShowOutput(!state.showOutput)
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

  const handleShowTemplates = () => {
    setShowTemplates(true)
  }

  return {
    createNewCell: createNewCellHandler,
    deleteCell,
    updateCellContent,
    moveCell,
    executeCell,
    executeAllCells,
    clearAllOutputs,
    focusNextCell,
    focusPreviousCell,
    selectAllCells,
    copyCell,
    pasteCell,
    mergeCells,
    splitCell,
    toggleCellType,
    handleSave,
    handleExport,
    handleImport,
    handleOpenFile,
    handleNewFile,
    handleNewFolder,
    handleUploadFile,
    handleDeleteFile,
    handleRenameFile,
    handleMoveFile,
    handleInterrupt,
    handleRestart,
    handleShutdown,
    handleRunSelected,
    toggleOutput,
    find,
    replace,
    undo,
    redo,
    handleSelectTemplate,
    handleShowTemplates
  }
}
