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
  handleCreateFile: (name: string) => void
  handleCreateFolder: (name: string) => void
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
  handleShowTemplates: () => void
  // SQL specific
  handleVariableNameChange: (cellId: string, variableName: string) => void
  handleConnectionChange: (cellId: string, connection: string) => void
  handleSQLExecute: (cellId: string) => Promise<void> | void
  // Common cell feature handlers
  handleCopyCell: (cellId: string) => void
  handleCutCell: (cellId: string) => void
  handlePasteCell: (cellId: string) => void
  handleMergeCells: (cellId: string, direction: 'above' | 'below') => void
  handleSplitCell: (cellId: string) => void
  handleAddComment: (cellId: string, content?: string) => void
  handleAddTag: (cellId: string) => void
  handleSearchCell: (cellId: string) => void
  handleRenameCellTitle: (cellId: string, title: string) => void
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
    const ext = filePath.split('.').pop()?.toLowerCase()
    if (ext === 'csv') {
      toast.success(`Opening spreadsheet: ${filePath}`)
    } else if (ext === 'md') {
      toast.success(`Opening markdown: ${filePath}`)
    } else if (ext === 'ipynb') {
      toast.success(`Opening notebook: ${filePath}`)
    } else {
      toast.success(`Opening file: ${filePath}`)
    }
  }

  const handleNewFile = () => {
    const name = prompt('Enter file name (e.g., notebook.ipynb, data.csv, notes.md):')
    if (!name) return
    const now = new Date()
    setFiles((prev: FileItem[]) => [{ name, type: 'file', modified: now }, ...prev])
    toast.success(`Created ${name}`)
  }

  const handleCreateFile = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const now = new Date()
    setFiles((prev: FileItem[]) => [{ name: trimmed, type: 'file', modified: now }, ...prev])
    toast.success(`Created ${trimmed}`)
  }

  const handleNewFolder = () => {
    const name = prompt('Enter folder name:')
    if (!name) return
    const now = new Date()
    setFiles((prev: FileItem[]) => [{ name, type: 'folder', modified: now }, ...prev])
    toast.success(`Folder "${name}" created`)
  }

  const handleCreateFolder = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const now = new Date()
    setFiles((prev: FileItem[]) => [{ name: trimmed, type: 'folder', modified: now }, ...prev])
    toast.success(`Folder "${trimmed}" created`)
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
    // Support simple reordering via newPath like "index:NUMBER"
    if (newPath.startsWith('index:')) {
      const index = parseInt(newPath.split(':')[1] || '0', 10)
      setFiles((prev: FileItem[]) => {
        const list = [...prev]
        const from = list.findIndex(f => f.name === filePath)
        if (from === -1) return prev
        const [item] = list.splice(from, 1)
        const to = Math.max(0, Math.min(index, list.length))
        list.splice(to, 0, item)
        return list
      })
      toast.success(`Reordered: ${filePath}`)
      return
    }
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

  const handleRenameCellTitle = (cellId: string, title: string) => {
    setNotebook(prev => ({
      ...prev,
      cells: prev.cells.map(cell => cell.id === cellId ? { ...cell, title } : cell),
      updatedAt: new Date()
    }))
  }

  // Common cell feature handlers
  const handleCopyCell = (cellId: string) => {
    const cell = notebook.cells.find(c => c.id === cellId)
    if (cell) {
      // Copy to clipboard
      navigator.clipboard.writeText(cell.content)
      toast.success('Cell copied to clipboard')
    }
  }

  const handleCutCell = (cellId: string) => {
    const cell = notebook.cells.find(c => c.id === cellId)
    if (cell) {
      navigator.clipboard.writeText(cell.content)
      deleteCell(cellId)
      toast.success('Cell cut and copied to clipboard')
    }
  }

  const handlePasteCell = (cellId: string) => {
    navigator.clipboard.readText().then(text => {
      if (text) {
        const newCell = createNewCell('code')
        newCell.content = text
        setNotebook(prev => ({
          ...prev,
          cells: prev.cells.map(c => 
            c.id === cellId ? newCell : c
          ),
          updatedAt: new Date()
        }))
        toast.success('Cell pasted')
      }
    }).catch(() => {
      toast.error('Failed to paste cell')
    })
  }

  const handleMergeCells = (cellId: string, direction: 'above' | 'below') => {
    const currentIndex = notebook.cells.findIndex(c => c.id === cellId)
    const targetIndex = direction === 'above' ? currentIndex - 1 : currentIndex + 1
    
    if (targetIndex >= 0 && targetIndex < notebook.cells.length) {
      const currentCell = notebook.cells[currentIndex]
      const targetCell = notebook.cells[targetIndex]
      
      const mergedContent = direction === 'above' 
        ? `${targetCell.content}\n${currentCell.content}`
        : `${currentCell.content}\n${targetCell.content}`
      
      setNotebook(prev => ({
        ...prev,
        cells: prev.cells.map((cell, idx) => {
          if (idx === currentIndex) {
            return { ...cell, content: mergedContent }
          } else if (idx === targetIndex) {
            return null // Will be filtered out
          }
          return cell
        }).filter(Boolean),
        updatedAt: new Date()
      }))
      toast.success('Cells merged')
    }
  }

  const handleSplitCell = (cellId: string) => {
    const cell = notebook.cells.find(c => c.id === cellId)
    if (cell && cell.content.trim()) {
      const lines = cell.content.split('\n')
      const midPoint = Math.floor(lines.length / 2)
      
      const firstHalf = lines.slice(0, midPoint).join('\n')
      const secondHalf = lines.slice(midPoint).join('\n')
      
      const newCell = createNewCell(cell.type)
      newCell.content = secondHalf
      
      setNotebook(prev => ({
        ...prev,
        cells: prev.cells.map(c => 
          c.id === cellId 
            ? { ...c, content: firstHalf }
            : c
        ).concat(newCell),
        updatedAt: new Date()
      }))
      toast.success('Cell split')
    }
  }

  const handleAddComment = (cellId: string, content?: string) => {
    const commentText = content ?? prompt('Add a comment:') ?? ''
    if (commentText) {
      setNotebook(prev => ({
        ...prev,
        cells: prev.cells.map(cell => 
          cell.id === cellId 
            ? {
                ...cell,
                comments: [
                  ...(cell.comments || []),
                  {
                    id: `comment-${Date.now()}`,
                    content: commentText,
                    author: 'Current User',
                    timestamp: new Date()
                  }
                ]
              }
            : cell
        ),
        updatedAt: new Date()
      }))
      toast.success('Comment added')
    }
  }

  const handleAddTag = (cellId: string) => {
    const tag = prompt('Add a tag:')
    if (tag) {
      setNotebook(prev => ({
        ...prev,
        cells: prev.cells.map(cell => 
          cell.id === cellId 
            ? {
                ...cell,
                tags: [...(cell.tags || []), tag]
              }
            : cell
        ),
        updatedAt: new Date()
      }))
      toast.success('Tag added')
    }
  }

  const handleSearchCell = (cellId: string) => {
    const searchTerm = prompt('Search in cell:')
    if (searchTerm) {
      const cell = notebook.cells.find(c => c.id === cellId)
      if (cell && cell.content.includes(searchTerm)) {
        toast.success(`Found "${searchTerm}" in cell`)
        // In a real implementation, you'd highlight the search term
      } else {
        toast.error(`"${searchTerm}" not found in cell`)
      }
    }
  }

  // SQL-specific handlers
  const handleVariableNameChange = (cellId: string, variableName: string) => {
    setNotebook(prev => ({
      ...prev,
      cells: prev.cells.map(cell => 
        cell.id === cellId 
          ? { ...cell, sqlVariableName: variableName, updatedAt: new Date() }
          : cell
      ),
      updatedAt: new Date()
    }))
  }

  const handleConnectionChange = (cellId: string, connection: string) => {
    setNotebook(prev => ({
      ...prev,
      cells: prev.cells.map(cell => 
        cell.id === cellId 
          ? { ...cell, sqlConnection: connection, updatedAt: new Date() }
          : cell
      ),
      updatedAt: new Date()
    }))
  }

  const handleSQLExecute = async (cellId: string) => {
    const cell = notebook.cells.find(c => c.id === cellId)
    if (!cell || cell.type !== 'sql') return

    if (!cell.sqlQuery || !cell.sqlVariableName) {
      toast.error('Please enter both SQL query and variable name')
      return
    }

    setIsExecuting(true)
    setKernelStatus('busy')
    
    setNotebook(prev => ({
      ...prev,
      cells: prev.cells.map(c => 
        c.id === cellId ? { ...c, status: 'running' } : c
      )
    }))

    try {
      const startTime = Date.now()
      
      // Mock SQL execution - replace with actual SQL execution
      const mockResult = {
        data: [
          { id: 1, name: 'John Doe', age: 30, city: 'New York' },
          { id: 2, name: 'Jane Smith', age: 25, city: 'Los Angeles' },
          { id: 3, name: 'Bob Johnson', age: 35, city: 'Chicago' }
        ],
        columns: ['id', 'name', 'age', 'city'],
        rowCount: 3,
        columnCount: 4,
        preview: {
          columns: ['id', 'name', 'age', 'city'],
          data: [
            [1, 'John Doe', 30, 'New York'],
            [2, 'Jane Smith', 25, 'Los Angeles'],
            [3, 'Bob Johnson', 35, 'Chicago']
          ]
        }
      }

      const executionTime = Date.now() - startTime

      setNotebook(prev => ({
        ...prev,
        cells: prev.cells.map(c => 
          c.id === cellId 
            ? { 
                ...c, 
                output: mockResult, 
                status: 'success', 
                executionTime,
                timestamp: new Date()
              } 
            : c
        )
      }))

      // Add the variable to the variables list
      const newVariable = {
        name: cell.sqlVariableName,
        type: 'DataFrame',
        value: `Shape: (${mockResult.rowCount}, ${mockResult.columnCount})`,
        size: `${mockResult.rowCount} rows × ${mockResult.columnCount} columns`
      }

      setVariables(prev => {
        const existing = prev.find(v => v.name === cell.sqlVariableName)
        if (existing) {
          return prev.map(v => v.name === cell.sqlVariableName ? newVariable : v)
        } else {
          return [...prev, newVariable]
        }
      })

      setKernelStatus('idle')
      setExecutionCount(prev => prev + 1)
      toast.success(`SQL query executed and saved as '${cell.sqlVariableName}'`)
    } catch (error) {
      setNotebook(prev => ({
        ...prev,
        cells: prev.cells.map(c => 
          c.id === cellId 
            ? { 
                ...c, 
                output: { 
                  error: error instanceof Error ? error.message : 'SQL execution failed',
                  details: error 
                }, 
                status: 'error',
                timestamp: new Date()
              } 
            : c
        )
      }))
      setKernelStatus('error')
      toast.error('SQL query execution failed')
    } finally {
      setIsExecuting(false)
    }
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
    handleShowTemplates,
    handleVariableNameChange,
    handleConnectionChange,
    handleSQLExecute,
    handleCopyCell,
    handleCutCell,
    handlePasteCell,
    handleMergeCells,
    handleSplitCell,
    handleAddComment,
    handleAddTag,
    handleSearchCell,
    handleRenameCellTitle
  }
}
