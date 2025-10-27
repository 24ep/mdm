'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Database,
  Play,
  Square,
  Copy,
  Download,
  ChevronDown,
  ChevronRight,
  X,
  Edit,
  Eye,
  EyeOff,
  Table,
  BarChart3,
  FileText,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  Filter,
  Search,
  Plus,
  Trash2,
  Save,
  Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface SQLCellProps {
  id: string
  content: string
  output?: any
  status: 'idle' | 'running' | 'success' | 'error'
  executionTime?: number
  timestamp: Date
  isActive: boolean
  onContentChange: (content: string) => void
  onExecute: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onFocus: () => void
}

interface QueryBuilder {
  select: string[]
  from: string
  where: string[]
  groupBy: string[]
  orderBy: string[]
  limit: number
  having: string[]
}

export function SQLCell({
  id,
  content,
  output,
  status,
  executionTime,
  timestamp,
  isActive,
  onContentChange,
  onExecute,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onFocus
}: SQLCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showQueryBuilder, setShowQueryBuilder] = useState(false)
  const [showResults, setShowResults] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)
  const [queryHistory, setQueryHistory] = useState<string[]>([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1)
  const [availableTables, setAvailableTables] = useState<string[]>(['users', 'orders', 'products', 'categories'])
  const [availableColumns, setAvailableColumns] = useState<Record<string, string[]>>({
    users: ['id', 'name', 'email', 'created_at', 'status'],
    orders: ['id', 'user_id', 'product_id', 'quantity', 'total', 'created_at'],
    products: ['id', 'name', 'price', 'category_id', 'stock', 'created_at'],
    categories: ['id', 'name', 'description', 'created_at']
  })
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [queryBuilder, setQueryBuilder] = useState<QueryBuilder>({
    select: [],
    from: '',
    where: [],
    groupBy: [],
    orderBy: [],
    limit: 100,
    having: []
  })

  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isActive])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <PlayCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const handleContentChange = (newContent: string) => {
    onContentChange(newContent)
    
    // Add to query history
    if (newContent.trim() && newContent !== queryHistory[queryHistory.length - 1]) {
      setQueryHistory(prev => [...prev.slice(-9), newContent]) // Keep last 10 queries
      setCurrentHistoryIndex(queryHistory.length)
    }
  }

  const executeQuery = async () => {
    setIsExecuting(true)
    try {
      await onExecute()
      toast.success('Query executed successfully')
    } catch (error) {
      toast.error('Query execution failed')
    } finally {
      setIsExecuting(false)
    }
  }

  const buildQueryFromBuilder = () => {
    let query = 'SELECT '
    
    if (queryBuilder.select.length === 0) {
      query += '*'
    } else {
      query += queryBuilder.select.join(', ')
    }
    
    if (queryBuilder.from) {
      query += ` FROM ${queryBuilder.from}`
    }
    
    if (queryBuilder.where.length > 0) {
      query += ` WHERE ${queryBuilder.where.join(' AND ')}`
    }
    
    if (queryBuilder.groupBy.length > 0) {
      query += ` GROUP BY ${queryBuilder.groupBy.join(', ')}`
    }
    
    if (queryBuilder.having.length > 0) {
      query += ` HAVING ${queryBuilder.having.join(' AND ')}`
    }
    
    if (queryBuilder.orderBy.length > 0) {
      query += ` ORDER BY ${queryBuilder.orderBy.join(', ')}`
    }
    
    if (queryBuilder.limit > 0) {
      query += ` LIMIT ${queryBuilder.limit}`
    }
    
    query += ';'
    
    handleContentChange(query)
    setShowQueryBuilder(false)
  }

  const addSelectColumn = (column: string) => {
    if (!queryBuilder.select.includes(column)) {
      setQueryBuilder(prev => ({
        ...prev,
        select: [...prev.select, column]
      }))
    }
  }

  const removeSelectColumn = (column: string) => {
    setQueryBuilder(prev => ({
      ...prev,
      select: prev.select.filter(c => c !== column)
    }))
  }

  const addWhereCondition = () => {
    setQueryBuilder(prev => ({
      ...prev,
      where: [...prev.where, 'column = value']
    }))
  }

  const removeWhereCondition = (index: number) => {
    setQueryBuilder(prev => ({
      ...prev,
      where: prev.where.filter((_, i) => i !== index)
    }))
  }

  const updateWhereCondition = (index: number, condition: string) => {
    setQueryBuilder(prev => ({
      ...prev,
      where: prev.where.map((c, i) => i === index ? condition : c)
    }))
  }

  const getSQLTemplates = () => [
    {
      name: 'Select All',
      query: 'SELECT * FROM table_name;'
    },
    {
      name: 'Count Records',
      query: 'SELECT COUNT(*) as total FROM table_name;'
    },
    {
      name: 'Group By',
      query: 'SELECT column1, COUNT(*) as count FROM table_name GROUP BY column1;'
    },
    {
      name: 'Join Tables',
      query: 'SELECT t1.*, t2.column FROM table1 t1 JOIN table2 t2 ON t1.id = t2.table1_id;'
    },
    {
      name: 'Filter with WHERE',
      query: 'SELECT * FROM table_name WHERE column = "value";'
    },
    {
      name: 'Order Results',
      query: 'SELECT * FROM table_name ORDER BY column DESC;'
    },
    {
      name: 'Limit Results',
      query: 'SELECT * FROM table_name LIMIT 10;'
    }
  ]

  const insertTemplate = (template: string) => {
    handleContentChange(template)
    toast.success('Template inserted')
  }

  const formatSQL = () => {
    // Simple SQL formatting - in production, use a proper SQL formatter
    const formatted = content
      .replace(/\bSELECT\b/gi, 'SELECT')
      .replace(/\bFROM\b/gi, '\nFROM')
      .replace(/\bWHERE\b/gi, '\nWHERE')
      .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
      .replace(/\bORDER BY\b/gi, '\nORDER BY')
      .replace(/\bLIMIT\b/gi, '\nLIMIT')
      .replace(/\bJOIN\b/gi, '\nJOIN')
      .replace(/\bLEFT JOIN\b/gi, '\nLEFT JOIN')
      .replace(/\bRIGHT JOIN\b/gi, '\nRIGHT JOIN')
      .replace(/\bINNER JOIN\b/gi, '\nINNER JOIN')
    
    handleContentChange(formatted)
    toast.success('SQL formatted')
  }

  const copyQuery = () => {
    navigator.clipboard.writeText(content)
    toast.success('Query copied to clipboard')
  }

  const exportQuery = () => {
    const blob = new Blob([content], { type: 'text/sql' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `query_${Date.now()}.sql`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Query exported')
  }

  const renderResults = () => {
    if (!output) return null

    if (output.tables && output.tables.length > 0) {
      const table = output.tables[0]
      return (
        <div className="space-y-4">
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {table.data.length} rows returned • {table.columns.length} columns
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(JSON.stringify(table.data, null, 2))}
                className="h-7 px-2 text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy Data
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const csv = [table.columns.join(',')]
                    .concat(table.data.map(row => table.columns.map(col => row[col]).join(',')))
                    .join('\n')
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `query_results_${Date.now()}.csv`
                  link.click()
                  URL.revokeObjectURL(url)
                }}
                className="h-7 px-2 text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Data Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {table.columns.map((column: string, index: number) => (
                      <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.data.slice(0, 100).map((row: any, rowIndex: number) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {table.columns.map((column: string, colIndex: number) => (
                        <td key={colIndex} className="px-4 py-3 text-sm text-gray-900">
                          {row[column]?.toString() || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {table.data.length > 100 && (
              <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t">
                Showing first 100 of {table.data.length} rows
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="bg-gray-50 border rounded-lg p-3">
        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
          {JSON.stringify(output, null, 2)}
        </pre>
      </div>
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      executeQuery()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    } else if (e.key === 'ArrowUp' && e.ctrlKey) {
      e.preventDefault()
      if (currentHistoryIndex > 0) {
        const newIndex = currentHistoryIndex - 1
        setCurrentHistoryIndex(newIndex)
        onContentChange(queryHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown' && e.ctrlKey) {
      e.preventDefault()
      if (currentHistoryIndex < queryHistory.length - 1) {
        const newIndex = currentHistoryIndex + 1
        setCurrentHistoryIndex(newIndex)
        onContentChange(queryHistory[newIndex])
      }
    }
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      isActive ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">SQL</span>
            <Badge variant="outline" className="text-xs">
              {timestamp.toLocaleTimeString()}
            </Badge>
            {getStatusIcon(status)}
            {executionTime && (
              <Badge variant="secondary" className="text-xs">
                {executionTime}ms
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-6 w-6 p-0"
            >
              {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              className="h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyQuery}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={exportQuery}
              className="h-6 w-6 p-0"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onMoveUp}
              className="h-6 w-6 p-0"
            >
              <ChevronRight className="h-3 w-3 rotate-[-90deg]" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onMoveDown}
              className="h-6 w-6 p-0"
            >
              <ChevronRight className="h-3 w-3 rotate-90" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDuplicate}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              {/* SQL Toolbar */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowQueryBuilder(!showQueryBuilder)}
                  className="h-7 px-2 text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Query Builder
                </Button>
                
                <div className="w-px h-6 bg-gray-300" />
                
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={formatSQL}
                    className="h-7 px-2 text-xs"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Format
                  </Button>
                </div>
                
                <div className="flex-1" />
                
                <div className="text-xs text-gray-500">
                  Ctrl+Enter to execute
                </div>
              </div>

              {/* Query Builder */}
              {showQueryBuilder && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-blue-900">Query Builder</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={buildQueryFromBuilder}
                      className="h-7 px-2 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Build Query
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* SELECT */}
                    <div>
                      <Label className="text-xs font-medium text-blue-800">SELECT</Label>
                      <div className="mt-1 space-y-1">
                        <Select
                          value=""
                          onValueChange={addSelectColumn}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Add column..." />
                          </SelectTrigger>
                          <SelectContent>
                            {queryBuilder.from && availableColumns[queryBuilder.from]?.map(col => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {queryBuilder.select.map(col => (
                          <div key={col} className="flex items-center gap-1">
                            <span className="text-xs bg-white px-2 py-1 rounded border">{col}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeSelectColumn(col)}
                              className="h-5 w-5 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FROM */}
                    <div>
                      <Label className="text-xs font-medium text-blue-800">FROM</Label>
                      <Select
                        value={queryBuilder.from}
                        onValueChange={(value) => setQueryBuilder(prev => ({ ...prev, from: value }))}
                      >
                        <SelectTrigger className="h-7 text-xs mt-1">
                          <SelectValue placeholder="Select table..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTables.map(table => (
                            <SelectItem key={table} value={table}>{table}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* WHERE */}
                  <div className="mt-4">
                    <Label className="text-xs font-medium text-blue-800">WHERE</Label>
                    <div className="mt-1 space-y-1">
                      {queryBuilder.where.map((condition, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={condition}
                            onChange={(e) => updateWhereCondition(index, e.target.value)}
                            className="h-7 text-xs"
                            placeholder="column = value"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeWhereCondition(index)}
                            className="h-7 w-7 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addWhereCondition}
                        className="h-7 px-2 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Condition
                      </Button>
                    </div>
                  </div>

                  {/* LIMIT */}
                  <div className="mt-4">
                    <Label className="text-xs font-medium text-blue-800">LIMIT</Label>
                    <Input
                      type="number"
                      value={queryBuilder.limit}
                      onChange={(e) => setQueryBuilder(prev => ({ ...prev, limit: parseInt(e.target.value) || 0 }))}
                      className="h-7 text-xs mt-1 w-20"
                      min="0"
                    />
                  </div>
                </div>
              )}

              {/* SQL Templates */}
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">SQL Templates</h4>
                  <span className="text-xs text-gray-500">Click to insert</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {getSQLTemplates().map((template, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      onClick={() => insertTemplate(template.query)}
                      className="h-8 text-xs justify-start"
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* SQL Editor */}
              <div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={onFocus}
                  className="w-full min-h-[200px] p-3 border border-gray-200 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="-- SQL Query
SELECT 
    column1,
    column2,
    COUNT(*) as count
FROM table_name
WHERE condition = 'value'
GROUP BY column1, column2
ORDER BY count DESC
LIMIT 10;"
                  style={{
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}
                />
                
                {/* Editor Actions */}
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-gray-500">
                    Characters: {content.length} | Lines: {content.split('\n').length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="h-7 px-2 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={executeQuery}
                      disabled={isExecuting || !content.trim()}
                      className="h-7 px-3 text-xs"
                    >
                      {isExecuting ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Execute
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* SQL Display */}
              <div className="bg-gray-50 border rounded-lg p-3">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {content || '-- No SQL query written yet'}
                </pre>
              </div>

              {/* Cell Actions */}
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {content.length} characters • {content.split('\n').length} lines
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit SQL
                </Button>
              </div>
            </div>
          )}

          {/* Results */}
          {output && showResults && (
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">Query Results</h4>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowResults(!showResults)}
                    className="h-6 w-6 p-0"
                  >
                    {showResults ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              {renderResults()}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
