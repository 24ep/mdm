'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

// Import all the granular components
import {
  Header,
  TabBar,
  Toolbar,
  QueryEditor,
  DataExplorer,
  ResultsPanel,
  QueryTemplates,
  QueryBookmarks,
  KeyboardShortcuts,
  TableContextMenu,
  useQueryValidation
} from './'
import { useKeyboardShortcuts, useQueryExecutor } from '@/hooks'

interface QueryResult {
  id: string
  query: string
  results: any[]
  columns: string[]
  status: 'success' | 'error' | 'running'
  executionTime?: number
  timestamp: Date
  spaceName?: string
  userId?: string
  userName?: string
  size?: number
}

interface Space {
  id: string
  name: string
  slug: string
}

interface QueryTab {
  id: string
  name: string
  query: string
  isSaved: boolean
}

interface SavedQuery {
  id: string
  name: string
  query: string
  folderId?: string
  isStarred: boolean
  createdAt: Date
  updatedAt: Date
}

interface QueryFolder {
  id: string
  name: string
  parentId?: string
  subfolders: QueryFolder[]
}

export function BigQueryInterfaceGranular() {
  const [query, setQuery] = useState('')
  const [selectedSpace, setSelectedSpace] = useState('all')
  const [spaces, setSpaces] = useState<Space[]>([])
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([])
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [queryFolders, setQueryFolders] = useState<QueryFolder[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [queryName, setQueryName] = useState('')
  
  // Tab management
  const [tabs, setTabs] = useState<QueryTab[]>([
    { id: '1', name: 'New Query', query: '', isSaved: false }
  ])
  const [activeTabId, setActiveTabId] = useState('1')
  
  // Context menu
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    tableName: string
    projectName: string
  }>({
    visible: false,
    x: 0,
    y: 0,
    tableName: '',
    projectName: ''
  })
  
  // Footer tabs
  const [footerTab, setFooterTab] = useState<'results' | 'history' | 'visualization' | 'validation' | 'statistics'>('results')
  const [showFooter, setShowFooter] = useState(true)
  const [footerHeight, setFooterHeight] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const [initialMouseY, setInitialMouseY] = useState(0)
  const [initialHeight, setInitialHeight] = useState(320)
  
  // Component states
  const [showTemplates, setShowTemplates] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [bookmarkedQueries, setBookmarkedQueries] = useState<Set<string>>(new Set())
  
  // Query validation
  const { validateQuery } = useQueryValidation()
  const [queryValidation, setQueryValidation] = useState<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }>({ isValid: true, errors: [], warnings: [] })

  // Query execution
  const { isExecuting, currentResult, executeQuery, setCurrentResult } = useQueryExecutor()

  // Load spaces and query history
  useEffect(() => {
    loadSpaces()
    loadQueryHistory()
  }, [])

  // Validate query on change
  useEffect(() => {
    const validation = validateQuery(query)
    setQueryValidation(validation)
  }, [query, validateQuery])

  // Mock data loading functions
  const loadSpaces = async () => {
    setSpaces([
      { id: 'space-1', name: 'Production', slug: 'production' },
      { id: 'space-2', name: 'Analytics', slug: 'analytics' },
      { id: 'space-3', name: 'Development', slug: 'development' }
    ])
  }

  const loadQueryHistory = async () => {
    setQueryHistory([
      {
        id: '1',
        query: 'SELECT * FROM users LIMIT 10',
        results: [],
        columns: ['id', 'name', 'email'],
        status: 'success',
        executionTime: 150,
        timestamp: new Date(),
        spaceName: 'Production',
        userName: 'John Doe',
        size: 1024
      }
    ])
  }

  // Query execution
  const handleExecuteQuery = async () => {
    await executeQuery(query, selectedSpace, spaces, (result) => {
      setQueryHistory(prev => [result, ...prev])
      setShowFooter(true)
      setFooterTab('results')
    })
  }

  // Tab management functions
  const createNewTab = () => {
    const newTab: QueryTab = {
      id: Date.now().toString(),
      name: 'New Query',
      query: '',
      isSaved: false
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
    setQuery('')
  }

  const closeTab = (tabId: string) => {
    if (tabs.length <= 1) return
    
    setTabs(prev => prev.filter(tab => tab.id !== tabId))
    
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId)
      const newActiveTab = remainingTabs[remainingTabs.length - 1]
      setActiveTabId(newActiveTab.id)
      setQuery(newActiveTab.query)
    }
  }

  const updateCurrentTabQuery = (newQuery: string) => {
    setQuery(newQuery)
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, query: newQuery } : tab
    ))
  }

  const saveCurrentTab = () => {
    if (!query.trim()) {
      toast.error('Please enter a query to save')
      return
    }
    setShowSaveDialog(true)
  }

  // Context menu functions
  const handleTableRightClick = (e: React.MouseEvent, tableName: string, projectName: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      tableName,
      projectName
    })
  }

  const handleContextMenuAction = (action: string, tableName: string, projectName: string) => {
    switch (action) {
      case 'select':
        updateCurrentTabQuery(`SELECT * FROM \`${projectName}.${tableName}\` LIMIT 100;`)
        break
      case 'preview':
        updateCurrentTabQuery(`SELECT * FROM \`${projectName}.${tableName}\` LIMIT 10;`)
        break
      case 'count':
        updateCurrentTabQuery(`SELECT COUNT(*) as total_rows FROM \`${projectName}.${tableName}\`;`)
        break
      case 'describe':
        updateCurrentTabQuery(`DESCRIBE \`${projectName}.${tableName}\`;`)
        break
      case 'schema':
        updateCurrentTabQuery(`SELECT column_name, data_type, is_nullable FROM \`${projectName}.INFORMATION_SCHEMA.COLUMNS\` WHERE table_name = '${tableName}';`)
        break
      case 'copy_name':
        navigator.clipboard.writeText(tableName)
        toast.success('Table name copied to clipboard')
        break
      case 'copy_path':
        navigator.clipboard.writeText(`${projectName}.${tableName}`)
        toast.success('Table path copied to clipboard')
        break
      case 'drop':
        if (confirm(`Are you sure you want to drop table ${projectName}.${tableName}?`)) {
          updateCurrentTabQuery(`DROP TABLE \`${projectName}.${tableName}\`;`)
        }
        break
    }
  }

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onRunQuery: () => handleExecuteQuery(),
    onSaveQuery: saveCurrentTab,
    onCreateNewTab: createNewTab,
    onCloseTab: () => closeTab(activeTabId),
    onShowTemplates: () => setShowTemplates(true),
    onShowBookmarks: () => setShowBookmarks(true),
    onShowHistory: () => { setFooterTab('history'); setShowFooter(true) },
    onShowResults: () => { setFooterTab('results'); setShowFooter(true) },
    onShowVisualization: () => { setFooterTab('visualization'); setShowFooter(true) },
    onShowShortcuts: () => setShowShortcuts(true),
    onCloseDialogs: () => {
      setShowTemplates(false)
      setShowBookmarks(false)
      setShowShortcuts(false)
      closeContextMenu()
    },
    onRenameTab: () => {},
    onShowValidation: () => {},
    tabs,
    activeTabId
  })

  // Bookmark functions
  const toggleBookmark = (queryId: string) => {
    setBookmarkedQueries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(queryId)) {
        newSet.delete(queryId)
      } else {
        newSet.add(queryId)
      }
      return newSet
    })
  }

  const isBookmarked = (queryId: string) => bookmarkedQueries.has(queryId)

  const getBookmarkedQueries = () => {
    return queryHistory.filter(query => bookmarkedQueries.has(query.id))
  }

  // Footer resize functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setInitialMouseY(e.clientY)
    setInitialHeight(footerHeight)
    setIsResizing(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    
    const deltaY = e.clientY - initialMouseY
    const newHeight = initialHeight - deltaY
    
    const minHeight = 150
    const maxHeight = window.innerHeight * 0.8
    
    const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))
    setFooterHeight(constrainedHeight)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { 
        passive: true, 
        capture: true 
      })
      document.addEventListener('mouseup', handleMouseUp, { 
        passive: true, 
        capture: true 
      })
      
      document.body.style.cursor = 'ns-resize'
      document.body.style.userSelect = 'none'
      document.body.style.pointerEvents = 'none'
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('mousemove', handleMouseMove, { capture: true })
      document.removeEventListener('mouseup', handleMouseUp, { capture: true })
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.pointerEvents = ''
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, { capture: true })
      document.removeEventListener('mouseup', handleMouseUp, { capture: true })
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.pointerEvents = ''
      document.body.style.overflow = ''
    }
  }, [isResizing, initialMouseY, initialHeight, footerHeight])

  // Utility functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <div className="h-4 w-4 text-green-500">✓</div>
      case 'error':
        return <div className="h-4 w-4 text-red-500">✗</div>
      case 'running':
        return <div className="h-4 w-4 text-blue-500 animate-spin">⟳</div>
      default:
        return <div className="h-4 w-4 text-gray-500">?</div>
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <Header selectedSpace={selectedSpace} spaces={spaces} onSpaceChange={setSelectedSpace} />

      {/* Tab Bar */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={(tabId) => {
          setActiveTabId(tabId)
          const tab = tabs.find(t => t.id === tabId)
          if (tab) setQuery(tab.query)
        }}
        onCloseTab={closeTab}
        onCreateNewTab={createNewTab}
      />

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Data Explorer */}
        <DataExplorer
          spaces={spaces as any}
          selectedSpace={selectedSpace}
          onTableLeftClick={() => {}}
          onTableRightClick={handleTableRightClick}
        />

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Toolbar */}
          <Toolbar
            query={query}
            isExecuting={isExecuting}
            currentResult={currentResult}
            queryValidation={queryValidation}
            bookmarkedQueries={bookmarkedQueries}
            showFooter={showFooter}
            onExecuteQuery={handleExecuteQuery}
            onSaveQuery={saveCurrentTab}
            onShowTemplates={() => setShowTemplates(true)}
            onShowBookmarks={() => setShowBookmarks(true)}
            onShowShortcuts={() => setShowShortcuts(true)}
            onToggleFooter={() => setShowFooter(!showFooter)}
          />

          {/* SQL Code Editor */}
          <QueryEditor
            query={query}
            onChange={updateCurrentTabQuery}
          />
        </div>
      </div>

      {/* Results Panel */}
      <ResultsPanel
        showFooter={showFooter}
        footerHeight={footerHeight}
        isResizing={isResizing}
        footerTab={footerTab}
        onFooterTabChange={(tab) => setFooterTab(tab as any)}
        currentResult={currentResult}
        queryHistory={queryHistory}
        onLoadQuery={updateCurrentTabQuery}
        onToggleBookmark={toggleBookmark}
        isBookmarked={isBookmarked}
        getStatusIcon={getStatusIcon}
        formatDuration={formatDuration}
        formatBytes={formatBytes}
        onMouseDown={handleMouseDown}
        setFooterHeight={setFooterHeight}
      />

      {/* Component Dialogs */}
      <QueryTemplates
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onInsertTemplate={updateCurrentTabQuery}
      />

      <QueryBookmarks
        isOpen={showBookmarks}
        onClose={() => setShowBookmarks(false)}
        bookmarkedQueries={getBookmarkedQueries()}
        onRemoveBookmark={toggleBookmark}
        onRunQuery={updateCurrentTabQuery}
        getStatusIcon={getStatusIcon}
        formatDuration={formatDuration}
        formatBytes={formatBytes}
      />

      <KeyboardShortcuts
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      <TableContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        tableName={contextMenu.tableName}
        projectName={contextMenu.projectName}
        onAction={handleContextMenuAction}
        onClose={closeContextMenu}
      />
    </div>
  )
}
