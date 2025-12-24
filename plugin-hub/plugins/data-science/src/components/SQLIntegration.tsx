'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  Play, 
  RefreshCw, 
  Download, 
  Upload, 
  Table, 
  BarChart3, 
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface SQLIntegrationProps {
  onExecuteQuery?: (query: string, connectionId: string) => Promise<any>
  onSaveQuery?: (query: string, name: string) => void
  onLoadQuery?: (queryId: string) => string
  connections?: DatabaseConnection[]
  queries?: SavedQuery[]
}

interface DatabaseConnection {
  id: string
  name: string
  type: 'postgresql' | 'mysql' | 'sqlite' | 'bigquery' | 'snowflake'
  host: string
  port?: number
  database: string
  username: string
  status: 'connected' | 'disconnected' | 'error'
  lastConnected?: Date
}

interface SavedQuery {
  id: string
  name: string
  query: string
  description?: string
  tags: string[]
  createdAt: Date
  lastRun?: Date
  runCount: number
}

interface QueryResult {
  columns: string[]
  rows: any[][]
  rowCount: number
  executionTime: number
  error?: string
}

export function SQLIntegration({ 
  onExecuteQuery, 
  onSaveQuery, 
  onLoadQuery,
  connections = [],
  queries = []
}: SQLIntegrationProps) {
  const [activeConnection, setActiveConnection] = useState<string>('')
  const [query, setQuery] = useState<string>('')
  const [queryName, setQueryName] = useState<string>('')
  const [queryDescription, setQueryDescription] = useState<string>('')
  const [queryTags, setQueryTags] = useState<string>('')
  const [results, setResults] = useState<QueryResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [queryHistory, setQueryHistory] = useState<string[]>([])
  const [showQueryBuilder, setShowQueryBuilder] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [whereClause, setWhereClause] = useState<string>('')
  const [orderBy, setOrderBy] = useState<string>('')
  const [limit, setLimit] = useState<string>('100')

  const mockConnections: DatabaseConnection[] = [
    {
      id: 'conn-1',
      name: 'Production DB',
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'analytics',
      username: 'analyst',
      status: 'connected',
      lastConnected: new Date()
    },
    {
      id: 'conn-2',
      name: 'Data Warehouse',
      type: 'bigquery',
      host: 'bigquery.googleapis.com',
      database: 'analytics-warehouse',
      username: 'service-account',
      status: 'connected',
      lastConnected: new Date()
    },
    {
      id: 'conn-3',
      name: 'Staging DB',
      type: 'mysql',
      host: 'staging.example.com',
      port: 3306,
      database: 'staging',
      username: 'staging_user',
      status: 'disconnected'
    }
  ]

  const mockQueries: SavedQuery[] = [
    {
      id: 'query-1',
      name: 'User Activity Summary',
      query: 'SELECT user_id, COUNT(*) as activity_count, MAX(created_at) as last_activity FROM user_activities GROUP BY user_id ORDER BY activity_count DESC LIMIT 100',
      description: 'Get user activity summary with counts and last activity date',
      tags: ['users', 'activity', 'analytics'],
      createdAt: new Date(),
      lastRun: new Date(),
      runCount: 15
    },
    {
      id: 'query-2',
      name: 'Revenue by Month',
      query: 'SELECT DATE_TRUNC(\'month\', created_at) as month, SUM(amount) as revenue FROM transactions WHERE status = \'completed\' GROUP BY month ORDER BY month DESC',
      description: 'Monthly revenue breakdown',
      tags: ['revenue', 'transactions', 'monthly'],
      createdAt: new Date(),
      lastRun: new Date(),
      runCount: 8
    }
  ]

  const allConnections = connections.length > 0 ? connections : mockConnections
  const allQueries = queries.length > 0 ? queries : mockQueries

  const executeQuery = async () => {
    if (!query.trim()) {
      toast.error('Please enter a query to execute')
      return
    }

    if (!activeConnection) {
      toast.error('Please select a database connection')
      return
    }

    setIsExecuting(true)
    setQueryHistory(prev => [query, ...prev.slice(0, 9)]) // Keep last 10 queries

    try {
      const startTime = Date.now()
      
      // Simulate query execution
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      const executionTime = Date.now() - startTime
      
      // Mock results based on query type
      const mockResults: QueryResult = {
        columns: ['id', 'name', 'value', 'created_at'],
        rows: Array.from({ length: Math.floor(Math.random() * 100) + 10 }, (_, i) => [
          i + 1,
          `Record ${i + 1}`,
          (Math.random() * 1000).toFixed(2),
          new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        ]),
        rowCount: Math.floor(Math.random() * 100) + 10,
        executionTime
      }

      setResults(mockResults)
      toast.success(`Query executed successfully in ${executionTime}ms`)
    } catch (error) {
      setResults({
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Query execution failed'
      })
      toast.error('Query execution failed')
    } finally {
      setIsExecuting(false)
    }
  }

  const saveQuery = () => {
    if (!query.trim()) {
      toast.error('Please enter a query to save')
      return
    }

    if (!queryName.trim()) {
      toast.error('Please enter a query name')
      return
    }

    const tags = queryTags.split(',').map(tag => tag.trim()).filter(tag => tag)
    
    onSaveQuery?.(query, queryName)
    toast.success('Query saved successfully')
    
    // Reset form
    setQueryName('')
    setQueryDescription('')
    setQueryTags('')
  }

  const loadQuery = (queryId: string) => {
    const savedQuery = allQueries.find(q => q.id === queryId)
    if (savedQuery) {
      setQuery(savedQuery.query)
      setQueryName(savedQuery.name)
      setQueryDescription(savedQuery.description || '')
      setQueryTags(savedQuery.tags.join(', '))
      toast.success(`Loaded query: ${savedQuery.name}`)
    }
  }

  const buildQuery = () => {
    if (!selectedTable) {
      toast.error('Please select a table')
      return
    }

    let builtQuery = `SELECT ${selectedColumns.length > 0 ? selectedColumns.join(', ') : '*'} FROM ${selectedTable}`
    
    if (whereClause.trim()) {
      builtQuery += ` WHERE ${whereClause}`
    }
    
    if (orderBy.trim()) {
      builtQuery += ` ORDER BY ${orderBy}`
    }
    
    if (limit.trim()) {
      builtQuery += ` LIMIT ${limit}`
    }

    setQuery(builtQuery)
    setShowQueryBuilder(false)
    toast.success('Query built successfully')
  }

  const exportResults = (format: string) => {
    if (!results || results.rows.length === 0) {
      toast.error('No results to export')
      return
    }

    let content = ''
    let mimeType = ''
    let filename = ''

    switch (format) {
      case 'csv':
        content = [results.columns, ...results.rows].map(row => 
          row.map(cell => `"${cell}"`).join(',')
        ).join('\n')
        mimeType = 'text/csv'
        filename = 'query_results.csv'
        break
      case 'json':
        content = JSON.stringify({
          columns: results.columns,
          rows: results.rows,
          rowCount: results.rowCount,
          executionTime: results.executionTime
        }, null, 2)
        mimeType = 'application/json'
        filename = 'query_results.json'
        break
      default:
        toast.error('Unsupported export format')
        return
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    
    toast.success(`Results exported as ${format}`)
  }

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Database Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select value={activeConnection} onValueChange={setActiveConnection}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select connection" />
              </SelectTrigger>
              <SelectContent>
                {allConnections.map(conn => (
                  <SelectItem key={conn.id} value={conn.id}>
                    <div className="flex items-center space-x-2">
                      {getConnectionStatusIcon(conn.status)}
                      <span>{conn.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {conn.type.toUpperCase()}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Query Editor */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">SQL Query Editor</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQueryBuilder(!showQueryBuilder)}
                >
                  <Table className="h-4 w-4 mr-2" />
                  Query Builder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={executeQuery}
                  disabled={isExecuting || !query.trim() || !activeConnection}
                >
                  {isExecuting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Execute
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4">
            <div className="flex-1">
              <Label htmlFor="query">SQL Query</Label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-50 dark:border-gray-600"
                placeholder="Enter your SQL query here..."
              />
            </div>

            {/* Query Builder */}
            {showQueryBuilder && (
              <div className="border rounded-md p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
                <h4 className="font-semibold">Query Builder</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="table">Table</Label>
                    <Input
                      id="table"
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      placeholder="table_name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="columns">Columns (comma-separated)</Label>
                    <Input
                      id="columns"
                      value={selectedColumns.join(', ')}
                      onChange={(e) => setSelectedColumns(e.target.value.split(',').map(c => c.trim()).filter(c => c))}
                      placeholder="col1, col2, col3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="where">WHERE clause</Label>
                    <Input
                      id="where"
                      value={whereClause}
                      onChange={(e) => setWhereClause(e.target.value)}
                      placeholder="column = 'value'"
                    />
                  </div>
                  <div>
                    <Label htmlFor="orderBy">ORDER BY</Label>
                    <Input
                      id="orderBy"
                      value={orderBy}
                      onChange={(e) => setOrderBy(e.target.value)}
                      placeholder="column ASC"
                    />
                  </div>
                  <div>
                    <Label htmlFor="limit">LIMIT</Label>
                    <Input
                      id="limit"
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      placeholder="100"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={buildQuery} className="w-full">
                      Build Query
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Query Form */}
            <div className="border rounded-md p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
              <h4 className="font-semibold">Save Query</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="queryName">Query Name</Label>
                  <Input
                    id="queryName"
                    value={queryName}
                    onChange={(e) => setQueryName(e.target.value)}
                    placeholder="My Query"
                  />
                </div>
                <div>
                  <Label htmlFor="queryTags">Tags (comma-separated)</Label>
                  <Input
                    id="queryTags"
                    value={queryTags}
                    onChange={(e) => setQueryTags(e.target.value)}
                    placeholder="analytics, users, revenue"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="queryDescription">Description</Label>
                  <Input
                    id="queryDescription"
                    value={queryDescription}
                    onChange={(e) => setQueryDescription(e.target.value)}
                    placeholder="Brief description of this query"
                  />
                </div>
                <div className="col-span-2">
                  <Button onClick={saveQuery} disabled={!query.trim() || !queryName.trim()}>
                    <FileText className="h-4 w-4 mr-2" />
                    Save Query
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results and Saved Queries */}
        <div className="flex flex-col space-y-4">
          {/* Query Results */}
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Query Results</CardTitle>
                {results && results.rows.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportResults('csv')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportResults('json')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      JSON
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {results ? (
                results.error ? (
                  <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50 dark:bg-red-950/30">
                    <AlertCircle className="h-5 w-5 inline mr-2" />
                    {results.error}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>{results.rowCount} rows returned</span>
                      <span>Executed in {results.executionTime}ms</span>
                    </div>
                    <div className="border rounded-md overflow-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            {results.columns.map((column, index) => (
                              <th key={index} className="px-3 py-2 text-left font-medium">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {results.rows.slice(0, 100).map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-3 py-2">
                                  {typeof cell === 'string' && cell.length > 50 
                                    ? `${cell.substring(0, 50)}...` 
                                    : String(cell)
                                  }
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {results.rows.length > 100 && (
                        <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800">
                          Showing first 100 rows of {results.rowCount} total
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <Database className="h-12 w-12 mx-auto mb-4" />
                  <p>Execute a query to see results here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Queries */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Saved Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allQueries.map(query => (
                  <div
                    key={query.id}
                    className="p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => loadQuery(query.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{query.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {query.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {query.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                        <div>Run {query.runCount} times</div>
                        <div>{query.lastRun?.toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}