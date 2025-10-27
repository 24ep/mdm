'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CodeEditor } from '@/components/ui/code-editor'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
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
  Hash,
  Info,
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
  const [footerTab, setFooterTab] = useState<'results' | 'history' | 'visualization'>('results')
  const [showFooter, setShowFooter] = useState(true)
  const [footerHeight, setFooterHeight] = useState(320) // Default height in pixels
  const [isResizing, setIsResizing] = useState(false)
  const [initialMouseY, setInitialMouseY] = useState(0)
  const [initialHeight, setInitialHeight] = useState(320)
  
  // Visualization state
  const [chartType, setChartType] = useState<string>('BAR')
  const [chartConfig, setChartConfig] = useState({
    dimensions: [] as string[],
    measures: [] as string[],
    title: 'Query Results Visualization'
  })

  // Query templates state
  const [showTemplates, setShowTemplates] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  
  // Query bookmarks state
  const [bookmarkedQueries, setBookmarkedQueries] = useState<Set<string>>(new Set())
  const [showBookmarks, setShowBookmarks] = useState(false)
  
  // Keyboard shortcuts state
  const [showShortcuts, setShowShortcuts] = useState(false)
  
  // Query validation state
  const [queryValidation, setQueryValidation] = useState<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }>({ isValid: true, errors: [], warnings: [] })
  
  // Advanced search and filtering state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error' | 'running'>('all')
  const [filterUser, setFilterUser] = useState('all')
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [queryTemplates] = useState([
    {
      id: 'select-all',
      name: 'Select All Records',
      description: 'Select all records from a table',
      sql: `SELECT * FROM \`project.dataset.table\` LIMIT 100;`,
      category: 'Basic'
    },
    {
      id: 'select-filtered',
      name: 'Select with Filter',
      description: 'Select records with WHERE condition',
      sql: `SELECT 
  column1,
  column2,
  column3
FROM \`project.dataset.table\`
WHERE column1 = 'value'
  AND column2 > 100
ORDER BY column3 DESC
LIMIT 50;`,
      category: 'Basic'
    },
    {
      id: 'join-tables',
      name: 'Join Tables',
      description: 'Join two tables with common key',
      sql: `SELECT 
  t1.column1,
  t1.column2,
  t2.column3,
  t2.column4
FROM \`project.dataset.table1\` t1
JOIN \`project.dataset.table2\` t2
  ON t1.id = t2.table1_id
WHERE t1.status = 'active'
ORDER BY t1.created_at DESC;`,
      category: 'Joins'
    },
    {
      id: 'aggregate-data',
      name: 'Aggregate Data',
      description: 'Group and aggregate data with functions',
      sql: `SELECT 
  category,
  COUNT(*) as total_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  MIN(amount) as min_amount,
  MAX(amount) as max_amount
FROM \`project.dataset.transactions\`
WHERE date >= '2024-01-01'
GROUP BY category
HAVING COUNT(*) > 10
ORDER BY total_amount DESC;`,
      category: 'Analytics'
    },
    {
      id: 'window-functions',
      name: 'Window Functions',
      description: 'Use window functions for ranking and analytics',
      sql: `SELECT 
  user_id,
  amount,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY amount DESC) as rank,
  SUM(amount) OVER (PARTITION BY user_id) as user_total,
  AVG(amount) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as moving_avg
FROM \`project.dataset.transactions\`
WHERE date >= '2024-01-01';`,
      category: 'Analytics'
    },
    {
      id: 'create-table',
      name: 'Create Table',
      description: 'Create a new table with schema',
      sql: `CREATE TABLE \`project.dataset.new_table\` (
  id INT64 NOT NULL,
  name STRING(255),
  email STRING(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(created_at)
CLUSTER BY id;`,
      category: 'DDL'
    },
    {
      id: 'insert-data',
      name: 'Insert Data',
      description: 'Insert new records into table',
      sql: `INSERT INTO \`project.dataset.table\` (column1, column2, column3)
VALUES 
  ('value1', 'value2', 'value3'),
  ('value4', 'value5', 'value6'),
  ('value7', 'value8', 'value9');`,
      category: 'DML'
    },
    {
      id: 'update-data',
      name: 'Update Data',
      description: 'Update existing records',
      sql: `UPDATE \`project.dataset.table\`
SET 
  column1 = 'new_value',
  updated_at = CURRENT_TIMESTAMP()
WHERE condition_column = 'condition_value'
  AND status = 'active';`,
      category: 'DML'
    },
    {
      id: 'delete-data',
      name: 'Delete Data',
      description: 'Delete records with condition',
      sql: `DELETE FROM \`project.dataset.table\`
WHERE condition_column = 'condition_value'
  AND created_at < '2024-01-01';`,
      category: 'DML'
    },
    {
      id: 'cte-query',
      name: 'Common Table Expression',
      description: 'Use CTE for complex queries',
      sql: `WITH user_stats AS (
  SELECT 
    user_id,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount
  FROM \`project.dataset.transactions\`
  WHERE date >= '2024-01-01'
  GROUP BY user_id
),
top_users AS (
  SELECT *
  FROM user_stats
  WHERE total_amount > 1000
)
SELECT 
  u.user_id,
  u.transaction_count,
  u.total_amount,
  RANK() OVER (ORDER BY u.total_amount DESC) as rank
FROM top_users u
ORDER BY u.total_amount DESC;`,
      category: 'Advanced'
    }
  ])

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

  const exportResults = (format: 'csv' | 'json' | 'excel' | 'pdf' = 'csv') => {
    if (!currentResult?.results.length) return

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `query-results-${timestamp}`

    switch (format) {
      case 'csv':
        const csv = [
          currentResult.columns.join(','),
          ...currentResult.results.map(row => 
            currentResult.columns.map(col => `"${row[col] || ''}"`).join(',')
          )
        ].join('\n')
        downloadFile(csv, `${filename}.csv`, 'text/csv')
        break

      case 'json':
        const json = JSON.stringify({
          columns: currentResult.columns,
          data: currentResult.results,
          metadata: {
            totalRows: currentResult.results.length,
            exportedAt: new Date().toISOString(),
            query: query
          }
        }, null, 2)
        downloadFile(json, `${filename}.json`, 'application/json')
        break

      case 'excel':
        // For Excel, we'll create a CSV that can be opened in Excel
        const excelCsv = [
          currentResult.columns.join('\t'),
          ...currentResult.results.map(row => 
            currentResult.columns.map(col => `${row[col] || ''}`).join('\t')
          )
        ].join('\n')
        downloadFile(excelCsv, `${filename}.xls`, 'application/vnd.ms-excel')
        break

      case 'pdf':
        // For PDF, we'll create a simple text representation
        const pdfContent = `Query Results Report
Generated: ${new Date().toLocaleString()}
Total Rows: ${currentResult.results.length}

Columns: ${currentResult.columns.join(', ')}

Data:
${currentResult.results.slice(0, 100).map((row, index) => 
  `${index + 1}. ${currentResult.columns.map(col => `${col}: ${row[col] || ''}`).join(', ')}`
).join('\n')}

${currentResult.results.length > 100 ? `\n... and ${currentResult.results.length - 100} more rows` : ''}`
        downloadFile(pdfContent, `${filename}.txt`, 'text/plain')
        break
    }
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Context menu handlers
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

  const handleContextMenuAction = (action: string) => {
    const { tableName, projectName } = contextMenu
    
    switch (action) {
      case 'select':
        const selectQuery = `SELECT * FROM \`${projectName}.${tableName}\` LIMIT 100;`
        updateCurrentTabQuery(selectQuery)
        break
      case 'describe':
        const describeQuery = `DESCRIBE \`${projectName}.${tableName}\`;`
        updateCurrentTabQuery(describeQuery)
        break
      case 'count':
        const countQuery = `SELECT COUNT(*) as total_rows FROM \`${projectName}.${tableName}\`;`
        updateCurrentTabQuery(countQuery)
        break
      case 'preview':
        const previewQuery = `SELECT * FROM \`${projectName}.${tableName}\` LIMIT 10;`
        updateCurrentTabQuery(previewQuery)
        break
      case 'schema':
        const schemaQuery = `SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE table_name = '${tableName}'
ORDER BY ordinal_position;`
        updateCurrentTabQuery(schemaQuery)
        break
      case 'drop':
        if (confirm(`Are you sure you want to drop table ${tableName}? This action cannot be undone.`)) {
          const dropQuery = `DROP TABLE \`${projectName}.${tableName}\`;`
          updateCurrentTabQuery(dropQuery)
        }
        break
      case 'copy_name':
        navigator.clipboard.writeText(`${projectName}.${tableName}`)
        break
      case 'copy_path':
        navigator.clipboard.writeText(`\`${projectName}.${tableName}\``)
        break
    }
    
    setContextMenu({ visible: false, x: 0, y: 0, tableName: '', projectName: '' })
  }

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, tableName: '', projectName: '' })
  }

  // Visualization functions
  const prepareChartData = () => {
    if (!currentResult?.results.length) return []
    
    return currentResult.results.map((row, index) => {
      const dataPoint: any = { index }
      
      // Add all columns as potential data points
      currentResult.columns.forEach(column => {
        const value = row[column]
        if (value !== null && value !== undefined) {
          // Try to parse numeric values
          if (typeof value === 'string' && !isNaN(Number(value))) {
            dataPoint[column] = Number(value)
          } else {
            dataPoint[column] = value
          }
        }
      })
      
      return dataPoint
    })
  }

  const getAvailableColumns = () => {
    if (!currentResult?.columns) return []
    return currentResult.columns
  }

  const getNumericColumns = () => {
    if (!currentResult?.results.length) return []
    
    const numericColumns: string[] = []
    const firstRow = currentResult.results[0]
    
    currentResult.columns.forEach(column => {
      const value = firstRow[column]
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
        numericColumns.push(column)
      }
    })
    
    return numericColumns
  }

  // Query template functions
  const insertTemplate = (template: any) => {
    updateCurrentTabQuery(template.sql)
    setShowTemplates(false)
  }

  const getTemplatesByCategory = () => {
    const categories = Array.from(new Set(queryTemplates.map(t => t.category)))
    return categories.map(category => ({
      category,
      templates: queryTemplates.filter(t => t.category === category)
    }))
  }

  // Query bookmark functions
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter: Run query
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        executeQuery()
      }
      
      // Ctrl/Cmd + S: Save query
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveCurrentTab()
      }
      
      // Ctrl/Cmd + N: New tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        createNewTab()
      }
      
      // Ctrl/Cmd + W: Close tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault()
        if (tabs.length > 1) {
          closeTab(activeTabId)
        }
      }
      
      // Ctrl/Cmd + T: Show templates
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault()
        setShowTemplates(true)
      }
      
      // Ctrl/Cmd + B: Show bookmarks
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        setShowBookmarks(true)
      }
      
      // Ctrl/Cmd + H: Show history
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault()
        setFooterTab('history')
        setShowFooter(true)
      }
      
      // Ctrl/Cmd + R: Show results
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault()
        setFooterTab('results')
        setShowFooter(true)
      }
      
      // Ctrl/Cmd + V: Show visualization
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        setFooterTab('visualization')
        setShowFooter(true)
      }
      
      // F1: Show shortcuts help
      if (e.key === 'F1') {
        e.preventDefault()
        setShowShortcuts(true)
      }
      
      // Escape: Close dialogs
      if (e.key === 'Escape') {
        setShowTemplates(false)
        setShowBookmarks(false)
        setShowShortcuts(false)
        setShowExportDropdown(false)
        closeContextMenu()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [tabs, activeTabId, query])

  // Query validation
  const validateQuery = (sql: string) => {
    const errors: string[] = []
    const warnings: string[] = []
    
    if (!sql.trim()) {
      return { isValid: true, errors: [], warnings: [] }
    }
    
    // Basic SQL syntax validation
    const trimmedSql = sql.trim()
    
    // Check for balanced parentheses
    const openParens = (trimmedSql.match(/\(/g) || []).length
    const closeParens = (trimmedSql.match(/\)/g) || []).length
    if (openParens !== closeParens) {
      errors.push('Unbalanced parentheses')
    }
    
    // Check for balanced quotes
    const singleQuotes = (trimmedSql.match(/'/g) || []).length
    const doubleQuotes = (trimmedSql.match(/"/g) || []).length
    if (singleQuotes % 2 !== 0) {
      errors.push('Unclosed single quotes')
    }
    if (doubleQuotes % 2 !== 0) {
      errors.push('Unclosed double quotes')
    }
    
    // Check for common SQL keywords
    const upperSql = trimmedSql.toUpperCase()
    const hasSelect = upperSql.includes('SELECT')
    const hasFrom = upperSql.includes('FROM')
    
    if (hasSelect && !hasFrom) {
      warnings.push('SELECT statement without FROM clause')
    }
    
    // Check for dangerous operations
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER']
    const hasDangerous = dangerousKeywords.some(keyword => upperSql.includes(keyword))
    if (hasDangerous) {
      warnings.push('Query contains potentially dangerous operations')
    }
    
    // Check for missing semicolon
    if (!trimmedSql.endsWith(';') && trimmedSql.length > 10) {
      warnings.push('Consider adding semicolon at the end')
    }
    
    // Check for LIMIT in large queries
    if (hasSelect && !upperSql.includes('LIMIT') && !upperSql.includes('WHERE')) {
      warnings.push('Consider adding LIMIT clause for large result sets')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Validate query on change
  useEffect(() => {
    const validation = validateQuery(query)
    setQueryValidation(validation)
  }, [query])

  // Filter and search query history
  const getFilteredQueryHistory = () => {
    let filtered = queryHistory

    // Search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.query.toLowerCase().includes(searchLower) ||
        (item.userName && item.userName.toLowerCase().includes(searchLower)) ||
        (item.spaceName && item.spaceName.toLowerCase().includes(searchLower))
      )
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus)
    }

    // User filter
    if (filterUser !== 'all') {
      filtered = filtered.filter(item => item.userName === filterUser)
    }

    // Date range filter
    if (filterDateRange !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      filtered = filtered.filter(item => {
        if (!item.timestamp) return false
        const itemDate = new Date(item.timestamp)
        
        switch (filterDateRange) {
          case 'today':
            return itemDate >= today
          case 'week':
            return itemDate >= weekAgo
          case 'month':
            return itemDate >= monthAgo
          default:
            return true
        }
      })
    }

    return filtered
  }

  const getUniqueUsers = () => {
    const users = Array.from(new Set(queryHistory.map(item => item.userName).filter(Boolean)))
    return users
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
    
    // Calculate height based on mouse movement from initial position
    const deltaY = e.clientY - initialMouseY
    const newHeight = initialHeight - deltaY
    
    // Set minimum and maximum heights
    const minHeight = 150
    const maxHeight = window.innerHeight * 0.8
    
    // Ensure height is within bounds
    const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))
    
    // Update footer height immediately for maximum smoothness
    setFooterHeight(constrainedHeight)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  // Add event listeners for mouse move and up
  useEffect(() => {
    if (isResizing) {
      // Use high-priority event listeners for maximum smoothness
      document.addEventListener('mousemove', handleMouseMove, { 
        passive: true, 
        capture: true 
      })
      document.addEventListener('mouseup', handleMouseUp, { 
        passive: true, 
        capture: true 
      })
      
      // Optimize body styles for smooth dragging
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
  }, [isResizing, handleMouseMove])

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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Google BigQuery Style Header */}
      <div className="bg-white border-b border-gray-200">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                <Database className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">BigQuery</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>•</span>
              <span>SQL Workspace</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-8 px-3 text-sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
            <Button size="sm" variant="ghost" className="h-8 px-3 text-sm">
              <User className="h-4 w-4 mr-1" />
              Account
            </Button>
          </div>
        </div>

        {/* Main Toolbar */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Project/Dataset Selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <span>Project:</span>
                <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                  <SelectTrigger className="w-40 h-8 text-sm border-0 bg-transparent hover:bg-gray-100">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {spaces.map(space => (
                      <SelectItem key={space.id} value={space.id}>
                        {space.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Query Info */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Query Editor</span>
              <span>•</span>
              <span>{query.length} characters</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={executeQuery}
              disabled={isExecuting || !query.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700 h-8 px-4"
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
            
            <Button size="sm" variant="outline" onClick={saveCurrentTab} className="h-8 px-3">
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            
            <Button size="sm" variant="outline" onClick={loadQueryHistory} className="h-8 px-3">
              <History className="h-4 w-4 mr-1" />
              History
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
            
            {/* Query Validation Status */}
            {query.trim() && (
              <div className="flex items-center gap-2">
                {queryValidation.isValid ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs">Valid</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span className="text-xs">{queryValidation.errors.length} error(s)</span>
                  </div>
                )}
                {queryValidation.warnings.length > 0 && (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs">{queryValidation.warnings.length} warning(s)</span>
                  </div>
                )}
              </div>
            )}

            {currentResult && (
              <div className="relative">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 px-3"
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
                {showExportDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => { exportResults('csv'); setShowExportDropdown(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      CSV
                    </button>
                    <button
                      onClick={() => { exportResults('json'); setShowExportDropdown(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      JSON
                    </button>
                    <button
                      onClick={() => { exportResults('excel'); setShowExportDropdown(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Excel
                    </button>
                    <button
                      onClick={() => { exportResults('pdf'); setShowExportDropdown(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      PDF
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowFooter(!showFooter)} 
              className="h-8 px-3"
            >
              {showFooter ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showFooter ? 'Hide' : 'Show'} Results
            </Button>
          </div>
        </div>
      </div>

      {/* BigQuery Style Tab Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 cursor-pointer group ${
                  activeTabId === tab.id 
                    ? 'border-blue-500 bg-white' 
                    : 'border-transparent hover:border-gray-300'
                }`}
                onClick={() => switchTab(tab.id)}
              >
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {tab.name}
                </span>
                {tab.isSaved && (
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                )}
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(tab.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  >
                    <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                  </button>
                )}
              </div>
            ))}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={createNewTab}
              className="h-8 w-8 p-0 ml-2 text-gray-500 hover:text-gray-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Tab Actions */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-8 px-3 text-sm text-gray-600">
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button size="sm" variant="ghost" className="h-8 px-3 text-sm text-gray-600">
              <Bookmark className="h-4 w-4 mr-1" />
              Bookmark
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* BigQuery Style Left Sidebar */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
          {/* Explorer Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">Explorer</span>
              </div>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search datasets, tables..."
                className="pl-9 h-9 text-sm border-gray-300 focus:border-blue-500"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1">
              {/* Saved Queries Section */}
              <div>
                <button
                  className="flex items-center gap-2 w-full text-left hover:bg-gray-50 p-2 rounded-md"
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
                    <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  }
                  <Bookmark className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Saved queries</span>
                </button>
                {expandedSchemas.has('saved-queries') && (
                  <div className="ml-6 mt-1">
                    {renderQueryTree(queryFolders)}
                  </div>
                )}
              </div>

              {/* Projects/Datasets Section */}
              <div>
                <button
                  className="flex items-center gap-2 w-full text-left hover:bg-gray-50 p-2 rounded-md"
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
                    <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  }
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Projects</span>
                </button>
                {expandedSchemas.has('database-tables') && (
                  <div className="ml-6 mt-1 space-y-1">
                    {spaces.map(space => (
                      <div key={space.id} className="mb-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2 p-1 hover:bg-gray-50 rounded">
                          <Database className="h-4 w-4 text-gray-500" />
                          {space.name}
                        </div>
                        <div className="ml-6 space-y-1">
                          <div 
                            className="flex items-center gap-2 text-sm text-gray-600 p-1 hover:bg-gray-50 rounded cursor-pointer"
                            onContextMenu={(e) => handleTableRightClick(e, 'users', space.name)}
                          >
                            <Table className="h-4 w-4 text-gray-400" />
                            <span>users</span>
                            <span className="text-xs text-gray-400 ml-auto">table</span>
                          </div>
                          <div 
                            className="flex items-center gap-2 text-sm text-gray-600 p-1 hover:bg-gray-50 rounded cursor-pointer"
                            onContextMenu={(e) => handleTableRightClick(e, 'spaces', space.name)}
                          >
                            <Table className="h-4 w-4 text-gray-400" />
                            <span>spaces</span>
                            <span className="text-xs text-gray-400 ml-auto">table</span>
                          </div>
                          <div 
                            className="flex items-center gap-2 text-sm text-gray-600 p-1 hover:bg-gray-50 rounded cursor-pointer"
                            onContextMenu={(e) => handleTableRightClick(e, 'data_models', space.name)}
                          >
                            <Table className="h-4 w-4 text-gray-400" />
                            <span>data_models</span>
                            <span className="text-xs text-gray-400 ml-auto">table</span>
                          </div>
                          <div 
                            className="flex items-center gap-2 text-sm text-gray-600 p-1 hover:bg-gray-50 rounded cursor-pointer"
                            onContextMenu={(e) => handleTableRightClick(e, 'entities', space.name)}
                          >
                            <Table className="h-4 w-4 text-gray-400" />
                            <span>entities</span>
                            <span className="text-xs text-gray-400 ml-auto">table</span>
                          </div>
                          <div 
                            className="flex items-center gap-2 text-sm text-gray-600 p-1 hover:bg-gray-50 rounded cursor-pointer"
                            onContextMenu={(e) => handleTableRightClick(e, 'attributes', space.name)}
                          >
                            <Table className="h-4 w-4 text-gray-400" />
                            <span>attributes</span>
                            <span className="text-xs text-gray-400 ml-auto">table</span>
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

        {/* BigQuery Style Main Editor Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Query Editor */}
          <div className="flex-1 flex flex-col">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Query editor</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Standard SQL</span>
                  <span>•</span>
                  <span>Legacy SQL</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                  <Share className="h-3 w-3 mr-1" />
                  Share
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                </Button>
              </div>
            </div>
            
            {/* SQL Code Editor */}
            <div className="flex-1 p-4">
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
            </div>
          </div>
        </div>
        
        {/* Query Validation Panel */}
        {query.trim() && (queryValidation.errors.length > 0 || queryValidation.warnings.length > 0) && (
          <div className="border-t border-gray-200 bg-gray-50 p-3">
            <div className="space-y-2">
              {queryValidation.errors.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-red-600 font-medium text-sm mb-1">
                    <XCircle className="h-4 w-4" />
                    Errors ({queryValidation.errors.length})
                  </div>
                  <div className="space-y-1">
                    {queryValidation.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 ml-6">
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {queryValidation.warnings.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-yellow-600 font-medium text-sm mb-1">
                    <AlertCircle className="h-4 w-4" />
                    Warnings ({queryValidation.warnings.length})
                  </div>
                  <div className="space-y-1">
                    {queryValidation.warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-yellow-600 ml-6">
                        • {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BigQuery Style Results Panel */}
      {showFooter && (
        <div 
          className={`bg-white border-t border-gray-200 flex flex-col ${
            isResizing ? '' : 'transition-all duration-200 ease-in-out'
          }`}
          style={{ 
            height: `${footerHeight}px`,
            minHeight: '150px',
            maxHeight: '80vh',
            willChange: isResizing ? 'height' : 'auto'
          }}
          data-footer="true"
        >
          {/* Resize Handle */}
          <div 
            className={`h-2 cursor-ns-resize relative group border-t border-gray-300 ${
              isResizing 
                ? 'bg-blue-500' 
                : 'bg-gray-200 hover:bg-blue-400 transition-colors'
            }`}
            onMouseDown={handleMouseDown}
            title="Drag to resize footer height"
            style={{
              willChange: isResizing ? 'background-color' : 'auto'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-1">
                <div className={`w-1 h-1 rounded-full ${
                  isResizing 
                    ? 'bg-white' 
                    : 'bg-gray-400 group-hover:bg-blue-600'
                }`}></div>
                <div className={`w-1 h-1 rounded-full ${
                  isResizing 
                    ? 'bg-white' 
                    : 'bg-gray-400 group-hover:bg-blue-600'
                }`}></div>
                <div className={`w-1 h-1 rounded-full ${
                  isResizing 
                    ? 'bg-white' 
                    : 'bg-gray-400 group-hover:bg-blue-600'
                }`}></div>
              </div>
            </div>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4">
              <Tabs value={footerTab} onValueChange={(value) => setFooterTab(value as any)}>
                <TabsList className="flex gap-1">
                  <TabsTrigger value="results" className="flex items-center gap-2 px-3 py-1 text-sm">
                    <Table className="h-4 w-4" />
                    Results
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2 px-3 py-1 text-sm">
                    <History className="h-4 w-4" />
                    Query history
                  </TabsTrigger>
                  <TabsTrigger value="visualization" className="flex items-center gap-2 px-3 py-1 text-sm">
                    <BarChart3 className="h-4 w-4" />
                    Visualization
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex items-center gap-2">
              {currentResult && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{currentResult.results.length} rows</span>
                  {currentResult.executionTime && (
                    <span>• {formatDuration(currentResult.executionTime)}</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Height: {Math.round(footerHeight)}px</span>
                <div className="flex items-center gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 px-2 text-xs"
                    onClick={() => setFooterHeight(200)}
                    title="Small (200px)"
                  >
                    S
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 px-2 text-xs"
                    onClick={() => setFooterHeight(400)}
                    title="Medium (400px)"
                  >
                    M
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 px-2 text-xs"
                    onClick={() => setFooterHeight(600)}
                    title="Large (600px)"
                  >
                    L
                  </Button>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Query History</h3>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear History
                      </Button>
                    </div>
                  </div>
                  
                  {/* Search and Filter Controls */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search queries, users, or spaces..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 h-8 text-xs"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="running">Running</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={filterUser} onValueChange={setFilterUser}>
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          {getUniqueUsers().map(user => (
                            <SelectItem key={user} value={user!}>{user}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select value={filterDateRange} onValueChange={(value: any) => setFilterDateRange(value)}>
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="text-xs text-gray-500">
                        {getFilteredQueryHistory().length} of {queryHistory.length} queries
                      </div>
                    </div>
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <div className="space-y-2">
                      {getFilteredQueryHistory().map((historyItem) => (
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
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleBookmark(historyItem.id)
                                }}
                              >
                                <Bookmark className={`h-3 w-3 ${isBookmarked(historyItem.id) ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                              </Button>
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
                {currentResult ? (
                  <>
                    {/* Visualization Controls */}
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">Data Visualization</h3>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="chart-type" className="text-xs text-gray-600">Chart:</Label>
                            <Select value={chartType} onValueChange={setChartType}>
                              <SelectTrigger className="h-8 w-32 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BAR">Bar Chart</SelectItem>
                                <SelectItem value="LINE">Line Chart</SelectItem>
                                <SelectItem value="PIE">Pie Chart</SelectItem>
                                <SelectItem value="AREA">Area Chart</SelectItem>
                                <SelectItem value="SCATTER">Scatter Plot</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Label htmlFor="dimension" className="text-xs text-gray-600">X-Axis:</Label>
                            <Select 
                              value={chartConfig.dimensions[0] || ''} 
                              onValueChange={(value) => setChartConfig(prev => ({ 
                                ...prev, 
                                dimensions: [value] 
                              }))}
                            >
                              <SelectTrigger className="h-8 w-32 text-xs">
                                <SelectValue placeholder="Select dimension" />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableColumns().map(column => (
                                  <SelectItem key={column} value={column}>
                                    {column}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Label htmlFor="measure" className="text-xs text-gray-600">Y-Axis:</Label>
                            <Select 
                              value={chartConfig.measures[0] || ''} 
                              onValueChange={(value) => setChartConfig(prev => ({ 
                                ...prev, 
                                measures: [value] 
                              }))}
                            >
                              <SelectTrigger className="h-8 w-32 text-xs">
                                <SelectValue placeholder="Select measure" />
                              </SelectTrigger>
                              <SelectContent>
                                {getNumericColumns().map(column => (
                                  <SelectItem key={column} value={column}>
                                    {column}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Chart Visualization */}
                    <div className="flex-1 p-4">
                      {chartConfig.dimensions.length > 0 && chartConfig.measures.length > 0 ? (
                        <div className="h-full">
                          <ChartRenderer
                            type="chart"
                            chartType={chartType}
                            data={prepareChartData()}
                            dimensions={chartConfig.dimensions}
                            measures={chartConfig.measures}
                            filters={[]}
                            title={chartConfig.title}
                            className="h-full"
                          />
                        </div>
                      ) : (
                        <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Configure Visualization</h3>
                            <p className="text-sm text-gray-500 mb-4">Select a dimension (X-axis) and measure (Y-axis) to create a chart</p>
                            <div className="text-xs text-gray-400">
                              <p>Available columns: {getAvailableColumns().join(', ')}</p>
                              {getNumericColumns().length > 0 && (
                                <p>Numeric columns: {getNumericColumns().join(', ')}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 p-4">
                    <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium mb-2 text-gray-700">No Data to Visualize</h3>
                        <p className="text-sm text-gray-500">Run a query to see visualization options</p>
                      </div>
                    </div>
                  </div>
                )}
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

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-48"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
            {contextMenu.projectName}.{contextMenu.tableName}
          </div>
          
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            onClick={() => handleContextMenuAction('select')}
          >
            <Table className="h-4 w-4 text-gray-400" />
            Select all columns
          </button>
          
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            onClick={() => handleContextMenuAction('preview')}
          >
            <Eye className="h-4 w-4 text-gray-400" />
            Preview
          </button>
          
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            onClick={() => handleContextMenuAction('count')}
          >
            <Hash className="h-4 w-4 text-gray-400" />
            Count rows
          </button>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            onClick={() => handleContextMenuAction('describe')}
          >
            <Info className="h-4 w-4 text-gray-400" />
            Describe table
          </button>
          
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            onClick={() => handleContextMenuAction('schema')}
          >
            <Database className="h-4 w-4 text-gray-400" />
            Show schema
          </button>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            onClick={() => handleContextMenuAction('copy_name')}
          >
            <Copy className="h-4 w-4 text-gray-400" />
            Copy table name
          </button>
          
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            onClick={() => handleContextMenuAction('copy_path')}
          >
            <Copy className="h-4 w-4 text-gray-400" />
            Copy table path
          </button>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
            onClick={() => handleContextMenuAction('drop')}
          >
            <Trash2 className="h-4 w-4 text-red-400" />
            Drop table
          </button>
        </div>
      )}

      {/* Click outside to close context menu */}
      {contextMenu.visible && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeContextMenu}
        />
      )}

      {/* Query Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Query Templates</DialogTitle>
            <DialogDescription>
              Choose from common SQL query patterns to get started quickly
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6">
              {getTemplatesByCategory().map(({ category, templates }) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => insertTemplate(template)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                            Use
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                        <div className="bg-gray-50 rounded p-2 text-xs font-mono text-gray-700 max-h-20 overflow-hidden">
                          {template.sql}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplates(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bookmarks Dialog */}
      <Dialog open={showBookmarks} onOpenChange={setShowBookmarks}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Bookmarked Queries</DialogTitle>
            <DialogDescription>
              Your saved and favorite queries for quick access
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {getBookmarkedQueries().length > 0 ? (
                getBookmarkedQueries().map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(bookmark.status)}
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {bookmark.query.substring(0, 60)}...
                          </h4>
                          <p className="text-sm text-gray-600">
                            Space: {bookmark.spaceName || 'All Spaces'} • 
                            User: {bookmark.userName || 'Unknown'} • 
                            {bookmark.timestamp ? new Date(bookmark.timestamp).toLocaleString() : 'Unknown time'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 px-2 text-xs"
                          onClick={() => toggleBookmark(bookmark.id)}
                        >
                          <Bookmark className="h-3 w-3 text-yellow-500 fill-current" />
                          Remove
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            updateCurrentTabQuery(bookmark.query)
                            setShowBookmarks(false)
                          }}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Run
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-3 text-sm font-mono text-gray-700 max-h-32 overflow-hidden">
                      {bookmark.query}
                    </div>
                    
                    {bookmark.executionTime && (
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {formatDuration(bookmark.executionTime)}
                        </div>
                        {bookmark.size && (
                          <div className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatBytes(bookmark.size)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Bookmark className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2 text-gray-700">No Bookmarks Yet</h3>
                  <p className="text-sm text-gray-500">Bookmark queries from your history to see them here</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookmarks(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Quick keyboard shortcuts to improve your workflow
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Query Operations</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Run Query</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + Enter</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Save Query</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + S</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">New Tab</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + N</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Close Tab</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + W</kbd>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Navigation</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Show Templates</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + T</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Show Bookmarks</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + B</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Show History</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + H</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Show Results</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + R</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Show Visualization</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Ctrl + V</kbd>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">General</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Show Shortcuts Help</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">F1</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Close Dialogs</span>
                  <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Escape</kbd>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShortcuts(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}