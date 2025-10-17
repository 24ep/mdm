'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Database, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Download,
  Filter,
  Search
} from 'lucide-react'
import { toast } from 'sonner'

interface DataPreviewProps {
  dataSource: {
    id: string
    name: string
    type: string
    connection_string?: string
    api_endpoint?: string
    file_path?: string
    query?: string
    headers?: any
  }
  onDataChange?: (data: any[]) => void
  onValidationChange?: (isValid: boolean) => void
}

export function DataPreview({ dataSource, onDataChange, onValidationChange }: DataPreviewProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [previewQuery, setPreviewQuery] = useState(dataSource.query || '')
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])

  // Mock data for demonstration
  const mockData = [
    { id: 1, name: 'Product A', category: 'Electronics', price: 299.99, sales: 150, date: '2024-01-01' },
    { id: 2, name: 'Product B', category: 'Clothing', price: 49.99, sales: 200, date: '2024-01-02' },
    { id: 3, name: 'Product C', category: 'Electronics', price: 199.99, sales: 75, date: '2024-01-03' },
    { id: 4, name: 'Product D', category: 'Books', price: 19.99, sales: 300, date: '2024-01-04' },
    { id: 5, name: 'Product E', category: 'Clothing', price: 79.99, sales: 120, date: '2024-01-05' },
    { id: 6, name: 'Product F', category: 'Electronics', price: 399.99, sales: 90, date: '2024-01-06' },
    { id: 7, name: 'Product G', category: 'Books', price: 24.99, sales: 180, date: '2024-01-07' },
    { id: 8, name: 'Product H', category: 'Clothing', price: 59.99, sales: 250, date: '2024-01-08' }
  ]

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For demo purposes, use mock data
      const fetchedData = mockData
      setData(fetchedData)
      setFilteredData(fetchedData)
      setValidationStatus('valid')
      onDataChange?.(fetchedData)
      onValidationChange?.(true)
      toast.success('Data loaded successfully')
    } catch (err) {
      setError('Failed to fetch data')
      setValidationStatus('invalid')
      onValidationChange?.(false)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setValidationStatus('valid')
      onValidationChange?.(true)
      toast.success('Connection successful')
    } catch (err) {
      setError('Connection failed')
      setValidationStatus('invalid')
      onValidationChange?.(false)
      toast.error('Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (!term) {
      setFilteredData(data)
      return
    }
    
    const filtered = data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(term.toLowerCase())
      )
    )
    setFilteredData(filtered)
  }

  const getColumnType = (column: string, sampleValue: any) => {
    if (typeof sampleValue === 'number') return 'number'
    if (sampleValue instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(sampleValue)) return 'date'
    return 'string'
  }

  const getValidationIcon = () => {
    switch (validationStatus) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getValidationMessage = () => {
    switch (validationStatus) {
      case 'valid':
        return 'Data source is valid and connected'
      case 'invalid':
        return 'Data source has issues'
      default:
        return 'Data source not tested'
    }
  }

  useEffect(() => {
    if (dataSource.id) {
      fetchData()
    }
  }, [dataSource.id])

  const columns = data.length > 0 ? Object.keys(data[0]) : []

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Data Preview</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {getValidationIcon()}
              <span className="text-sm text-muted-foreground">
                {getValidationMessage()}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="query">Query</TabsTrigger>
              <TabsTrigger value="schema">Schema</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search data..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchData}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testConnection}
                  disabled={loading}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Test
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column} className="font-medium">
                          <div className="flex items-center space-x-2">
                            <span>{column}</span>
                            <Badge variant="outline" className="text-xs">
                              {getColumnType(column, data[0]?.[column])}
                            </Badge>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        {columns.map((column) => (
                          <TableCell key={column} className="font-mono text-sm">
                            {row[column]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="text-sm text-muted-foreground">
                Showing {Math.min(10, filteredData.length)} of {filteredData.length} rows
                {searchTerm && ` (filtered from ${data.length} total)`}
              </div>
            </TabsContent>

            <TabsContent value="query" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="query">SQL Query</Label>
                <Textarea
                  id="query"
                  value={previewQuery}
                  onChange={(e) => setPreviewQuery(e.target.value)}
                  placeholder="SELECT * FROM your_table LIMIT 100"
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={fetchData} disabled={loading}>
                  <Play className="h-4 w-4 mr-2" />
                  Execute Query
                </Button>
                <Button variant="outline" onClick={() => setPreviewQuery(dataSource.query || '')}>
                  Reset
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="schema" className="space-y-4">
              <div className="space-y-2">
                <Label>Data Schema</Label>
                <div className="border rounded-lg p-4">
                  {columns.length > 0 ? (
                    <div className="space-y-2">
                      {columns.map((column) => (
                        <div key={column} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{column}</span>
                            <Badge variant="outline">
                              {getColumnType(column, data[0]?.[column])}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Sample: {String(data[0]?.[column] || 'N/A')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No data available to show schema
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
