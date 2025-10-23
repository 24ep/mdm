'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Play, 
  Stop, 
  Download, 
  Copy, 
  RefreshCw,
  Clock,
  Database,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

interface QueryExecutionResult {
  success: boolean
  data?: any[]
  columns?: string[]
  rowCount?: number
  executionTime?: number
  error?: string
  query?: string
}

interface SQLQueryExecutorProps {
  queryId: string
  sql: string
  onExecutionComplete?: (result: QueryExecutionResult) => void
}

export function SQLQueryExecutor({ 
  queryId, 
  sql, 
  onExecutionComplete 
}: SQLQueryExecutorProps) {
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState<QueryExecutionResult | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<string>('')
  const [limit, setLimit] = useState<number>(100)
  const [connections] = useState([
    { id: 'default', name: 'Default Database', type: 'postgresql' },
    { id: 'conn-1', name: 'Sales Database', type: 'mysql' },
    { id: 'conn-2', name: 'Analytics Database', type: 'postgresql' }
  ])

  const executeQuery = async () => {
    setIsExecuting(true)
    setResult(null)

    try {
      const response = await fetch(`/api/admin/sql-queries/${queryId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql,
          connectionId: selectedConnection || undefined,
          options: {
            limit,
            timeout: 30000 // 30 seconds
          }
        })
      })

      const executionResult = await response.json()
      setResult(executionResult)
      onExecutionComplete?.(executionResult)
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to execute query'
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const exportResults = () => {
    if (!result?.data) return

    const csvContent = [
      result.columns?.join(',') || '',
      ...result.data.map(row => 
        result.columns?.map(col => row[col] || '').join(',') || ''
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `query-${queryId}-results.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyResults = () => {
    if (!result?.data) return

    const csvContent = [
      result.columns?.join('\t') || '',
      ...result.data.map(row => 
        result.columns?.map(col => row[col] || '').join('\t') || ''
      )
    ].join('\n')

    navigator.clipboard.writeText(csvContent)
  }

  return (
    <div className="space-y-4">
      {/* Execution Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Query Execution
          </CardTitle>
          <CardDescription>
            Execute the SQL query and view results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="connection">Database Connection</Label>
              <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select connection" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map(conn => (
                    <SelectItem key={conn.id} value={conn.id}>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        {conn.name}
                        <Badge variant="outline" className="text-xs">
                          {conn.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="limit">Row Limit</Label>
              <Input
                id="limit"
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                min={1}
                max={10000}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={executeQuery} 
                disabled={isExecuting}
                className="w-full"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute Query
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <CardTitle>
                  {result.success ? 'Query Executed Successfully' : 'Query Execution Failed'}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {result.success && result.data && (
                  <>
                    <Button size="sm" variant="outline" onClick={exportResults}>
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                    <Button size="sm" variant="outline" onClick={copyResults}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" onClick={executeQuery} disabled={isExecuting}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Re-run
                </Button>
              </div>
            </div>
            <CardDescription>
              {result.success ? (
                <>
                  {result.rowCount} rows returned in {result.executionTime}ms
                </>
              ) : (
                result.error
              )}
            </CardDescription>
          </CardHeader>
          {result.success && result.data && (
            <CardContent>
              <div className="space-y-4">
                {/* Results Table */}
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-96">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {result.columns?.map((column, index) => (
                            <th key={index} className="px-4 py-2 text-left font-medium">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.data.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-t">
                            {result.columns?.map((column, colIndex) => (
                              <td key={colIndex} className="px-4 py-2">
                                {row[column] !== null && row[column] !== undefined 
                                  ? String(row[column]) 
                                  : <span className="text-muted-foreground italic">null</span>
                                }
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>

                {/* Execution Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {result.executionTime}ms
                  </div>
                  <div className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    {result.rowCount} rows
                  </div>
                  <div className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    {result.columns?.length} columns
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
