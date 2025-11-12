'use client'

import { useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'

interface KeyboardShortcutsProps {
  activeCellId: string | null
  selectedCellIds: Set<string>
  notebook: {
    cells: Array<{ id: string; type: string }>
  }
  onExecuteCell: (cellId: string) => void
  onExecuteAll: () => void
  onCreateCell: (type: 'code' | 'markdown' | 'raw', position?: 'above' | 'below') => void
  onDeleteCell: (cellId: string) => void
  onMoveCell: (cellId: string, direction: 'up' | 'down') => void
  onClearOutputs: () => void
  onSave: () => void
  onFocusNextCell: () => void
  onFocusPreviousCell: () => void
  onSelectAll: () => void
  onCopyCell: (cellId: string) => void
  onPasteCell: () => void
  onMergeCells: () => void
  onSplitCell: (cellId: string) => void
  onToggleCellType: (cellId: string) => void
  onToggleOutput: () => void
  onToggleSidebar: () => void
  onToggleVariables: () => void
  onFind: () => void
  onReplace: () => void
  onUndo: () => void
  onRedo: () => void
}

export function useNotebookKeyboardShortcuts({
  activeCellId,
  selectedCellIds,
  notebook,
  onExecuteCell,
  onExecuteAll,
  onCreateCell,
  onDeleteCell,
  onMoveCell,
  onClearOutputs,
  onSave,
  onFocusNextCell,
  onFocusPreviousCell,
  onSelectAll,
  onCopyCell,
  onPasteCell,
  onMergeCells,
  onSplitCell,
  onToggleCellType,
  onToggleOutput,
  onToggleSidebar,
  onToggleVariables,
  onFind,
  onReplace,
  onUndo,
  onRedo
}: KeyboardShortcutsProps) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs or textareas
    const target = event.target as HTMLElement
    const isInputOrTextarea = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
    const isCodeMirror = target.closest('.cm-editor') !== null || target.closest('.cm-content') !== null
    
    // Allow Delete/Backspace in CodeMirror only if content is empty, otherwise handle text deletion normally
    if (isInputOrTextarea || isCodeMirror) {
      // Only handle Escape and Delete/Backspace (for empty cells)
      if (event.key === 'Escape') {
        event.preventDefault()
        target.blur()
        return
      }
      // For Delete/Backspace in code editor, only delete cell if editor is empty
      if ((event.key === 'Delete' || event.key === 'Backspace') && activeCellId) {
        // Check if CodeMirror editor is empty
        if (isCodeMirror) {
          const editorElement = target.closest('.cm-editor')
          if (editorElement) {
            // Allow normal deletion in editor, don't delete cell
            return
          }
        }
      }
      // For normal inputs, don't handle delete
      if (isInputOrTextarea && (event.key === 'Delete' || event.key === 'Backspace')) {
        return
      }
    }

    const isCtrlOrCmd = event.ctrlKey || event.metaKey
    const isShift = event.shiftKey
    const isAlt = event.altKey

    // Prevent default for all our shortcuts
    if (isCtrlOrCmd || isAlt) {
      event.preventDefault()
    }

    // Execution shortcuts
    if (event.key === 'Enter') {
      if (isCtrlOrCmd && isShift) {
        // Ctrl+Shift+Enter: Run cell and insert below
        if (activeCellId) {
          onExecuteCell(activeCellId)
          onCreateCell('code', 'below')
        }
        toast.success('Cell executed and new cell created below')
      } else if (isCtrlOrCmd) {
        // Ctrl+Enter: Run cell
        if (activeCellId) {
          onExecuteCell(activeCellId)
        }
      } else if (isShift) {
        // Shift+Enter: Run cell and move to next
        if (activeCellId) {
          onExecuteCell(activeCellId)
          onFocusNextCell()
        }
      }
    }

    // Cell creation shortcuts
    if (event.key === 'a' && isCtrlOrCmd) {
      // Ctrl+A: Insert cell above
      onCreateCell('code', 'above')
      toast.success('Code cell inserted above')
    }
    
    if (event.key === 'b' && isCtrlOrCmd) {
      // Ctrl+B: Insert cell below
      onCreateCell('code', 'below')
      toast.success('Code cell inserted below')
    }

    if (event.key === 'm' && isCtrlOrCmd) {
      // Ctrl+M: Insert markdown cell below
      onCreateCell('markdown', 'below')
      toast.success('Markdown cell inserted below')
    }

    if (event.key === 'r' && isCtrlOrCmd) {
      // Ctrl+R: Insert raw cell below
      onCreateCell('raw', 'below')
      toast.success('Raw cell inserted below')
    }

    // Cell deletion shortcuts - only when NOT editing
    if ((event.key === 'Delete' || event.key === 'Backspace') && !isInputOrTextarea && !isCodeMirror) {
      // Delete/Backspace: Delete active cell (when not in input/textarea/code editor)
      if (activeCellId) {
        // Only delete if we're not actively editing
        const isEditing = document.activeElement?.tagName === 'INPUT' || 
                         document.activeElement?.tagName === 'TEXTAREA' ||
                         document.activeElement?.closest('.cm-editor') !== null ||
                         document.activeElement?.closest('.cm-content') !== null
        
        if (!isEditing) {
          event.preventDefault()
          onDeleteCell(activeCellId)
          toast.success('Cell deleted')
          return
        }
      }
    }

    if (event.key === 'd' && isCtrlOrCmd) {
      if (isShift) {
        // Ctrl+Shift+D: Delete cell
        if (activeCellId) {
          onDeleteCell(activeCellId)
          toast.success('Cell deleted')
        }
      } else {
        // Ctrl+D: Duplicate cell
        if (activeCellId) {
          // Call duplicate handler if available
          const cell = notebook.cells.find((c: any) => c.id === activeCellId)
          if (cell) {
            // Duplicate will be handled via copy + paste
            onCopyCell(activeCellId)
            setTimeout(() => {
              onPasteCell()
            }, 100)
            toast.success('Cell duplicated')
          }
        }
      }
    }

    // Cell movement shortcuts
    if (event.key === 'ArrowUp' && isCtrlOrCmd) {
      // Ctrl+Up: Move cell up
      if (activeCellId) {
        onMoveCell(activeCellId, 'up')
        toast.success('Cell moved up')
      }
    }

    if (event.key === 'ArrowDown' && isCtrlOrCmd) {
      // Ctrl+Down: Move cell down
      if (activeCellId) {
        onMoveCell(activeCellId, 'down')
        toast.success('Cell moved down')
      }
    }

    // Navigation shortcuts
    if (event.key === 'ArrowUp' && !isCtrlOrCmd) {
      // Up: Focus previous cell
      onFocusPreviousCell()
    }

    if (event.key === 'ArrowDown' && !isCtrlOrCmd) {
      // Down: Focus next cell
      onFocusNextCell()
    }

    // Selection shortcuts
    if (event.key === 'a' && isCtrlOrCmd && isShift) {
      // Ctrl+Shift+A: Select all cells
      onSelectAll()
      toast.success('All cells selected')
    }

    // Copy/Paste shortcuts
    if (event.key === 'c' && isCtrlOrCmd) {
      // Ctrl+C: Copy cell
      if (activeCellId) {
        onCopyCell(activeCellId)
        toast.success('Cell copied')
      }
    }

    if (event.key === 'v' && isCtrlOrCmd) {
      // Ctrl+V: Paste cell
      onPasteCell()
      toast.success('Cell pasted')
    }

    // Cell operations
    if (event.key === 'j' && isCtrlOrCmd) {
      // Ctrl+J: Merge cells
      onMergeCells()
      toast.success('Cells merged')
    }

    if (event.key === 's' && isCtrlOrCmd) {
      // Ctrl+S: Split cell
      if (activeCellId) {
        onSplitCell(activeCellId)
        toast.success('Cell split')
      }
    }

    // Cell type toggle
    if (event.key === 'y' && isCtrlOrCmd) {
      // Ctrl+Y: Toggle cell type
      if (activeCellId) {
        onToggleCellType(activeCellId)
        toast.success('Cell type toggled')
      }
    }

    // Execution shortcuts
    if (event.key === 'r' && isCtrlOrCmd && isShift) {
      // Ctrl+Shift+R: Run all cells
      onExecuteAll()
      toast.success('Running all cells')
    }

    if (event.key === 'l' && isCtrlOrCmd) {
      // Ctrl+L: Clear outputs
      onClearOutputs()
      toast.success('Outputs cleared')
    }

    // File operations
    if (event.key === 's' && isCtrlOrCmd && isShift) {
      // Ctrl+Shift+S: Save notebook
      onSave()
      toast.success('Notebook saved')
    }

    // View shortcuts
    if (event.key === 'o' && isCtrlOrCmd) {
      // Ctrl+O: Toggle output
      onToggleOutput()
    }

    if (event.key === 'b' && isCtrlOrCmd && isShift) {
      // Ctrl+Shift+B: Toggle sidebar
      onToggleSidebar()
    }

    if (event.key === 'v' && isCtrlOrCmd && isShift) {
      // Ctrl+Shift+V: Toggle variables
      onToggleVariables()
    }

    // Search shortcuts
    if (event.key === 'f' && isCtrlOrCmd) {
      // Ctrl+F: Find
      onFind()
    }

    if (event.key === 'h' && isCtrlOrCmd) {
      // Ctrl+H: Replace
      onReplace()
    }

    // Undo/Redo shortcuts
    if (event.key === 'z' && isCtrlOrCmd) {
      if (isShift) {
        // Ctrl+Shift+Z: Redo
        onRedo()
        toast.success('Redo')
      } else {
        // Ctrl+Z: Undo
        onUndo()
        toast.success('Undo')
      }
    }

    if (event.key === 'y' && isCtrlOrCmd && isShift) {
      // Ctrl+Shift+Y: Redo (alternative)
      onRedo()
      toast.success('Redo')
    }

    // Help shortcut
    if (event.key === 'h' && isCtrlOrCmd && isShift) {
      // Ctrl+Shift+H: Show help
      toast('Keyboard shortcuts active! Press Ctrl+? for help')
    }

    if (event.key === '?' && isCtrlOrCmd) {
      // Ctrl+?: Show help
      toast(`
Keyboard Shortcuts:
• Ctrl+Enter: Run cell
• Shift+Enter: Run cell and move to next
• Ctrl+Shift+Enter: Run cell and insert below
• Ctrl+A: Insert cell above
• Ctrl+B: Insert cell below
• Ctrl+M: Insert markdown cell
• Ctrl+D: Duplicate cell
• Del/Backspace: Delete cell
• Ctrl+Shift+D: Delete cell
• Ctrl+Up/Down: Move cell
• Ctrl+C/V: Copy/Paste cell
• Ctrl+Z/Y: Undo/Redo
• Ctrl+S: Save notebook
• Ctrl+F: Find
• Ctrl+H: Replace
      `, { duration: 10000 })
    }
  }, [
    activeCellId,
    selectedCellIds,
    notebook,
    onExecuteCell,
    onExecuteAll,
    onCreateCell,
    onDeleteCell,
    onMoveCell,
    onClearOutputs,
    onSave,
    onFocusNextCell,
    onFocusPreviousCell,
    onSelectAll,
    onCopyCell,
    onPasteCell,
    onMergeCells,
    onSplitCell,
    onToggleCellType,
    onToggleOutput,
    onToggleSidebar,
    onToggleVariables,
    onFind,
    onReplace,
    onUndo,
    onRedo
  ])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}
