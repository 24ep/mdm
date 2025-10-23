'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Database, 
  Play, 
  Save, 
  History, 
  Download, 
  Upload,
  ChevronDown,
  ChevronRight,
  Table,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Bookmark,
  Trash2,
  Copy,
  Share,
  Zap,
  BarChart3,
  Filter,
  Search,
  Plus,
  Edit,
  Eye,
  EyeOff,
  X,
  Folder,
  FolderOpen,
  File,
  Calendar,
  User,
  Timer,
  HardDrive,
  TrendingUp,
  PieChart,
  LineChart,
  BarChart
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import toast from 'react-hot-toast'

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
  savedQueryId?: string
}

interface SavedQuery {
  id: string
  name: string
  query: string
  space_id?: string
  spaceName?: string
  isStarred?: boolean
  folder?: string
  createdAt: Date
}

interface QueryFolder {
  id: string
  name: string
  queries: SavedQuery[]
  subfolders: QueryFolder[]
}

export function BigQueryInterface() {
  const [query, setQuery] = useState('')
  const [selectedSpace, setSelectedSpace] = useState('all')
  const [spaces, setSpaces] = useState<Space[]>([])
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([])
  const [currentResult, setCurrentResult] = useState<QueryResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [queryFolders, setQueryFolders] = useState<QueryFolder[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [queryName, setQueryName] = useState('')
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set())
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  
  // Tab management
  const [tabs, setTabs] = useState<QueryTab[]>([
    { id: '1', name: 'New Query', query: '', isSaved: false }
  ])
  const [activeTabId, setActiveTabId] = useState('1')
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [newTabName, setNewTabName] = useState('')
  const [tabToRename, setTabToRename] = useState<string | null>(null)
  
  // Footer tabs
  const [footerTab, setFooterTab] = useState<'results' | 'history' | 'visualization'>('results')
  const [showFooter, setShowFooter] = useState(true)

  // Load spaces and query history
  useEffect(() => {
    loadSpaces()
    loadQueryHistory()
    loadSavedQueries()
  }, [])

  const loadSpaces = async () => {
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data.spaces || [])
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
    }
  }

  const loadQueryHistory = async () => {
    try {
      const response = await fetch('/api/admin/query-history')
      if (response.ok) {
        const data = await response.json()
        setQueryHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error loading query history:', error)
    }
  }

  const loadSavedQueries = async () => {
    try {
      const response = await fetch('/api/admin/saved-queries')
      if (response.ok) {
        const data = await response.json()
        setSavedQueries(data.queries || [])
        // Organize queries into folders
        organizeQueriesIntoFolders(data.queries || [])
      }
    } catch (error) {
      console.error('Error loading saved queries:', error)
    }
  }

  const organizeQueriesIntoFolders = (queries: SavedQuery[]) => {
    const folders: QueryFolder[] = []
    const folderMap = new Map<string, QueryFolder>()

    queries.forEach(query => {
      const folderPath = query.folder || 'General'
      const pathParts = folderPath.split('/')
      let currentPath = ''
      
      pathParts.forEach((part, index) => {
        const newPath = currentPath ? `${currentPath}/${part}` : part
        if (!folderMap.has(newPath)) {
          const folder: QueryFolder = {
            id: newPath,
            name: part,
            queries: [],
            subfolders: []
          }
          folderMap.set(newPath, folder)
          
          if (currentPath) {
            const parentFolder = folderMap.get(currentPath)
            if (parentFolder) {
              parentFolder.subfolders.push(folder)
            }
          } else {
            folders.push(folder)
          }
        }
        currentPath = newPath
      })
      
      const targetFolder = folderMap.get(folderPath)
      if (targetFolder) {
        targetFolder.queries.push(query)
      }
    })

    setQueryFolders(folders)
  }

  const executeQuery = async () => {
    if (!query.trim()) return

    setIsExecuting(true)
    setFooterTab('results')

    try {
      const response = await fetch('/api/admin/sql-queries/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          space_id: selectedSpace === 'all' ? null : selectedSpace
        })
      })

      if (response.ok) {
        const result = await response.json()
        setCurrentResult(result)
        loadQueryHistory() // Refresh history
      } else {
        const error = await response.json()
        setCurrentResult({
          id: Date.now().toString(),
          query,
          results: [],
          columns: [],
          status: 'error',
          timestamp: new Date(),
          spaceName: spaces.find(s => s.id === selectedSpace)?.name
        })
        toast.error(error.error || 'Query execution failed')
      }
    } catch (error) {
      console.error('Error executing query:', error)
      setCurrentResult({
        id: Date.now().toString(),
        query,
        results: [],
        columns: [],
        status: 'error',
        timestamp: new Date(),
        spaceName: spaces.find(s => s.id === selectedSpace)?.name
      })
      toast.error('Failed to execute query')
    } finally {
      setIsExecuting(false)
    }
  }

  const saveQuery = async () => {
    if (!query.trim()) return

    try {
      const response = await fetch('/api/admin/sql-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: queryName || 'Untitled Query',
          query,
          space_id: selectedSpace === 'all' ? null : selectedSpace
        })
      })

      if (response.ok) {
        toast.success('Query saved successfully')
        setShowSaveDialog(false)
        setQueryName('')
        loadSavedQueries()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save query')
      }
    } catch (error) {
      console.error('Error saving query:', error)
      toast.error('Failed to save query')
    }
  }

  const loadSavedQuery = (savedQuery: SavedQuery) => {
    setQuery(savedQuery.query)
    setSelectedSpace(savedQuery.space_id || 'all')
  }

  // Tab management functions
  const createNewTab = () => {
    const newTabId = Date.now().toString()
    const newTab: QueryTab = {
      id: newTabId,
      name: 'New Query',
      query: '',
      isSaved: false
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTabId)
    setQuery('')
  }

  const closeTab = (tabId: string) => {
    if (tabs.length <= 1) return
    
    setTabs(prev => prev.filter(tab => tab.id !== tabId))
    
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId)
      setActiveTabId(remainingTabs[0].id)
      setQuery(remainingTabs[0].query)
    }
  }

  const switchTab = (tabId: string) => {
    setActiveTabId(tabId)
    const tab = tabs.find(t => t.id === tabId)
    if (tab) {
      setQuery(tab.query)
    }
  }

  const updateCurrentTabQuery = (newQuery: string) => {
    setQuery(newQuery)
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, query: newQuery } : tab
    ))
  }

  const renameTab = (tabId: string) => {
    setTabToRename(tabId)
    const tab = tabs.find(t => t.id === tabId)
    setNewTabName(tab?.name || '')
    setShowRenameDialog(true)
  }

  const handleRenameTab = () => {
    if (!tabToRename || !newTabName.trim()) return
    
    setTabs(prev => prev.map(tab => 
      tab.id === tabToRename ? { ...tab, name: newTabName.trim() } : tab
    ))
    setShowRenameDialog(false)
    setNewTabName('')
    setTabToRename(null)
  }

  const saveCurrentTab = async () => {
    const currentTab = tabs.find(t => t.id === activeTabId)
    if (!currentTab || !currentTab.query.trim()) return

    try {
      const response = await fetch('/api/admin/sql-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentTab.name,
          query: currentTab.query,
          space_id: selectedSpace === 'all' ? null : selectedSpace
        })
      })

      if (response.ok) {
        const savedQuery = await response.json()
        setTabs(prev => prev.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, isSaved: true, savedQueryId: savedQuery.id }
            : tab
        ))
        toast.success('Query saved successfully')
        loadSavedQueries()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save query')
      }
    } catch (error) {
      console.error('Error saving query:', error)
      toast.error('Failed to save query')
    }
  }

  const exportResults = () => {
    if (!currentResult?.results.length) return

    const csv = [
      currentResult.columns.join(','),
      ...currentResult.results.map(row => 
        currentResult.columns.map(col => `"${row[col] || ''}"`).join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `query-results-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />
      case 'running':
        return <Clock className="h-3 w-3 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-3 w-3 text-gray-500" />
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const renderQueryTree = (folders: QueryFolder[], level = 0) => {
    return folders.map(folder => (
      <div key={folder.id} className="ml-2">
        <div>
          <button
            className="flex items-center gap-1 w-full text-left hover:bg-gray-50 p-1 rounded"
            onClick={() => {
              const newExpanded = new Set(expandedFolders)
              if (expandedFolders.has(folder.id)) {
                newExpanded.delete(folder.id)
              } else {
                newExpanded.add(folder.id)
              }
              setExpandedFolders(newExpanded)
            }}
          >
            {expandedFolders.has(folder.id) ? 
              <ChevronDown className="h-3 w-3" /> : 
              <ChevronRight className="h-3 w-3" />
            }
            {expandedFolders.has(folder.id) ? 
              <FolderOpen className="h-3 w-3 text-blue-500" /> : 
              <Folder className="h-3 w-3 text-blue-500" />
            }
            <span className="text-xs text-gray-700">{folder.name}</span>
          </button>
          {expandedFolders.has(folder.id) && (
            <div className="ml-4">
              {folder.queries.map(query => (
                <div
                  key={query.id}
                  className="flex items-center gap-1 p-1 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => loadSavedQuery(query)}
                >
                  <File className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-600 truncate">{query.name}</span>
                  {query.isStarred && <Bookmark className="h-3 w-3 text-yellow-500" />}
                </div>
              ))}
              {folder.subfolders.length > 0 && renderQueryTree(folder.subfolders, level + 1)}
            </div>
          )}
        </div>
      </div>
    ))
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">BigQuery Interface</h2>
                <p className="text-xs text-gray-500">SQL Editor & Data Explorer</p>
              </div>
            </div>
            
            {/* Space Selector */}
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-gray-500" />
              <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                <SelectTrigger className="w-48 h-8 text-sm">
                  <SelectValue placeholder="Select space" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Spaces</SelectItem>
                  {spaces.map(space => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={executeQuery}
              disabled={isExecuting || !query.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
            >
              {isExecuting ? (
                <>
                  <Clock className="h-4 w-4 mr-1 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Run
                </>
              )}
            </Button>
            
            <Button size="sm" variant="outline" onClick={saveCurrentTab}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            
            <Button size="sm" variant="outline" onClick={loadQueryHistory}>
              <History className="h-4 w-4 mr-1" />
              History
            </Button>

            {currentResult && (
              <Button size="sm" variant="outline" onClick={exportResults}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex items-center">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center gap-2 px-3 py-2 border-r border-gray-200 cursor-pointer group ${
                  activeTabId === tab.id 
                    ? 'bg-blue-50 border-b-2 border-blue-500' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => switchTab(tab.id)}
              >
                <span className="text-sm font-medium text-gray-700">
                  {tab.name}
                </span>
                {tab.isSaved && (
                  <Save className="h-3 w-3 text-green-600" />
                )}
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(tab.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    renameTab(tab.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit className="h-3 w-3 text-gray-400 hover:text-blue-500" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2 px-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={createNewTab}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Database Explorer with Accordion */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Explorer</span>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Search tables, queries..."
                className="pl-7 h-8 text-xs"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-3">
              {/* Saved Queries Section */}
              <div>
                <button
                  className="flex items-center gap-2 w-full text-left hover:bg-gray-50 p-2 rounded"
                  onClick={() => {
                    const newExpanded = new Set(expandedSchemas)
                    if (expandedSchemas.has('saved-queries')) {
                      newExpanded.delete('saved-queries')
                    } else {
                      newExpanded.add('saved-queries')
                    }
                    setExpandedSchemas(newExpanded)
                  }}
                >
                  {expandedSchemas.has('saved-queries') ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                  <Bookmark className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Saved Queries</span>
                </button>
                {expandedSchemas.has('saved-queries') && (
                  <div className="ml-6 mt-2">
                    {renderQueryTree(queryFolders)}
                  </div>
                )}
              </div>

              {/* Database Tables Section */}
              <div>
                <button
                  className="flex items-center gap-2 w-full text-left hover:bg-gray-50 p-2 rounded"
                  onClick={() => {
                    const newExpanded = new Set(expandedSchemas)
                    if (expandedSchemas.has('database-tables')) {
                      newExpanded.delete('database-tables')
                    } else {
                      newExpanded.add('database-tables')
                    }
                    setExpandedSchemas(newExpanded)
                  }}
                >
                  {expandedSchemas.has('database-tables') ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                  <Table className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Database Tables</span>
                </button>
                {expandedSchemas.has('database-tables') && (
                  <div className="ml-6 mt-2">
                    {spaces.map(space => (
                      <div key={space.id} className="mb-2">
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
                          <Database className="h-3 w-3" />
                          {space.name}
                        </div>
                        <div className="ml-4 space-y-1">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Table className="h-3 w-3" />
                            users
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Table className="h-3 w-3" />
                            spaces
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Table className="h-3 w-3" />
                            data_models
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* SQL Editor - Code Editor Style */}
          <div className="flex-1 bg-white">
            <div className="h-full flex flex-col">
              {/* Editor Header */}
              <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Query Editor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                      <Share className="h-3 w-3 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* SQL Textarea - Code Editor Style */}
              <div className="flex-1 p-4">
                <Textarea
                  value={query}
                  onChange={(e) => updateCurrentTabQuery(e.target.value)}
                  placeholder="-- Enter your SQL query here
SELECT * FROM users 
WHERE created_at >= '2024-01-01'
ORDER BY created_at DESC
LIMIT 100;"
                  className="w-full h-full resize-none border-0 font-mono text-sm focus:ring-0 focus:outline-none bg-gray-50 rounded-lg p-4"
                  style={{ 
                    minHeight: '400px',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    lineHeight: '1.5',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Tabs */}
      {showFooter && (
        <div className="bg-white border-t border-gray-200">
          <div className="flex items-center border-b border-gray-200">
            <Tabs value={footerTab} onValueChange={(value) => setFooterTab(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="results" className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  Data Results
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Query History
                </TabsTrigger>
                <TabsTrigger value="visualization" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Visualization
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="h-64">
            {footerTab === 'results' && (
              currentResult ? (
              <div className="h-full flex flex-col">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(currentResult.status)}
                        <span className="text-sm font-medium">
                          {currentResult.status === 'success' ? 'Query completed' : 'Query failed'}
                        </span>
                      </div>
                      {currentResult.executionTime && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Timer className="h-3 w-3" />
                          {formatDuration(currentResult.executionTime)}
                        </div>
                      )}
                      {currentResult.size && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <HardDrive className="h-3 w-3" />
                          {formatBytes(currentResult.size)}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {currentResult.results.length} rows
                    </div>
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    {currentResult.status === 'success' && currentResult.results.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              {currentResult.columns.map((column, index) => (
                                <th key={index} className="px-4 py-3 text-left font-medium text-gray-700 border-b border-gray-200">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {currentResult.results.slice(0, 100).map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-b border-gray-100 hover:bg-gray-50">
                                {currentResult.columns.map((column, colIndex) => (
                                  <td key={colIndex} className="px-4 py-3 text-gray-900">
                                    {row[column]?.toString() || ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {currentResult.results.length > 100 && (
                          <div className="p-4 text-center text-gray-500 text-sm bg-gray-50">
                            Showing first 100 of {currentResult.results.length} rows
                          </div>
                        )}
                      </div>
                    ) : currentResult.status === 'error' ? (
                      <div className="p-6 bg-red-50 border-l-4 border-red-400">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-red-500" />
                          <p className="text-red-700 font-medium">Query execution failed</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        <Database className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No results to display</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No query results yet</p>
                    <p className="text-sm text-gray-400 mt-2">Execute a query to see results here</p>
                  </div>
                </div>
              )
            )}

            {footerTab === 'history' && (
              <div className="h-full flex flex-col">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Query History</h3>
                    <div className="flex items-center gap-2">
                      <Input placeholder="Filter queries..." className="h-8 w-48 text-xs" />
                      <Button size="sm" variant="outline" className="h-8 text-xs">
                        <Filter className="h-3 w-3 mr-1" />
                        Filter
                      </Button>
                    </div>
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <div className="space-y-2">
                      {queryHistory.map((historyItem) => (
                        <div
                          key={historyItem.id}
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setQuery(historyItem.query)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(historyItem.status)}
                              <span className="text-sm font-medium text-gray-900">
                                {historyItem.query.substring(0, 50)}...
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {historyItem.userName || 'Unknown'}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {historyItem.timestamp ? new Date(historyItem.timestamp).toLocaleString() : 'Unknown time'}
                              </div>
                              {historyItem.executionTime && (
                                <div className="flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  {formatDuration(historyItem.executionTime)}
                                </div>
                              )}
                              {historyItem.size && (
                                <div className="flex items-center gap-1">
                                  <HardDrive className="h-3 w-3" />
                                  {formatBytes(historyItem.size)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Space: {historyItem.spaceName || 'All Spaces'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}

            {footerTab === 'visualization' && (
              <div className="h-full flex flex-col">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Data Visualization</h3>
                    <div className="flex items-center gap-2">
                      <Select defaultValue="bar">
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="pie">Pie Chart</SelectItem>
                          <SelectItem value="scatter">Scatter Plot</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 p-4">
                  <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">Select a query result to visualize</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Query Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Query</DialogTitle>
            <DialogDescription>
              Save this query for future use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="query-name">Query Name</Label>
              <Input
                id="query-name"
                value={queryName}
                onChange={(e) => setQueryName(e.target.value)}
                placeholder="Enter a name for this query"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveQuery}>
              Save Query
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Tab Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Query</DialogTitle>
            <DialogDescription>
              Enter a new name for this query
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tab-name">Query Name</Label>
              <Input
                id="tab-name"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="Enter a name for this query"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameTab}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}