'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  Download, 
  FileText, 
  Database, 
  Cloud, 
  Link,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  Settings,
  Eye,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface DataImportExportProps {
  onDataImported?: (data: any[], metadata: any) => void
  onDataExported?: (format: string, data: any[]) => void
  className?: string
}

interface ImportSource {
  id: string
  name: string
  type: 'file' | 'database' | 'api' | 'cloud'
  icon: any
  description: string
}

interface ExportFormat {
  id: string
  name: string
  extension: string
  description: string
}

const importSources: ImportSource[] = [
  {
    id: 'file',
    name: 'File Upload',
    type: 'file',
    icon: Upload,
    description: 'Upload CSV, JSON, Excel, or Parquet files'
  },
  {
    id: 'database',
    name: 'Database',
    type: 'database',
    icon: Database,
    description: 'Connect to PostgreSQL, MySQL, MongoDB, etc.'
  },
  {
    id: 'api',
    name: 'API Endpoint',
    type: 'api',
    icon: Link,
    description: 'Import data from REST APIs or GraphQL'
  },
  {
    id: 'cloud',
    name: 'Cloud Storage',
    type: 'cloud',
    icon: Cloud,
    description: 'Import from AWS S3, Google Cloud, Azure'
  }
]

const exportFormats: ExportFormat[] = [
  { id: 'csv', name: 'CSV', extension: '.csv', description: 'Comma-separated values' },
  { id: 'json', name: 'JSON', extension: '.json', description: 'JavaScript Object Notation' },
  { id: 'excel', name: 'Excel', extension: '.xlsx', description: 'Microsoft Excel format' },
  { id: 'parquet', name: 'Parquet', extension: '.parquet', description: 'Columnar storage format' },
  { id: 'hdf5', name: 'HDF5', extension: '.h5', description: 'Hierarchical Data Format' },
  { id: 'pickle', name: 'Pickle', extension: '.pkl', description: 'Python serialization format' }
]

