'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, Database, Table, Play, Activity } from 'lucide-react'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { InstanceService, InfrastructureInstance } from '@/features/infrastructure/types'

interface PostgreSQLManagementUIProps {
  service: InstanceService
  instance: InfrastructureInstance
  config: any
  onConfigUpdate: (newConfig: any) => void
}

interface DatabaseTable {
  name: string
  schema: string
  rows: number
  size: string
}

interface DatabaseStats {
  totalDatabases: number
  totalTables: number
  totalSize: string
  activeConnections: number
}

export function PostgreSQLManagementUI({
  service,
  instance,
  config,
  onConfigUpdate,
}: PostgreSQLManagementUIProps) {
  const [databases, setDatabases] = useState<string[]>([])
  const [tables, setTables] = useState<DatabaseTable[]>([])
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null)
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;')
  const [queryResult, setQueryResult] = useState<any>(null)
  const [executing, setExecuting] = useState(false)

  useEffect(() => {
    loadData()
  }, [service, config])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([loadDatabases(), loadStats()])
    } catch (err: any) {
      setError(err.message || 'Failed to load PostgreSQL data')
    } finally {
      setLoading(false)
    }
  }

  const loadDatabases = async () => {
    try {
      // In a real implementation, this would query PostgreSQL
      const mockDatabases = ['postgres', 'mydb', 'testdb']
      setDatabases(mockDatabases)
      if (!selectedDatabase && mockDatabases.length > 0) {
        setSelectedDatabase(mockDatabases[0])
        loadTables(mockDatabases[0])
      }
    } catch (err: any) {
      console.error('Error loading databases:', err)
      setError(err.message)
    }
  }

  const loadTables = async (database: string) => {
    try {
      setSelectedDatabase(database)
      // In a real implementation, this would query PostgreSQL
      const mockTables: DatabaseTable[] = [
        { name: 'users', schema: 'public', rows: 1250, size: '2.5 MB' },
        { name: 'orders', schema: 'public', rows: 5430, size: '8.2 MB' },
        { name: 'products', schema: 'public', rows: 890, size: '1.1 MB' },
      ]
      setTables(mockTables)
    } catch (err: any) {
      console.error('Error loading tables:', err)
    }
  }

  const loadStats = async () => {
    try {
      // Simulated stats - in production, this would query PostgreSQL
      const mockStats: DatabaseStats = {
        totalDatabases: 3,
        totalTables: 15,
        totalSize: '125.5 MB',
        activeConnections: 8,
      }
      setStats(mockStats)
    } catch (err: any) {
      console.error('Error loading stats:', err)
    }
  }

  const executeQuery = async () => {
    if (!query.trim()) {
      return
    }

    setExecuting(true)
    setQueryResult(null)

    try {
      // In production, this would execute the query through the service
      // For now, we'll simulate a result
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      const mockResult = {
        columns: ['id', 'name', 'email', 'created_at'],
        rows: [
          [1, 'John Doe', 'john@example.com', '2024-01-01'],
          [2, 'Jane Smith', 'jane@example.com', '2024-01-02'],
        ],
        rowCount: 2,
        executionTime: '15ms',
      }
      setQueryResult(mockResult)
    } catch (err: any) {
      setQueryResult({
        error: err.message || 'Query execution failed',
      })
    } finally {
      setExecuting(false)
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="p-4 border border-destructive rounded-lg">
        <p className="text-destructive">Error: {error}</p>
        <Button onClick={loadData} variant="outline" className="mt-2">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="w-full">
        <Tabs defaultValue="databases">
          <TabsList>
          <TabsTrigger value="databases">Databases & Tables</TabsTrigger>
          <TabsTrigger value="query">Query Editor</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="databases" className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Databases</h3>
            <Button onClick={loadDatabases} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="flex gap-2">
            {databases.map((db) => (
              <Button
                key={db}
                variant={selectedDatabase === db ? 'default' : 'outline'}
                onClick={() => loadTables(db)}
              >
                <Database className="h-4 w-4 mr-2" />
                {db}
              </Button>
            ))}
          </div>

          {selectedDatabase && (
            <div>
              <h3 className="font-semibold mb-2">Tables in {selectedDatabase}</h3>
              <div className="border rounded-lg divide-y">
                {tables.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No tables found
                  </div>
                ) : (
                  tables.map((table) => (
                    <div key={table.name} className="p-4 hover:bg-accent">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Table className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{table.name}</span>
                          <Badge variant="outline">{table.schema}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{table.rows.toLocaleString()} rows</span>
                          <span>{table.size}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <div>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter SQL query..."
              className="font-mono text-sm min-h-[200px]"
            />
          </div>

          <Button onClick={executeQuery} disabled={executing || !query.trim()}>
            {executing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Execute Query
              </>
            )}
          </Button>

          {queryResult && (
            <Card>
              <CardHeader>
                <CardTitle>Query Results</CardTitle>
                {queryResult.executionTime && (
                  <CardDescription>
                    Execution time: {queryResult.executionTime}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {queryResult.error ? (
                  <div className="text-destructive">{queryResult.error}</div>
                ) : (
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {queryResult.columns?.map((col: string) => (
                            <th key={col} className="text-left p-2">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.rows?.map((row: any[], idx: number) => (
                          <tr key={idx} className="border-b">
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="p-2">
                                {String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {queryResult.rowCount !== undefined && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {queryResult.rowCount} row(s) returned
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Databases</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDatabases}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Tables</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTables}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Size</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSize}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Active Connections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeConnections}</div>
                </CardContent>
              </Card>
            </div>
          )}

          <Button onClick={loadStats} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Statistics
          </Button>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

