import { useEffect } from 'react'

interface KeyboardShortcutsProps {
  onRunQuery: () => void
  onSaveQuery: () => void
  onCreateNewTab: () => void
  onCloseTab: () => void
  onRenameTab: () => void
  onShowTemplates: () => void
  onShowBookmarks: () => void
  onShowHistory: () => void
  onShowResults: () => void
  onShowVisualization: () => void
  onShowValidation: () => void
  onShowShortcuts: () => void
  onCloseDialogs: () => void
  tabs: any[]
  activeTabId: string
}

export function useKeyboardShortcuts({
  onRunQuery,
  onSaveQuery,
  onCreateNewTab,
  onCloseTab,
  onRenameTab,
  onShowTemplates,
  onShowBookmarks,
  onShowHistory,
  onShowResults,
  onShowVisualization,
  onShowValidation,
  onShowShortcuts,
  onCloseDialogs,
  tabs,
  activeTabId
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter: Run query
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        onRunQuery()
      }
      
      // Ctrl/Cmd + S: Save query
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        onSaveQuery()
      }
      
      // Ctrl/Cmd + N: New tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        onCreateNewTab()
      }
      
      // Ctrl/Cmd + W: Close tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault()
        if (tabs.length > 1) {
          onCloseTab()
        }
      }
      
      // F2: Rename tab
      if (e.key === 'F2') {
        e.preventDefault()
        onRenameTab()
      }
      
      // Ctrl/Cmd + T: Show templates
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault()
        onShowTemplates()
      }
      
      // Ctrl/Cmd + B: Show bookmarks
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        onShowBookmarks()
      }
      
      // Ctrl/Cmd + H: Show history
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault()
        onShowHistory()
      }
      
      // Ctrl/Cmd + R: Show results
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault()
        onShowResults()
      }
      
      // Ctrl/Cmd + V: Show visualization
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        onShowVisualization()
      }
      
      // Ctrl/Cmd + Shift + V: Show validation
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault()
        onShowValidation()
      }
      
      // F1: Show shortcuts help
      if (e.key === 'F1') {
        e.preventDefault()
        onShowShortcuts()
      }
      
      // Escape: Close dialogs
      if (e.key === 'Escape') {
        onCloseDialogs()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    onRunQuery,
    onSaveQuery,
    onCreateNewTab,
    onCloseTab,
    onRenameTab,
    onShowTemplates,
    onShowBookmarks,
    onShowHistory,
    onShowResults,
    onShowVisualization,
    onShowValidation,
    onShowShortcuts,
    onCloseDialogs,
    tabs,
    activeTabId
  ])
}
