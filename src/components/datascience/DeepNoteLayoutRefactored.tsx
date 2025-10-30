'use client'

import { useEffect, useMemo, useState } from 'react'
import { useNotebookState, useKernelInitialization, useNotebookRefs, useAutoSave, useKeyboardNavigation } from './hooks'
import { useNotebookKeyboardShortcuts } from '@/hooks/useNotebookKeyboardShortcuts'
import { createNotebookHandlers } from './handlers'
import { NotebookTemplates } from './NotebookTemplates'
import { NotebookToolbar } from './NotebookToolbar'
import { NotebookSidebar } from './NotebookSidebar'
import { CellRenderer } from './CellRenderer'
import { SortableCell } from './SortableCell'
import { DeepNoteLayoutProps } from './types'
import { cn } from '@/lib/utils'
import { 
  FileCode,
  Code,
  FileText,
  RefreshCw,
  Settings,
  Database,
  Upload,
  Download,
  PanelLeft
} from 'lucide-react'
import { CSVEditor } from './CSVEditor'
import { MarkdownFileEditor } from './MarkdownFileEditor'
import { Button } from '@/components/ui/button'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
// removed unused imports

export function DeepNoteLayoutRefactored({ 
  initialNotebook, 
  onSave, 
  onLoad,
  dataSource,
  enableCollaboration = true,
  enableFileManager = true,
  enableExport = true,
  enableVersionControl = true,
  // permissions gating: defaults to full access
  canEdit = true,
  canExecute = true,
  onControlsReady
}: DeepNoteLayoutProps) {
  // State management
  const [state, actions] = useNotebookState(initialNotebook)
  const [openedFile, setOpenedFile] = useState<{ name: string; type: 'ipynb' | 'csv' | 'md' | 'other' } | null>(null)
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

  // Update kernels in state using useEffect to avoid infinite re-renders
  useEffect(() => {
    if (kernels.length > 0) {
      actions.setKernels(kernels)
    }
  }, [kernels, actions.setKernels])
  
  useEffect(() => {
    if (currentKernel) {
      actions.setCurrentKernel(currentKernel)
    }
  }, [currentKernel, actions.setCurrentKernel])

  // Create handlers with memoization to prevent re-renders
  const handlers = useMemo(() => 
    createNotebookHandlers(state, actions, dataSource, onSave),
    [state, actions, dataSource, onSave]
  )

  useEffect(() => {
    if (onControlsReady) {
      onControlsReady({
        toggleSidebar: () => actions.setShowSidebar(!state.showSidebar),
        save: canEdit ? handlers.handleSave : () => {},
        openSettings: () => actions.setShowSettings(true),
        renameProject: (name: string) => actions.setNotebook((prev: any) => ({ ...prev, name, updatedAt: new Date() }))
      })
    }
  }, [onControlsReady, actions, state.showSidebar, handlers.handleSave, canEdit])

  const handleOpenFromSidebar = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase()
    const type = ext === 'ipynb' ? 'ipynb' : ext === 'csv' ? 'csv' : ext === 'md' ? 'md' : 'other'
    setOpenedFile({ name: filePath, type })
    handlers.handleOpenFile(filePath)
  }

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null)

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = state.notebook.cells.findIndex(cell => cell.id === active.id)
      const newIndex = state.notebook.cells.findIndex(cell => cell.id === over?.id)

      const newCells = arrayMove(state.notebook.cells, oldIndex, newIndex)
      
      actions.setNotebook(prev => ({
        ...prev,
        cells: newCells,
        updatedAt: new Date()
      }))
    }
    
    setActiveId(null)
  }

  // Initialize keyboard shortcuts
  void useNotebookKeyboardShortcuts({
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
  });

  return (
    <div className={cn(
      "h-screen bg-white flex flex-col transition-all duration-300",
      state.currentTheme === 'dark' ? "dark bg-gray-900" : "",
      state.isFullscreen ? "fixed inset-0 z-50" : ""
    )}>
      {/* Header removed as requested */}

      {/* Toolbar Card */}
      

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar */}
        {state.showSidebar && (
          <div className="w-64 h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm m-0 flex flex-col min-h-0">
            <NotebookSidebar
              notebook={state.notebook}
              variables={state.variables}
              files={state.files}
              onAddCell={handlers.createNewCell}
              onOpenFile={handleOpenFromSidebar}
              onNewFile={handlers.handleNewFile}
              onCreateFile={handlers.handleCreateFile}
              onCreateFolder={handlers.handleCreateFolder}
              onNewFolder={handlers.handleNewFolder}
              onUploadFile={handlers.handleUploadFile}
              onDeleteFile={handlers.handleDeleteFile}
              onRenameFile={handlers.handleRenameFile}
              onMoveFile={handlers.handleMoveFile}
              onExportFile={() => handlers.handleExport()}
              onShowVersions={() => actions.setShowHistory(true)}
            />
          </div>
        )}

              {/* Main Area Card - switches between Notebook and File viewers */}
              <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900 relative border border-gray-200 dark:border-gray-700 shadow-sm m-0">
                {/* Folder toolbar removed from notebook; shown on projects page instead */}
                {/* Notebook toolbar row (only when a notebook is selected) */}
                {(!openedFile || openedFile.type === 'ipynb') && (
                  <div className="px-2 py-1 border-b border-gray-200 dark:border-gray-700">
                    <NotebookToolbar
                      toolbarPosition="top"
                      onToggleToolbarPosition={() => {}}
                      notebook={state.notebook}
                      isExecuting={state.isExecuting}
                      kernelStatus={state.kernelStatus}
                      executionCount={state.executionCount}
                      showSidebar={state.showSidebar}
                      showVariables={state.showVariables}
                      showFileOps={false}
                      showViewControls={false}
                      onExecuteAll={canExecute ? handlers.executeAllCells : (() => {})}
                      onStopExecution={canExecute ? handlers.handleInterrupt : (() => {})}
                      onClearOutputs={canEdit ? handlers.clearAllOutputs : (() => {})}
                      onSave={canEdit ? handlers.handleSave : (() => {})}
                      onExport={enableExport ? handlers.handleExport : (() => {})}
                      onImport={handlers.handleImport}
                      onToggleSidebar={() => actions.setShowSidebar(!state.showSidebar)}
                      onToggleVariables={() => actions.setShowVariables(!state.showVariables)}
                      onToggleSettings={() => actions.setShowSettings(true)}
                      onAddCell={canEdit ? handlers.createNewCell : (() => {})}
                      onShowTemplates={handlers.handleShowTemplates}
                      onRunSelected={canExecute ? handlers.handleRunSelected : (() => {})}
                      onInterrupt={canExecute ? handlers.handleInterrupt : (() => {})}
                      onRestart={canExecute ? handlers.handleRestart : (() => {})}
                      onShutdown={canExecute ? handlers.handleShutdown : (() => {})}
                    />
                  </div>
                )}
                <div 
                  className="flex-1 overflow-y-auto relative pb-16" 
                  ref={notebookRef}
                  onClick={(e) => {
                    // If clicking on empty space, show add cell options
                    if (e.target === e.currentTarget) {
                      // This will be handled by the floating add cell button
                    }
                  }}
                >
            {openedFile && openedFile.type !== 'ipynb' ? (
              // File viewers
              <div className="max-w-5xl mx-auto py-4 px-2">
                {openedFile.type === 'csv' && (
                  <CSVEditor key={openedFile.name} fileName={openedFile.name} />
                )}
                {openedFile.type === 'md' && (
                  <MarkdownFileEditor key={openedFile.name} fileName={openedFile.name} />
                )}
                {openedFile.type === 'other' && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Unsupported file type.</div>
                )}
              </div>
            ) : state.notebook.cells.length === 0 ? (
              <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileCode className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Welcome to your notebook</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Start by adding a code cell or markdown cell to begin your analysis</p>
                  <div className="space-x-3">
                    <Button onClick={() => handlers.createNewCell('code')} className="bg-blue-600 hover:bg-blue-700">
                      <Code className="h-4 w-4 mr-2" />
                      Add Code Cell
                    </Button>
                    <Button variant="outline" onClick={() => handlers.createNewCell('markdown')} className="border-gray-300 dark:border-gray-600">
                      <FileText className="h-4 w-4 mr-2" />
                      Add Markdown
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto py-8">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={state.notebook.cells.map(cell => cell.id)}
                    strategy={verticalListSortingStrategy}
                  >
                  <div className="space-y-0">
                      {state.notebook.cells.map((cell, index) => (
                        <div key={cell.id} className="group">
                          <SortableCell
                            cell={cell}
                            index={index}
                            isActive={state.activeCellId === cell.id}
                            isSelected={state.selectedCellIds.has(cell.id)}
                            onExecute={cell.type === 'sql' ? handlers.handleSQLExecute : handlers.executeCell}
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
                            onVariableNameChange={handlers.handleVariableNameChange}
                            onConnectionChange={handlers.handleConnectionChange}
                            onCopy={handlers.handleCopyCell}
                            onCut={handlers.handleCutCell}
                            onPaste={handlers.handlePasteCell}
                            onMerge={handlers.handleMergeCells}
                            onSplit={handlers.handleSplitCell}
                            onAddComment={handlers.handleAddComment}
                            onAddTag={handlers.handleAddTag}
                            onSearch={handlers.handleSearchCell}
                            onTitleChange={handlers.handleRenameCellTitle}
                          />
                          
                          {/* Add Cell Button Between Cells */}
                          <div className="flex items-center justify-center py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center space-x-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 shadow-sm">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlers.createNewCell('code', 'below', cell.id)}
                                className="h-7 px-2 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                <Code className="h-3 w-3 mr-1" />
                                Code
                              </Button>
                              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlers.createNewCell('markdown', 'below', cell.id)}
                                className="h-7 px-2 text-xs text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Markdown
                              </Button>
                              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlers.createNewCell('raw', 'below', cell.id)}
                                className="h-7 px-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-400"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Raw
                              </Button>
                              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlers.createNewCell('sql', 'below', cell.id)}
                                className="h-7 px-2 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                <Database className="h-3 w-3 mr-1" />
                                SQL
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                  
                  {/* Drag overlay removed for stability */}
                </DndContext>
                  
                  {/* Add Cell Button at the End */}
                  <div className="flex items-center justify-center py-6">
                    <div className="flex items-center space-x-3 bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                      <Button
                        size="sm"
                        onClick={() => handlers.createNewCell('code')}
                        className="h-9 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Code className="h-4 w-4 mr-2" />
                        Add Code Cell
                      </Button>
                      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600"></div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlers.createNewCell('markdown')}
                        className="h-9 px-4 text-sm border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Add Markdown
                      </Button>
                      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600"></div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlers.createNewCell('raw')}
                        className="h-9 px-4 text-sm border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Add Raw Cell
                      </Button>
                      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600"></div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlers.createNewCell('sql')}
                        className="h-9 px-4 text-sm border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Add SQL Cell
                      </Button>
                    </div>
                  </div>
                </div>
            )
          }
            </div>
          </div>
        </div>

      {/* Footer Status Bar (not fixed to avoid overlaying admin sidebar) */}
      <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                state.kernelStatus === 'idle' ? "bg-green-500" : 
                state.kernelStatus === 'busy' ? "bg-yellow-500" : "bg-red-500"
              )}></div>
              <span>Kernel: {state.currentKernel?.name || 'No kernel'}</span>
            </div>
            <span>Cells: {state.notebook.cells.length}</span>
            <span>Executed: {state.executionCount}</span>
            <span>Errors: {state.notebook.cells.filter(c => c.status === 'error').length}</span>
          </div>
          <div className="flex items-center space-x-6">
            <span>Last saved: {state.notebook.updatedAt.toLocaleTimeString()}</span>
            <span>Theme: {state.currentTheme}</span>
            <span>Auto-save: {state.notebook.settings.autoSave ? 'On' : 'Off'}</span>
            {state.isExecuting && (
              <div className="flex items-center space-x-2 text-blue-600">
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