export function DataImportExport({ onDataImported, onDataExported, className }: DataImportExportProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import')
  const [selectedSource, setSelectedSource] = useState<string>('')
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [importedData, setImportedData] = useState<any[]>([])
  const [importMetadata, setImportMetadata] = useState<any>({})
  const [connectionConfig, setConnectionConfig] = useState<any>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportProgress(0)

    try {
      // Simulate file processing
      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 100)

      // Parse file based on extension
      const extension = file.name.split('.').pop()?.toLowerCase()
      let data: any[] = []
      let metadata: any = {}

      switch (extension) {
        case 'csv':
          data = await parseCSV(file)
          metadata = { type: 'csv', rows: data.length, columns: Object.keys(data[0] || {}) }
          break
        case 'json':
          data = await parseJSON(file)
          metadata = { type: 'json', rows: data.length, columns: Object.keys(data[0] || {}) }
          break
        case 'xlsx':
        case 'xls':
          data = await parseExcel(file)
          metadata = { type: 'excel', rows: data.length, columns: Object.keys(data[0] || {}) }
          break
        case 'parquet':
          data = await parseParquet(file)
          metadata = { type: 'parquet', rows: data.length, columns: Object.keys(data[0] || {}) }
          break
        default:
          throw new Error(`Unsupported file format: ${extension}`)
      }

      setImportedData(data)
      setImportMetadata(metadata)
      onDataImported?.(data, metadata)
      toast.success(`Successfully imported ${data.length} rows from ${file.name}`)
    } catch (error) {
      console.error('Import error:', error)
      toast.error(`Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  const parseCSV = async (file: File): Promise<any[]> => {
    const text = await file.text()
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      return row
    }).filter(row => Object.values(row).some(v => v !== ''))
  }

  const parseJSON = async (file: File): Promise<any[]> => {
    const text = await file.text()
    const data = JSON.parse(text)
    return Array.isArray(data) ? data : [data]
  }

  const parseExcel = async (file: File): Promise<any[]> => {
    // In a real implementation, you would use a library like xlsx
    // For now, we'll simulate the parsing
    return [
      { name: 'John', age: 30, city: 'New York' },
      { name: 'Jane', age: 25, city: 'Los Angeles' },
      { name: 'Bob', age: 35, city: 'Chicago' }
    ]
  }

  const parseParquet = async (file: File): Promise<any[]> => {
    // In a real implementation, you would use a library like parquetjs
    // For now, we'll simulate the parsing
    return [
      { id: 1, value: 100, category: 'A' },
      { id: 2, value: 200, category: 'B' },
      { id: 3, value: 300, category: 'A' }
    ]
  }

  const handleDatabaseConnection = async () => {
    setIsImporting(true)
    setImportProgress(0)

    try {
      // Simulate database connection
      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 15
        })
      }, 200)

      // Simulate data fetching
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const data = [
        { id: 1, name: 'Product A', price: 29.99, category: 'Electronics' },
        { id: 2, name: 'Product B', price: 19.99, category: 'Clothing' },
        { id: 3, name: 'Product C', price: 39.99, category: 'Electronics' }
      ]

      setImportedData(data)
      setImportMetadata({ type: 'database', rows: data.length, columns: Object.keys(data[0]) })
      onDataImported?.(data, { type: 'database', rows: data.length, columns: Object.keys(data[0]) })
      toast.success(`Successfully connected to database and imported ${data.length} rows`)
    } catch (error) {
      console.error('Database connection error:', error)
      toast.error('Failed to connect to database')
    } finally {
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  const handleAPIImport = async () => {
    setIsImporting(true)
    setImportProgress(0)

    try {
      // Simulate API call
      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 20
        })
      }, 150)

      // Simulate API response
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const data = [
        { id: 1, title: 'Post 1', content: 'Content 1', author: 'Author 1' },
        { id: 2, title: 'Post 2', content: 'Content 2', author: 'Author 2' },
        { id: 3, title: 'Post 3', content: 'Content 3', author: 'Author 3' }
      ]

      setImportedData(data)
      setImportMetadata({ type: 'api', rows: data.length, columns: Object.keys(data[0]) })
      onDataImported?.(data, { type: 'api', rows: data.length, columns: Object.keys(data[0]) })
      toast.success(`Successfully imported ${data.length} rows from API`)
    } catch (error) {
      console.error('API import error:', error)
      toast.error('Failed to import from API')
    } finally {
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  const handleExport = (format: string) => {
    if (!importedData.length) {
      toast.error('No data to export')
      return
    }

    try {
      const formatInfo = exportFormats.find(f => f.id === format)
      if (!formatInfo) return

      let content = ''
      let mimeType = ''

      switch (format) {
        case 'csv':
          content = convertToCSV(importedData)
          mimeType = 'text/csv'
          break
        case 'json':
          content = JSON.stringify(importedData, null, 2)
          mimeType = 'application/json'
          break
        case 'excel':
          // In a real implementation, you would use a library like xlsx
          content = convertToCSV(importedData)
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          break
        default:
          content = JSON.stringify(importedData, null, 2)
          mimeType = 'application/octet-stream'
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `data_export${formatInfo.extension}`
      link.click()
      URL.revokeObjectURL(url)

      onDataExported?.(format, importedData)
      toast.success(`Data exported as ${formatInfo.name}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    }
  }

  const convertToCSV = (data: any[]): string => {
    if (!data.length) return ''
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header] || '').join(','))
    ].join('\n')
    
    return csvContent
  }

  const clearData = () => {
    setImportedData([])
    setImportMetadata({})
    toast.success('Data cleared')
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Data
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          {/* Import Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Import Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {importSources.map((source) => (
                  <Card 
                    key={source.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedSource === source.id ? "ring-2 ring-blue-500" : ""
                    )}
                    onClick={() => setSelectedSource(source.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <source.icon className="h-8 w-8 text-blue-600" />
                        <div>
                          <h3 className="font-semibold">{source.name}</h3>
                          <p className="text-sm text-gray-600">{source.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Import Configuration */}
          {selectedSource && (
            <Card>
              <CardHeader>
                <CardTitle>Import Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSource === 'file' && (
                  <div className="space-y-4">
                    <div>
                      <Label>Select File</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.json,.xlsx,.xls,.parquet"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                        disabled={isImporting}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </div>
                  </div>
                )}

                {selectedSource === 'database' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Host</Label>
                        <Input placeholder="localhost" />
                      </div>
                      <div>
                        <Label>Port</Label>
                        <Input placeholder="5432" />
                      </div>
                      <div>
                        <Label>Database</Label>
                        <Input placeholder="mydb" />
                      </div>
                      <div>
                        <Label>Username</Label>
                        <Input placeholder="user" />
                      </div>
                    </div>
                    <Button onClick={handleDatabaseConnection} disabled={isImporting}>
                      <Database className="h-4 w-4 mr-2" />
                      Connect & Import
                    </Button>
                  </div>
                )}

                {selectedSource === 'api' && (
                  <div className="space-y-4">
                    <div>
                      <Label>API Endpoint</Label>
                      <Input placeholder="https://api.example.com/data" />
                    </div>
                    <div>
                      <Label>Headers (JSON)</Label>
                      <Input placeholder='{"Authorization": "Bearer token"}' />
                    </div>
                    <Button onClick={handleAPIImport} disabled={isImporting}>
                      <Link className="h-4 w-4 mr-2" />
                      Import from API
                    </Button>
                  </div>
                )}

                {selectedSource === 'cloud' && (
                  <div className="space-y-4">
                    <div>
                      <Label>Cloud Provider</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aws">AWS S3</SelectItem>
                          <SelectItem value="gcp">Google Cloud Storage</SelectItem>
                          <SelectItem value="azure">Azure Blob Storage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Bucket/Container</Label>
                      <Input placeholder="my-bucket" />
                    </div>
                    <div>
                      <Label>File Path</Label>
                      <Input placeholder="data/file.csv" />
                    </div>
                    <Button disabled>
                      <Cloud className="h-4 w-4 mr-2" />
                      Import from Cloud
                    </Button>
                  </div>
                )}

                {/* Progress */}
                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Importing data...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="w-full" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Imported Data Preview */}
          {importedData.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Imported Data Preview</CardTitle>
                  <Button variant="outline" size="sm" onClick={clearData}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Rows: {importedData.length}</span>
                    <span>Columns: {Object.keys(importedData[0] || {}).length}</span>
                    <span>Type: {importMetadata.type}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {Object.keys(importedData[0] || {}).map((key) => (
                          <th key={key} className="text-left p-2 font-medium">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importedData.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-b">
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex} className="p-2">{String(value)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importedData.length > 5 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Showing first 5 rows of {importedData.length} total rows
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
            </CardHeader>
            <CardContent>
              {importedData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No data available for export</p>
                  <p className="text-sm">Import some data first to export it</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exportFormats.map((format) => (
                      <Card 
                        key={format.id}
                        className="cursor-pointer hover:shadow-md transition-all"
                        onClick={() => handleExport(format.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-green-600" />
                            <div>
                              <h3 className="font-semibold">{format.name}</h3>
                              <p className="text-sm text-gray-600">{format.description}</p>
                              <p className="text-xs text-gray-500">{format.extension}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
