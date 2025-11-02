'use client'

import toast from 'react-hot-toast'
import { notebookEngine } from '@/lib/notebook-engine'
import { Notebook, NotebookCell, CellType, Variable, FileItem } from './types'
import { createNewCell, getDefaultContent, generateCellId, exportNotebook, importNotebook, copyToClipboard } from './utils'

// History store for undo/redo functionality - uses WeakMap to store state per handler instance
const historyStore = new WeakMap<any, {
  history: Notebook[]
  historyIndex: number
  findReplaceState: {
    searchText: string
    replaceText: string
    matches: any[]
    currentMatchIndex: number
  }
}>()

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
  find: (searchText?: string) => void
  replace: (searchText?: string, replaceText?: string, replaceAll?: boolean) => void
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

  // Get or create history store for this handler instance
  let store = historyStore.get(actions)
  if (!store) {
    store = {
      history: [JSON.parse(JSON.stringify(notebook))],
      historyIndex: 0,
      findReplaceState: {
        searchText: '',
        replaceText: '',
        matches: [],
        currentMatchIndex: 0
      }
    }
    historyStore.set(actions, store)
  }

  const MAX_HISTORY = 50

  const saveToHistory = (notebook: Notebook) => {
    const history = store!.history
    const index = store!.historyIndex
    
    // Remove any future history if we're not at the end
    if (index < history.length - 1) {
      history.splice(index + 1)
    }
    
    // Add new state
    history.push(JSON.parse(JSON.stringify(notebook)))
    
    // Limit history size
    if (history.length > MAX_HISTORY) {
      history.shift()
    } else {
      store!.historyIndex++
    }
  }

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
      
      const updated = {
        ...prev,
        cells: newCells,
        updatedAt: new Date()
      }
      saveToHistory(updated)
      return updated
    })

    setActiveCellId(newCell.id)
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} cell added`)
  }

  const deleteCell = (cellId: string) => {
    setNotebook((prev: Notebook) => {
      const updated = {
        ...prev,
        cells: prev.cells.filter(cell => cell.id !== cellId),
        updatedAt: new Date()
      }
      saveToHistory(updated)
      return updated
    })
    setActiveCellId(null)
    toast.success('Cell deleted')
  }

  // Debounce timer for history saving
  let historySaveTimer: NodeJS.Timeout | null = null

  const updateCellContent = (cellId: string, content: string) => {
    setNotebook((prev: Notebook) => {
      const updated = {
        ...prev,
        cells: prev.cells.map(cell => 
          cell.id === cellId 
            ? { 
                ...cell, 
                content, 
                ...(cell.type === 'sql' ? { sqlQuery: content } : {}),
                timestamp: new Date() 
              } 
            : cell
        ),
        updatedAt: new Date()
      }
      // Save to history (debounced)
      if (historySaveTimer) {
        clearTimeout(historySaveTimer)
      }
      historySaveTimer = setTimeout(() => {
        saveToHistory(updated)
        historySaveTimer = null
      }, 500)
      return updated
    })
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
    
    // Get selected cells in order
    const selectedArray = Array.from(selectedCellIds)
    const cellsToMerge = selectedArray
      .map(id => {
        const index = notebook.cells.findIndex(c => c.id === id)
        return { id, index, cell: notebook.cells[index] }
      })
      .filter(item => item.index !== -1)
      .sort((a, b) => a.index - b.index)
    
    if (cellsToMerge.length < 2) {
      toast.error('Could not find cells to merge')
      return
    }
    
    // Merge content from all cells
    const mergedContent = cellsToMerge
      .map(item => {
        const cell = item.cell
        const content = cell.type === 'sql' ? (cell.sqlQuery || cell.content) : cell.content
        return content
      })
      .filter(content => content.trim())
      .join('\n\n')
    
    // Determine merged cell type (prefer code, then sql, then markdown)
    const mergedType = cellsToMerge.find(item => 
      item.cell.type === 'code' || item.cell.type === 'sql'
    )?.cell.type || cellsToMerge[0].cell.type
    
    // Create merged cell
    const firstCell = cellsToMerge[0].cell
    const mergedCell: NotebookCell = {
      ...firstCell,
      content: mergedContent,
      ...(mergedType === 'sql' ? { sqlQuery: mergedContent } : {}),
      timestamp: new Date()
    }
    
    // Replace first cell with merged cell, remove others
    setNotebook((prev: Notebook) => {
      const newCells = [...prev.cells]
      const firstIndex = cellsToMerge[0].index
      
      // Replace first cell
      newCells[firstIndex] = mergedCell
      
      // Remove other merged cells (in reverse order to maintain indices)
      for (let i = cellsToMerge.length - 1; i > 0; i--) {
        newCells.splice(cellsToMerge[i].index, 1)
      }
      
      const updated = {
        ...prev,
        cells: newCells,
        updatedAt: new Date()
      }
      saveToHistory(updated)
      return updated
    })
    
    setSelectedCellIds(new Set([mergedCell.id]))
    setActiveCellId(mergedCell.id)
    toast.success(`Merged ${cellsToMerge.length} cells`)
  }

  const splitCell = (cellId: string) => {
    const cell = notebook.cells.find(c => c.id === cellId)
    if (!cell) {
      toast.error('Cell not found')
      return
    }
    
    const content = cell.type === 'sql' ? (cell.sqlQuery || cell.content) : cell.content
    const lines = content.split('\n')
    
    if (lines.length < 2) {
      toast.error('Cell must have at least 2 lines to split')
      return
    }
    
    const midPoint = Math.floor(lines.length / 2)
    const firstHalf = lines.slice(0, midPoint).join('\n')
    const secondHalf = lines.slice(midPoint).join('\n')
    
    // Find cell index
    const cellIndex = notebook.cells.findIndex(c => c.id === cellId)
    if (cellIndex === -1) return
    
    // Create new cell for second half
    const newCell = createNewCell(cell.type)
    newCell.content = secondHalf
    if (cell.type === 'sql') {
      newCell.sqlQuery = secondHalf
      newCell.sqlVariableName = cell.sqlVariableName || ''
      newCell.sqlConnection = cell.sqlConnection || 'default'
    }
    
    // Update first cell and insert new cell
    setNotebook((prev: Notebook) => {
      const newCells = [...prev.cells]
      newCells[cellIndex] = {
        ...cell,
        content: firstHalf,
        ...(cell.type === 'sql' ? { sqlQuery: firstHalf } : {}),
        timestamp: new Date()
      }
      newCells.splice(cellIndex + 1, 0, newCell)
      
      const updated = {
        ...prev,
        cells: newCells,
        updatedAt: new Date()
      }
      saveToHistory(updated)
      return updated
    })
    
    setActiveCellId(newCell.id)
    toast.success('Cell split successfully')
  }

  const toggleCellType = (cellId: string) => {
    setNotebook((prev: Notebook) => {
      const updated = {
        ...prev,
        cells: prev.cells.map(cell => {
          if (cell.id === cellId) {
            const newType: CellType = cell.type === 'code' 
              ? 'markdown' 
              : cell.type === 'markdown' 
                ? 'raw' 
                : cell.type === 'raw'
                  ? 'sql'
                  : 'code'
            const newContent = getDefaultContent(newType)
            
            const updatedCell: NotebookCell = {
              ...cell,
              type: newType,
              content: newContent,
              ...(newType === 'sql' ? {
                sqlQuery: newContent,
                sqlVariableName: '',
                sqlConnection: 'default'
              } : {}),
              // Clear SQL-specific fields if switching away from SQL
              ...(cell.type === 'sql' && newType !== 'sql' ? {
                sqlQuery: undefined,
                sqlVariableName: undefined,
                sqlConnection: undefined
              } : {}),
              timestamp: new Date()
            }
            return updatedCell
          }
          return cell
        }),
        updatedAt: new Date()
      }
      saveToHistory(updated)
      return updated
    })
    toast.success('Cell type changed')
  }

  // File operations
  const handleSave = async () => {
    try {
      // Save notebook
      await onSave?.(notebook)
      
      // Auto-create version if enabled (you can add a flag for this)
      // For now, we'll create a version on manual save
      if (notebook.id) {
        try {
          await fetch(`/api/notebooks/${encodeURIComponent(notebook.id)}/versions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              notebook_data: notebook,
              commit_message: 'Manual save',
              commit_description: 'Notebook saved manually',
              branch_name: 'main',
              tags: [],
              change_summary: {
                files_modified: ['notebook.ipynb'],
                lines_added: 0,
                lines_deleted: 0
              },
              is_current: true
            })
          })
        } catch (versionError) {
          console.error('Failed to create version:', versionError)
          // Don't fail the save if versioning fails
        }
      }
      
      toast.success('Notebook saved')
    } catch (error) {
      toast.error('Failed to save notebook')
    }
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

  const find = (searchText?: string) => {
    // If searchText is provided, use it; otherwise use prompt for backward compatibility
    const finalSearchText = searchText || prompt('Find:', store.findReplaceState.searchText) || ''
    
    if (finalSearchText) {
      store.findReplaceState.searchText = finalSearchText
      
      // Find all matches
      const matches: Array<{ cellId: string; index: number }> = []
      notebook.cells.forEach(cell => {
        const content = cell.type === 'sql' ? (cell.sqlQuery || cell.content) : cell.content
        let index = -1
        let startIndex = 0
        while ((index = content.toLowerCase().indexOf(finalSearchText.toLowerCase(), startIndex)) !== -1) {
          matches.push({ cellId: cell.id, index })
          startIndex = index + 1
        }
      })
      
      store.findReplaceState.matches = matches
      store.findReplaceState.currentMatchIndex = 0
      
      if (matches.length > 0) {
        // Focus on first match
        setActiveCellId(matches[0].cellId)
        toast.success(`Found ${matches.length} match(es)`)
      } else {
        toast.error('No matches found')
      }
    }
  }

  const replace = (searchText?: string, replaceText?: string, replaceAll: boolean = false) => {
    // If parameters provided, use them; otherwise use prompts for backward compatibility
    const finalSearchText = searchText || prompt('Find:', store.findReplaceState.searchText) || ''
    const finalReplaceText = replaceText !== undefined ? replaceText : (prompt('Replace with:', store.findReplaceState.replaceText) || '')
    
    if (!finalSearchText) {
      if (!searchText) {
        toast.error('Search text is required')
      }
      return
    }
    
    store.findReplaceState.searchText = finalSearchText
    store.findReplaceState.replaceText = finalReplaceText
    
    // Find all matches and replace
    let replacedCount = 0
    setNotebook((prev: Notebook) => {
      const updated = {
        ...prev,
        cells: prev.cells.map(cell => {
          const content = cell.type === 'sql' ? (cell.sqlQuery || cell.content) : cell.content
          const regex = new RegExp(finalSearchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
          const newContent = replaceAll 
            ? content.replace(regex, finalReplaceText)
            : content.replace(regex, (match) => {
                replacedCount++
                return finalReplaceText
              })
          
          if (replaceAll) {
            // Count all replacements
            const matches = content.match(regex)
            if (matches) {
              replacedCount += matches.length
            }
          }
          
          if (newContent !== content) {
            return {
              ...cell,
              content: newContent,
              ...(cell.type === 'sql' ? { sqlQuery: newContent } : {}),
              timestamp: new Date()
            }
          }
          return cell
        }),
        updatedAt: new Date()
      }
      saveToHistory(updated)
      return updated
    })
    
    if (replacedCount > 0) {
      toast.success(`Replaced ${replacedCount} occurrence(s)`)
    } else {
      toast.error('No matches found to replace')
    }
  }

  const undo = () => {
    const history = store.history
    const index = store.historyIndex
    
    if (index > 0) {
      store.historyIndex--
      const previousState = history[index - 1]
      setNotebook(JSON.parse(JSON.stringify(previousState)))
      toast.success('Undone')
    } else {
      toast.error('Nothing to undo')
    }
  }

  const redo = () => {
    const history = store.history
    const index = store.historyIndex
    
    if (index < history.length - 1) {
      store.historyIndex++
      const nextState = history[index + 1]
      setNotebook(JSON.parse(JSON.stringify(nextState)))
      toast.success('Redone')
    } else {
      toast.error('Nothing to redo')
    }
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
      
      // Get content for both cells (handle SQL cells)
      const currentContent = currentCell.type === 'sql' 
        ? (currentCell.sqlQuery || currentCell.content) 
        : currentCell.content
      const targetContent = targetCell.type === 'sql' 
        ? (targetCell.sqlQuery || targetCell.content) 
        : targetCell.content
      
      const mergedContent = direction === 'above' 
        ? `${targetContent}\n\n${currentContent}`
        : `${currentContent}\n\n${targetContent}`
      
      setNotebook(prev => {
        const updated = {
          ...prev,
          cells: prev.cells.map((cell, idx) => {
            if (idx === currentIndex) {
              const updatedCell = { 
                ...cell, 
                content: mergedContent,
                timestamp: new Date()
              }
              // Handle SQL cells
              if (cell.type === 'sql') {
                updatedCell.sqlQuery = mergedContent
              }
              return updatedCell
            } else if (idx === targetIndex) {
              return null // Will be filtered out
            }
            return cell
          }).filter(Boolean) as NotebookCell[],
          updatedAt: new Date()
        }
        saveToHistory(updated)
        return updated
      })
      toast.success('Cells merged')
    } else {
      toast.error('Cannot merge: target cell not found')
    }
  }

  const handleSplitCell = (cellId: string) => {
    const cell = notebook.cells.find(c => c.id === cellId)
    if (!cell) {
      toast.error('Cell not found')
      return
    }
    
    const content = cell.type === 'sql' 
      ? (cell.sqlQuery || cell.content) 
      : cell.content
    
    if (!content.trim()) {
      toast.error('Cell is empty')
      return
    }
    
    const lines = content.split('\n')
    
    if (lines.length < 2) {
      toast.error('Cell must have at least 2 lines to split')
      return
    }
    
    const midPoint = Math.floor(lines.length / 2)
    const firstHalf = lines.slice(0, midPoint).join('\n')
    const secondHalf = lines.slice(midPoint).join('\n')
    
    const cellIndex = notebook.cells.findIndex(c => c.id === cellId)
    if (cellIndex === -1) return
    
    // Create new cell for second half
    const newCell = createNewCell(cell.type)
    newCell.content = secondHalf
    if (cell.type === 'sql') {
      newCell.sqlQuery = secondHalf
      newCell.sqlVariableName = cell.sqlVariableName || ''
      newCell.sqlConnection = cell.sqlConnection || 'default'
    }
    
    setNotebook(prev => {
      const newCells = [...prev.cells]
      newCells[cellIndex] = {
        ...cell,
        content: firstHalf,
        ...(cell.type === 'sql' ? { sqlQuery: firstHalf } : {}),
        timestamp: new Date()
      }
      newCells.splice(cellIndex + 1, 0, newCell)
      
      const updated = {
        ...prev,
        cells: newCells,
        updatedAt: new Date()
      }
      saveToHistory(updated)
      return updated
    })
    
    setActiveCellId(newCell.id)
    toast.success('Cell split successfully')
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
      
      // Execute SQL query via API endpoint
      const response = await fetch('/api/notebook/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: cell.sqlQuery,
          connection: cell.sqlConnection || 'default',
          spaceId: notebook.id // TODO: Get actual space ID from context
        })
      })

      const result = await response.json()
      const executionTime = Date.now() - startTime

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'SQL execution failed')
      }

      // Format result for cell output
      const formattedResult = {
        data: result.data || [],
        columns: result.columns || [],
        rowCount: result.rowCount || 0,
        columnCount: result.columnCount || 0,
        preview: result.preview || {
          columns: result.columns || [],
          data: (result.data || []).slice(0, 5).map((row: any) => 
            (result.columns || []).map((col: string) => row[col])
          )
        },
        executionTime: result.executionTime || executionTime
      }

      setNotebook(prev => ({
        ...prev,
        cells: prev.cells.map(c => 
          c.id === cellId 
            ? { 
                ...c, 
                output: formattedResult, 
                status: 'success', 
                executionTime: formattedResult.executionTime,
                timestamp: new Date()
              } 
            : c
        )
      }))

      // Add the variable to the variables list
      const newVariable = {
        name: cell.sqlVariableName,
        type: 'DataFrame',
        value: `Shape: (${formattedResult.rowCount}, ${formattedResult.columnCount})`,
        size: `${formattedResult.rowCount} rows × ${formattedResult.columnCount} columns`
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
      
      // Show rate limit info if available
      if (result.rateLimit) {
        toast.success(
          `SQL query executed and saved as '${cell.sqlVariableName}' (${result.rateLimit.remaining} queries remaining)`,
          { duration: 3000 }
        )
      } else {
        toast.success(`SQL query executed and saved as '${cell.sqlVariableName}'`)
      }
    } catch (error: any) {
      // Handle rate limit errors
      if (error.message?.includes('rate limit') || error.message?.includes('Rate limit')) {
        toast.error('Too many queries. Please wait a moment before trying again.')
      } else if (error.message?.includes('timeout')) {
        toast.error('Query timeout: The query took too long to execute.')
      } else {
        toast.error(error.message || 'SQL query execution failed')
      }

      setNotebook(prev => ({
        ...prev,
        cells: prev.cells.map(c => 
          c.id === cellId 
            ? { 
                ...c, 
                output: { 
                  error: error.message || 'SQL execution failed',
                  details: error 
                }, 
                status: 'error',
                timestamp: new Date()
              } 
            : c
        )
      }))
      setKernelStatus('error')
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
