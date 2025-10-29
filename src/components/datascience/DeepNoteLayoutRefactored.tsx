'use client'

import { useNotebookState, useKernelInitialization, useNotebookRefs, useAutoSave, useKeyboardNavigation } from './hooks'
import { useNotebookKeyboardShortcuts } from '@/hooks/useNotebookKeyboardShortcuts'
import { createNotebookHandlers } from './handlers'
import { NotebookTemplates } from './NotebookTemplates'
import { NotebookToolbar } from './NotebookToolbar'
import { NotebookSidebar } from './NotebookSidebar'
import { CellRenderer } from './CellRenderer'
import { DeepNoteLayoutProps } from './types'
import { cn } from '@/lib/utils'
import { 
  FileCode,
  Code,
  FileText,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DeepNoteLayoutRefactored({ 
  initialNotebook, 
  onSave, 
  onLoad,
  dataSource,
  enableCollaboration = true,
  enableFileManager = true,
  enableExport = true,
  enableVersionControl = true
}: DeepNoteLayoutProps) {
  // State management
  const [state, actions] = useNotebookState(initialNotebook)
  const { kernels, currentKernel, setCurrentKernel } = useKernelInitialization()
  const { notebookRef, cellRefs, scrollToCell, focusCell } = useNotebookRefs()
  
  // Auto-save functionality
  useAutoSave(state.notebook, onSave)
  
  // Keyboard navigation
  const { focusNextCell, focusPreviousCell } = useKeyboardNavigation(
    state.notebook, 
    state.activeCellId, 
    actions.setActiveCellId
  )

  // Update kernels in state
  actions.setKernels(kernels)
  actions.setCurrentKernel(currentKernel)

  // Create handlers
  const handlers = createNotebookHandlers(state, actions, dataSource, onSave)

  // Initialize keyboard shortcuts
  useNotebookKeyboardShortcuts({
    activeCellId: state.activeCellId,
    selectedCellIds: state.selectedCellIds,
    notebook: state.notebook,
    onExecuteCell: handlers.executeCell,
    onExecuteAll: handlers.executeAllCells,
    onCreateCell: handlers.createNewCell,
    onDeleteCell: handlers.deleteCell,
    onMoveCell: handlers.moveCell,
    onClearOutputs: handlers.clearAllOutputs,
    onSave: handlers.handleSave,
    onFocusNextCell: focusNextCell,
    onFocusPreviousCell: focusPreviousCell,
    onSelectAll: handlers.selectAllCells,
    onCopyCell: handlers.copyCell,
    onPasteCell: handlers.pasteCell,
    onMergeCells: handlers.mergeCells,
    onSplitCell: handlers.splitCell,
    onToggleCellType: handlers.toggleCellType,
    onToggleOutput: handlers.toggleOutput,
    onToggleSidebar: () => actions.setShowSidebar(!state.showSidebar),
    onToggleVariables: () => actions.setShowVariables(!state.showVariables),
    onFind: handlers.find,
    onReplace: handlers.replace,
    onUndo: handlers.undo,
    onRedo: handlers.redo
  })

  return (
    <div className={cn(
      "h-screen bg-white flex flex-col transition-all duration-300",
      state.currentTheme === 'dark' ? "dark bg-gray-900" : "",
      state.isFullscreen ? "fixed inset-0 z-50" : ""
    )}>
      {/* Toolbar */}
      <NotebookToolbar
        notebook={state.notebook}
        isExecuting={state.isExecuting}
        kernelStatus={state.kernelStatus}
        executionCount={state.executionCount}
        showSidebar={state.showSidebar}
        showVariables={state.showVariables}
        onExecuteAll={handlers.executeAllCells}
        onStopExecution={handlers.handleInterrupt}
        onClearOutputs={handlers.clearAllOutputs}
        onSave={handlers.handleSave}
        onExport={handlers.handleExport}
        onImport={handlers.handleImport}
        onToggleSidebar={() => actions.setShowSidebar(!state.showSidebar)}
        onToggleVariables={() => actions.setShowVariables(!state.showVariables)}
        onToggleSettings={() => actions.setShowSettings(true)}
        onAddCell={handlers.createNewCell}
        onShowTemplates={handlers.handleShowTemplates}
        onRunSelected={handlers.handleRunSelected}
        onInterrupt={handlers.handleInterrupt}
        onRestart={handlers.handleRestart}
        onShutdown={handlers.handleShutdown}
      />

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar */}
        {state.showSidebar && (
          <NotebookSidebar
            notebook={state.notebook}
            variables={state.variables}
            files={state.files}
            onAddCell={handlers.createNewCell}
            onOpenFile={handlers.handleOpenFile}
            onNewFile={handlers.handleNewFile}
            onNewFolder={handlers.handleNewFolder}
            onUploadFile={handlers.handleUploadFile}
            onDeleteFile={handlers.handleDeleteFile}
            onRenameFile={handlers.handleRenameFile}
            onMoveFile={handlers.handleMoveFile}
          />
        )}

        {/* Notebook Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto" ref={notebookRef}>
            {state.notebook.cells.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Start Your Notebook</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Add your first cell to begin</p>
                  <div className="space-x-2">
                    <Button onClick={() => handlers.createNewCell('code')}>
                      <Code className="h-4 w-4 mr-2" />
                      Add Code Cell
                    </Button>
                    <Button variant="outline" onClick={() => handlers.createNewCell('markdown')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Add Markdown
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {state.notebook.cells.map((cell, index) => (
                  <CellRenderer
                    key={cell.id}
                    cell={cell}
                    index={index}
                    isActive={state.activeCellId === cell.id}
                    isSelected={state.selectedCellIds.has(cell.id)}
                    onExecute={handlers.executeCell}
                    onDelete={handlers.deleteCell}
                    onMove={handlers.moveCell}
                    onContentChange={handlers.updateCellContent}
                    onTypeChange={handlers.toggleCellType}
                    onFocus={actions.setActiveCellId}
                    onSelect={(cellId, selected) => {
                      const newSelected = new Set(state.selectedCellIds)
                      if (selected) {
                        newSelected.add(cellId)
                      } else {
                        newSelected.delete(cellId)
                      }
                      actions.setSelectedCellIds(newSelected)
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
            <span>Cells: {state.notebook.cells.length}</span>
            <span>Executed: {state.notebook.cells.filter(c => c.status === 'success').length}</span>
            <span>Errors: {state.notebook.cells.filter(c => c.status === 'error').length}</span>
            <span>Kernel: Python 3.9</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Last saved: {state.notebook.updatedAt.toLocaleTimeString()}</span>
            {state.isExecuting && (
              <div className="flex items-center gap-2 text-blue-600">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Executing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      {state.showTemplates && (
        <NotebookTemplates
          onSelectTemplate={handlers.handleSelectTemplate}
          onClose={() => actions.setShowTemplates(false)}
        />
      )}
    </div>
  )
}
