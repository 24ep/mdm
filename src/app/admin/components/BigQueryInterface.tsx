'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CodeEditor } from '@/components/ui/code-editor'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  Play, 
  Save, 
  History, 
  ChevronDown,
  ChevronRight,
  Copy,
  Table,
  FileText,
  Clock,
  Check,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Bookmark,
  Edit,
  Trash2,
  Share,
  Zap,
  BarChart3,
  Filter,
  Search,
  Plus,
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
  Hash,
  Info,
  LineChart
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

// Import the new components
import {
  QueryTemplates,
  QueryBookmarks,
  KeyboardShortcuts,
  useQueryValidation,
  TableContextMenu,
  DataExplorer,
  ResultsPanel,
} from '@/components/bigquery'
import { useKeyboardShortcuts, useSpaces, useDataModels } from '@/hooks'

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
  description?: string
  isDefault: boolean
  icon?: string
  logoUrl?: string
  createdAt: string
  updatedAt: string
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

export function BigQueryInterface() {
  const [query, setQuery] = useState('')
  const [selectedSpace, setSelectedSpace] = useState('all')
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([])
  const [currentResult, setCurrentResult] = useState<QueryResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [queryFolders, setQueryFolders] = useState<QueryFolder[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [queryName, setQueryName] = useState('')
  const [saveAsCopy, setSaveAsCopy] = useState(false)
  const [currentView, setCurrentView] = useState<'editor' | 'schema'>('editor')
  const [selectedTable, setSelectedTable] = useState<{name: string, spaceName: string, description?: string, attributes: any[]} | null>(null)
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set())
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  
  // Fetch spaces from database
  const { spaces, loading: spacesLoading, error: spacesError, refetch: refetchSpaces } = useSpaces()
  
  // Fetch data models for the selected space
  const { dataModels } = useDataModels(selectedSpace)
  
  // Space dropdown state
  const [spaceDropdownOpen, setSpaceDropdownOpen] = useState(false)
  const [spaceSearchValue, setSpaceSearchValue] = useState('')
  
  
  // Tab management
  const [tabs, setTabs] = useState<QueryTab[]>([
    { id: '1', name: 'New Query', query: '', isSaved: false }
  ])
  const [activeTabId, setActiveTabId] = useState('1')
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [newTabName, setNewTabName] = useState('')
  const [tabToRename, setTabToRename] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    tableName: string
    projectName: string
    sourceType?: 'INTERNAL' | 'EXTERNAL'
  }>({
    visible: false,
    x: 0,
    y: 0,
    tableName: '',
    projectName: '',
    sourceType: 'INTERNAL'
  })
  
  // Footer tabs
  const [footerTab, setFooterTab] = useState<'results' | 'history' | 'visualization' | 'validation'>('results')
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

  // Load query history
  useEffect(() => {
    loadQueryHistory()
  }, [])

  // Set default space when spaces are loaded (only if no space is selected)
  useEffect(() => {
    if (spaces.length > 0 && selectedSpace === 'all') {
      // Keep 'all' as the default to show all spaces in tree view
      // Users can manually select a specific space if needed
    }
  }, [spaces, selectedSpace])

  // Validate query on change
  useEffect(() => {
    const validation = validateQuery(query)
    setQueryValidation(validation)
  }, [query, validateQuery])


  // Mock data loading functions

  const loadQueryHistory = async () => {
    // Mock query history data
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
  const executeQuery = async () => {
    if (!query.trim()) return

    setIsExecuting(true)
    try {
      // Mock query execution
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockResult: QueryResult = {
          id: Date.now().toString(),
          query,
        results: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ],
        columns: ['id', 'name', 'email'],
        status: 'success',
        executionTime: 150,
          timestamp: new Date(),
        spaceName: selectedSpace === 'all' ? 'All Spaces' : spaces.find(s => s.id === selectedSpace)?.name,
        userName: 'Current User',
        size: 2048
      }

      setCurrentResult(mockResult)
      setQueryHistory(prev => [mockResult, ...prev])
      setShowFooter(true)
      setFooterTab('results')
      
      toast.success('Query executed successfully')
    } catch (error) {
      toast.error('Query execution failed')
    } finally {
      setIsExecuting(false)
    }
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

  const renameTab = (tabId: string, newName: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, name: newName } : tab
    ))
  }

  const handleRenameTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab) {
      setNewTabName(tab.name)
      setTabToRename(tabId)
      setShowRenameDialog(true)
    }
  }

  const confirmRenameTab = () => {
    if (tabToRename && newTabName.trim()) {
      renameTab(tabToRename, newTabName.trim())
      setShowRenameDialog(false)
      setTabToRename(null)
      setNewTabName('')
    }
  }

  const saveCurrentTab = (asCopy = false) => {
    if (!query.trim()) {
      toast.error('Please enter a query to save')
      return
    }
    
    const currentTab = tabs.find(t => t.id === activeTabId)
    if (currentTab) {
      // Use the tab name as the query name
      setQueryName(asCopy ? `${currentTab.name} (Copy)` : currentTab.name)
    }
    setSaveAsCopy(asCopy)
    setShowSaveDialog(true)
  }

  // Context menu functions
  const handleTableLeftClick = async (tableName: string, spaceName: string) => {
    // Find the data model for this table
    const dataModel = dataModels.find(dm => dm.name === tableName)
    if (dataModel) {
      try {
        // Fetch attributes for this data model
        const response = await fetch(`/api/data-models/${dataModel.id}/attributes`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const attributesData = await response.json()
        
        setSelectedTable({
          name: tableName,
          spaceName: spaceName,
          description: dataModel.description,
          attributes: attributesData.attributes || []
        })
        setCurrentView('schema')
      } catch (error) {
        console.error('Error fetching attributes:', error)
        toast.error(`Failed to load attributes: ${error instanceof Error ? error.message : 'Unknown error'}`)
        // Set empty attributes array as fallback
        setSelectedTable({
          name: tableName,
          spaceName: spaceName,
          description: dataModel.description,
          attributes: []
        })
        setCurrentView('schema')
      }
    }
  }

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
        // Prevent dropping internal data source tables
        const dataModel = dataModels.find(dm => dm.name === tableName)
        if (dataModel?.sourceType === 'INTERNAL') {
          toast.error('Cannot drop tables from internal data sources')
          return
        }
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
    onRunQuery: executeQuery,
    onSaveQuery: () => saveCurrentTab(false),
    onCreateNewTab: createNewTab,
    onCloseTab: () => closeTab(activeTabId),
    onRenameTab: () => handleRenameTab(activeTabId),
    onShowTemplates: () => setShowTemplates(true),
    onShowBookmarks: () => setShowBookmarks(true),
    onShowHistory: () => { setFooterTab('history'); setShowFooter(true) },
    onShowResults: () => { setFooterTab('results'); setShowFooter(true) },
    onShowVisualization: () => { setFooterTab('visualization'); setShowFooter(true) },
    onShowValidation: () => { setFooterTab('validation'); setShowFooter(true) },
    onShowShortcuts: () => setShowShortcuts(true),
    onCloseDialogs: () => {
      setShowTemplates(false)
      setShowBookmarks(false)
      setShowShortcuts(false)
      closeContextMenu()
    },
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
    e.stopPropagation()
    console.log('Mouse down on resize handle')
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
    console.log('Resizing footer to:', constrainedHeight)
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
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
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

  const currentTab = tabs.find(tab => tab.id === activeTabId)

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* BigQuery Style Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">SQL Query</h1>
              </div>
            {/* Space Selection Dropdown */}
            <Popover open={spaceDropdownOpen} onOpenChange={setSpaceDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={spaceDropdownOpen}
                  className="w-[200px] justify-between h-8 px-3"
                  disabled={spacesLoading}
                >
                  <span className="truncate">
                    {spacesLoading ? 'Loading spaces...' : 
                     spacesError ? 'Error loading spaces' :
                     selectedSpace === 'all' ? 'All Spaces' : 
                     spaces.find(s => s.id === selectedSpace)?.name || 'Select space...'}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search spaces..." 
                    value={spaceSearchValue}
                    onValueChange={setSpaceSearchValue}
                  />
                  <CommandList>
                    {spacesLoading ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Loading spaces...
                      </div>
                    ) : spacesError ? (
                      <div className="p-4 text-center">
                        <div className="text-sm text-red-600 mb-2">
                          {spacesError.includes('Authentication') ? 'Please sign in to view spaces' : 'Error loading spaces'}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => refetchSpaces()}
                          className="text-xs"
                        >
                          Retry
                        </Button>
                      </div>
                    ) : spaces.length === 0 ? (
                      <div className="p-4 text-center">
                        <div className="text-sm text-gray-600 mb-2">No spaces available</div>
                        <div className="text-xs text-gray-500">Contact your administrator to create spaces</div>
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>No space found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              setSelectedSpace('all')
                              setSpaceDropdownOpen(false)
                              setSpaceSearchValue('')
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedSpace === 'all' ? "opacity-100" : "opacity-0"
                              )}
                            />
                            All Spaces
                          </CommandItem>
                          {spaces.filter(space =>
                            space.name.toLowerCase().includes(spaceSearchValue.toLowerCase()) ||
                            space.slug.toLowerCase().includes(spaceSearchValue.toLowerCase())
                          ).map((space) => (
                            <CommandItem
                              key={space.id}
                              value={space.id}
                              onSelect={() => {
                                setSelectedSpace(space.id)
                                setSpaceDropdownOpen(false)
                                setSpaceSearchValue('')
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedSpace === space.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{space.name}</span>
                                <span className="text-xs text-gray-500">{space.slug}</span>
                                {space.isDefault && (
                                  <span className="text-xs text-blue-600">Default</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 px-3">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 px-4">
            {tabs.map((tab) => (
              <div
                key={tab.id}
              className={`flex items-center gap-2 px-3 py-2 text-sm border-b-2 cursor-pointer group ${
                tab.id === activeTabId
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => {
                setActiveTabId(tab.id)
                setQuery(tab.query)
              }}
              onDoubleClick={() => handleRenameTab(tab.id)}
            >
              <span>{tab.name}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRenameTab(tab.id)
                  }}
                  className="hover:bg-gray-200 rounded p-1"
                  title="Rename tab"
                >
                  <Edit className="h-3 w-3" />
                </button>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(tab.id)
                    }}
                    className="hover:bg-gray-200 rounded p-1"
                    title="Close tab"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            ))}
            <Button
              size="sm"
              variant="ghost"
            className="h-8 px-2"
              onClick={createNewTab}
            >
              <Plus className="h-4 w-4" />
            </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Data Explorer */}
        <DataExplorer
          spaces={spaces}
          selectedSpace={selectedSpace}
          onTableRightClick={handleTableRightClick}
          onTableLeftClick={handleTableLeftClick}
          savedQueries={savedQueries}
          queryFolders={queryFolders}
          onLoadQuery={updateCurrentTabQuery}
          onStarQuery={toggleBookmark}
          onDeleteQuery={(queryId) => {
            setSavedQueries(prev => prev.filter(q => q.id !== queryId))
          }}
          onRenameQuery={(queryId, newName) => {
            setSavedQueries(prev => prev.map(q => 
              q.id === queryId ? { ...q, name: newName } : q
            ))
          }}
          onCreateFolder={(name, parentId) => {
            const newFolder: QueryFolder = {
              id: Date.now().toString(),
              name,
              parentId,
              subfolders: []
            }
            setQueryFolders(prev => [...prev, newFolder])
          }}
          onRenameFolder={(folderId, newName) => {
            setQueryFolders(prev => prev.map(f => 
              f.id === folderId ? { ...f, name: newName } : f
            ))
          }}
          onDeleteFolder={(folderId) => {
            setQueryFolders(prev => prev.filter(f => f.id !== folderId))
          }}
        />

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={executeQuery} 
                  disabled={isExecuting || !query.trim()}
                  className="h-8 px-3"
                >
                  <Play className="h-4 w-4 mr-1" />
                  {isExecuting ? 'Running...' : 'Run'}
                </Button>
                
                <Button size="sm" variant="outline" onClick={() => setShowTemplates(true)} className="h-8 px-3">
                  <FileText className="h-4 w-4 mr-1" />
                  Templates
                </Button>
                
                <Button size="sm" variant="outline" onClick={() => setShowBookmarks(true)} className="h-8 px-3">
                  <Bookmark className="h-4 w-4 mr-1" />
                  Bookmarks
                  {bookmarkedQueries.size > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                      {bookmarkedQueries.size}
                    </Badge>
                  )}
                </Button>
                
                <Button size="sm" variant="outline" onClick={() => setShowShortcuts(true)} className="h-8 px-3">
                  <Zap className="h-4 w-4 mr-1" />
                  Shortcuts
                </Button>
                
        </div>

                  <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 px-3">
                      <Save className="h-4 w-4 mr-1" />
                      Save
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => saveCurrentTab(false)}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => saveCurrentTab(true)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Save as Copy
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowFooter(!showFooter)} 
                  className="h-8 px-3"
                >
                  {showFooter ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showFooter ? 'Hide' : 'Show'} Results
                    </Button>
                  </div>
                </div>
              </div>
              
          {/* Main Content Area */}
          <div className="flex-1 h-full">
            {currentView === 'editor' ? (
              <CodeEditor
                value={query}
                onChange={updateCurrentTabQuery}
                language="sql"
                height="100%"
                placeholder="-- Enter your SQL query here
SELECT 
  name,
  email,
  created_at
FROM users 
WHERE created_at >= '2024-01-01'
ORDER BY created_at DESC
LIMIT 100;"
                theme="light"
                options={{
                  fontSize: 14,
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                  tabSize: 2,
                  wordWrap: true,
                  showLineNumbers: true,
                  showGutter: true,
                  enableBracketMatching: true,
                  enableAutoIndent: true,
                  enableFindReplace: true,
                  enableCodeFolding: true,
                  enableMinimap: false,
                  enableAutoComplete: true,
                  enableSyntaxValidation: true,
                  enableErrorHighlighting: true,
                  enableIntelliSense: true,
                  enableSnippets: true,
                  enableBracketPairColorization: true,
                  enableIndentGuides: true,
                  enableWordHighlight: true,
                  enableCurrentLineHighlight: true,
                  enableSelectionHighlight: true
                }}
              />
            ) : (
              <div className="h-full flex flex-col">
                {/* Schema Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Table className="h-5 w-5 text-blue-500" />
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{selectedTable?.name}</h2>
                        <p className="text-sm text-gray-500">{selectedTable?.spaceName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setCurrentView('editor')}
                        className="h-8 px-3"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Back to Editor
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          updateCurrentTabQuery(`SELECT * FROM \`${selectedTable?.name}\` LIMIT 100;`)
                          setCurrentView('editor')
                        }}
                        className="h-8 px-3"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Generate Query
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Schema Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {selectedTable?.description && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedTable.description}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Schema</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Primary Key</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedTable?.attributes && selectedTable.attributes.length > 0 ? (
                            selectedTable.attributes.map((attr, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                <div className="flex items-center gap-2">
                                  {attr.name}
                                  {attr.isPrimaryKey && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      PK
                                    </span>
                                  )}
                                  {attr.isForeignKey && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      FK
                                    </span>
                                  )}
                                  {attr.isAutoIncrement && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                      AI
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">{attr.type || 'Unknown'}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {attr.isRequired ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    Required
                                  </span>
                                ) : (
                                  <span className="text-gray-400">Optional</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {attr.isUnique ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Unique
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {attr.isPrimaryKey ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    Yes
                                  </span>
                                ) : (
                                  <span className="text-gray-400">No</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {attr.defaultValue ? (
                                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{attr.defaultValue}</code>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">{attr.description || '-'}</td>
                            </tr>
                          ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                No attributes found for this data model.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Panel - Now positioned under the code editor only */}
          <ResultsPanel
            showFooter={showFooter}
            footerHeight={footerHeight}
            isResizing={isResizing}
            footerTab={footerTab}
            onFooterTabChange={setFooterTab}
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
            validation={queryValidation}
            onJumpToLine={(line, column) => {
              // TODO: Implement jump to line functionality
              console.log(`Jump to line ${line}, column ${column}`)
            }}
          />
        </div>
      </div>


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
        sourceType={contextMenu.sourceType as 'INTERNAL' | 'EXTERNAL'}
        onAction={handleContextMenuAction}
        onClose={closeContextMenu}
      />

      {/* Rename Tab Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Tab</DialogTitle>
            <DialogDescription>
              Enter a new name for this query tab.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tab-name">Tab Name</Label>
              <Input
                id="tab-name"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="Enter tab name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmRenameTab()
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRenameDialog(false)
                setTabToRename(null)
                setNewTabName('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmRenameTab} disabled={!newTabName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
