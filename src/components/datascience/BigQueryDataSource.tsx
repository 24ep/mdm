'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Database,
  Play,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileCode,
  BarChart3,
  Calculator,
  Brain,
  Eye,
  EyeOff,
  Settings,
  Plus,
  Trash2,
  Copy,
  Save,
  History
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useSpaces, useDataModels } from '@/hooks'

interface BigQueryDataSourceProps {
  onDataLoad: (data: any[], metadata: any) => void
  onQueryExecute: (query: string) => Promise<any>
}

export function BigQueryDataSource({ onDataLoad, onQueryExecute }: BigQueryDataSourceProps) {
  const [selectedSpace, setSelectedSpace] = useState('all')
  const [selectedTable, setSelectedTable] = useState('')
  const [customQuery, setCustomQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [queryHistory, setQueryHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [dataPreview, setDataPreview] = useState<any[]>([])
  const [metadata, setMetadata] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Fetch spaces and data models
  const { spaces, loading: spacesLoading, error: spacesError, refetch: refetchSpaces } = useSpaces()
  const { dataModels, loading: modelsLoading, error: modelsError } = useDataModels(selectedSpace)

  const executeQuery = async (query: string) => {
    if (!query.trim()) {
      toast.error('Please enter a query')
      return
    }

    setIsLoading(true)
    try {
      const result = await onQueryExecute(query)
      
      // Add to history
      setQueryHistory(prev => [query, ...prev.slice(0, 9)])
      
      // Update preview
      setDataPreview(result.data || [])
      setMetadata({
        columns: result.columns || [],
        rowCount: result.data?.length || 0,
        executionTime: result.executionTime || 0,
        query: query
      })
      
      // Load data into notebook
      onDataLoad(result.data || [], {
        source: 'bigquery',
        query: query,
        timestamp: new Date(),
        metadata: result
      })
      
      setShowPreview(true)
      toast.success(`Query executed successfully. ${result.data?.length || 0} rows returned.`)
    } catch (error) {
      toast.error('Query execution failed')
      console.error('Query error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTableData = async (tableName: string) => {
    const query = `SELECT * FROM \`${tableName}\` LIMIT 1000`
    setCustomQuery(query)
    await executeQuery(query)
  }

  const getTablePreview = async (tableName: string) => {
    const query = `SELECT * FROM \`${tableName}\` LIMIT 10`
    setIsLoading(true)
    try {
      const result = await onQueryExecute(query)
      setDataPreview(result.data || [])
      setMetadata({
        columns: result.columns || [],
        rowCount: result.data?.length || 0,
        executionTime: result.executionTime || 0,
        query: query
      })
      setShowPreview(true)
    } catch (error) {
      toast.error('Failed to preview table')
    } finally {
      setIsLoading(false)
    }
  }

  const getTableSchema = async (tableName: string) => {
    const query = `SELECT column_name, data_type, is_nullable FROM \`${tableName}.INFORMATION_SCHEMA.COLUMNS\` WHERE table_name = '${tableName}'`
    setIsLoading(true)
    try {
      const result = await onQueryExecute(query)
      return result.data || []
    } catch (error) {
      toast.error('Failed to get table schema')
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = () => {
    if (dataPreview.length === 0) return
    
    const csvContent = [
      metadata.columns.join(','),
      ...dataPreview.map((row: any) => 
        metadata.columns.map((col: string) => `"${row[col] || ''}"`).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'query_results.csv'
    link.click()
    
    URL.revokeObjectURL(url)
    toast.success('Data exported to CSV')
  }

  const copyQuery = async (query: string) => {
    const { copyToClipboard } = await import('@/lib/clipboard')
    const success = await copyToClipboard(query)
    if (success) {
      toast.success('Query copied to clipboard')
    } else {
      toast.error('Failed to copy query')
    }
  }

  const loadFromHistory = (query: string) => {
    setCustomQuery(query)
    setShowHistory(false)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          BigQuery Data Source
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Space Selection */}
        <div>
          <Label>Select Space</Label>
          <Select value={selectedSpace} onValueChange={setSelectedSpace}>
            <SelectTrigger>
              <SelectValue placeholder="Select space" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Spaces</SelectItem>
              {spaces.map((space) => (
                <SelectItem key={space.id} value={space.id}>
                  {space.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table Selection */}
        <div>
          <Label>Select Table</Label>
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger>
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent>
              {dataModels.map((model) => (
                <SelectItem key={model.id} value={model.name}>
                  <div className="flex items-center gap-2">
                    <span>{model.name}</span>
                    {model.description && (
                      <span className="text-xs text-muted-foreground">- {model.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => selectedTable && loadTableData(selectedTable)}
            disabled={!selectedTable || isLoading}
          >
            <Database className="h-3 w-3 mr-1" />
            Load Table
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => selectedTable && getTablePreview(selectedTable)}
            disabled={!selectedTable || isLoading}
          >
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-3 w-3 mr-1" />
            History
          </Button>
        </div>

        {/* Query History */}
        {showHistory && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Query History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {queryHistory.map((query, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="text-xs text-gray-500">#{index + 1}</span>
                    <code className="flex-1 text-xs truncate">{query}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => loadFromHistory(query)}
                      className="h-6 w-6 p-0"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyQuery(query)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {queryHistory.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No query history yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom Query */}
        <div>
          <Label>Custom SQL Query</Label>
          <textarea
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            className="w-full h-32 p-3 border border-border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="-- Enter your SQL query here
SELECT 
  column1,
  column2,
  COUNT(*) as count
FROM your_table
WHERE condition = 'value'
GROUP BY column1, column2
ORDER BY count DESC
LIMIT 100;"
          />
        </div>

        {/* Query Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => executeQuery(customQuery)}
              disabled={isLoading || !customQuery.trim()}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Execute Query
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCustomQuery('')}
            >
              Clear
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Ctrl+Enter to execute
            </span>
          </div>
        </div>

        {/* Data Preview */}
        {showPreview && metadata && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Data Preview</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {metadata.rowCount} rows
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {metadata.executionTime}ms
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportData}
                    className="h-6 px-2"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                    className="h-6 px-2"
                  >
                    {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-border rounded-lg">
                  <thead className="bg-muted">
                    <tr>
                      {metadata.columns.map((col: string) => (
                        <th key={col} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {dataPreview.slice(0, 10).map((row, index) => (
                      <tr key={index}>
                        {metadata.columns.map((col: string) => (
                          <td key={col} className="px-3 py-2 text-sm text-foreground">
                            {row[col]?.toString() || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dataPreview.length > 10 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground bg-muted">
                    Showing 10 of {dataPreview.length} rows
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Query Templates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quick Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCustomQuery(`SELECT COUNT(*) as total_rows FROM \`${selectedTable}\``)}
                disabled={!selectedTable}
                className="h-8 text-xs"
              >
                <Calculator className="h-3 w-3 mr-1" />
                Count Rows
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCustomQuery(`SELECT * FROM \`${selectedTable}\` LIMIT 10`)}
                disabled={!selectedTable}
                className="h-8 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Sample Data
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCustomQuery(`DESCRIBE \`${selectedTable}\``)}
                disabled={!selectedTable}
                className="h-8 text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                Table Schema
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCustomQuery(`SELECT column_name, data_type FROM \`${selectedTable}.INFORMATION_SCHEMA.COLUMNS\``)}
                disabled={!selectedTable}
                className="h-8 text-xs"
              >
                <Database className="h-3 w-3 mr-1" />
                Column Info
              </Button>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
