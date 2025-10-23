'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  Database, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  Edit, 
  Plus,
  ChevronDown,
  ChevronRight,
  Key,
  Link,
  Settings,
  FileText,
  BarChart3,
  Users,
  Calendar,
  Hash,
  Text,
  Check,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

interface TableColumn {
  id: string
  name: string
  type: string
  isNullable: boolean
  defaultValue?: string
  isPrimaryKey: boolean
  isForeignKey: boolean
  foreignKeyTable?: string
  foreignKeyColumn?: string
  description?: string
  constraints: string[]
}

interface TableInfo {
  id: string
  name: string
  schema: string
  description?: string
  rowCount: number
  size: number
  createdAt: Date
  updatedAt: Date
  spaceId: string
  spaceName: string
  columns: TableColumn[]
  indexes: any[]
  relationships: any[]
}

interface Space {
  id: string
  name: string
  slug: string
}

export function TableSchemaViewer() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [selectedSpace, setSelectedSpace] = useState('all')
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateTableDialog, setShowCreateTableDialog] = useState(false)
  const [newTableName, setNewTableName] = useState('')
  const [newTableDescription, setNewTableDescription] = useState('')

  useEffect(() => {
    loadSpaces()
    loadTables()
  }, [selectedSpace])

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

  const loadTables = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/schema/tables?spaceId=${selectedSpace}`)
      if (response.ok) {
        const data = await response.json()
        setTables(data.tables || [])
      }
    } catch (error) {
      console.error('Error loading tables:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshTables = () => {
    loadTables()
  }

  const toggleTableExpansion = (tableId: string) => {
    const newExpanded = new Set(expandedTables)
    if (newExpanded.has(tableId)) {
      newExpanded.delete(tableId)
    } else {
      newExpanded.add(tableId)
    }
    setExpandedTables(newExpanded)
  }

  const getColumnIcon = (type: string) => {
    if (type.includes('int') || type.includes('serial')) return <Hash className="h-4 w-4 text-blue-500" />
    if (type.includes('text') || type.includes('varchar') || type.includes('char')) return <Text className="h-4 w-4 text-green-500" />
    if (type.includes('bool')) return <Check className="h-4 w-4 text-purple-500" />
    if (type.includes('date') || type.includes('time')) return <Calendar className="h-4 w-4 text-orange-500" />
    return <FileText className="h-4 w-4 text-gray-500" />
  }

  const getTypeColor = (type: string) => {
    if (type.includes('int') || type.includes('serial')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (type.includes('text') || type.includes('varchar') || type.includes('char')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (type.includes('bool')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    if (type.includes('date') || type.includes('time')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredTables = tables.filter(table => {
    const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         table.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'tables' && !table.name.startsWith('_')) ||
                         (filterType === 'views' && table.name.startsWith('_'))
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Database Schema
          </h2>
          <p className="text-muted-foreground">
            View and manage database schemas across all spaces
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshTables} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showCreateTableDialog} onOpenChange={setShowCreateTableDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Table</DialogTitle>
                <DialogDescription>
                  Create a new table in the database
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="table-name">Table Name</Label>
                  <Input
                    id="table-name"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="users"
                  />
                </div>
                <div>
                  <Label htmlFor="table-description">Description</Label>
                  <Input
                    id="table-description"
                    value={newTableDescription}
                    onChange={(e) => setNewTableDescription(e.target.value)}
                    placeholder="User accounts table"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateTableDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // TODO: Implement table creation
                  setShowCreateTableDialog(false)
                  setNewTableName('')
                  setNewTableDescription('')
                }}>
                  Create Table
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tables..."
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                <SelectTrigger className="w-[200px]">
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
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="tables">Tables</SelectItem>
                  <SelectItem value="views">Views</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tables List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                Tables ({filteredTables.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {filteredTables.map(table => (
                    <div key={table.id} className="border rounded">
                      <div
                        className="p-3 cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => {
                          setSelectedTable(table)
                          toggleTableExpansion(table.id)
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {expandedTables.has(table.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{table.name}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {table.rowCount.toLocaleString()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {table.spaceName} • {formatFileSize(table.size)}
                        </div>
                      </div>
                      
                      {expandedTables.has(table.id) && (
                        <div className="border-t bg-muted/50 p-3">
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium">Schema:</span> {table.schema}
                            </div>
                            {table.description && (
                              <div className="text-sm text-muted-foreground">
                                {table.description}
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{table.columns.length} columns</span>
                              <span>{table.indexes.length} indexes</span>
                              <span>{table.relationships.length} relationships</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Table Details */}
        <div className="lg:col-span-2">
          {selectedTable ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        {selectedTable.name}
                      </CardTitle>
                      <CardDescription>
                        {selectedTable.schema} • {selectedTable.spaceName}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View Data
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Rows:</span> {selectedTable.rowCount.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span> {formatFileSize(selectedTable.size)}
                    </div>
                    <div>
                      <span className="font-medium">Columns:</span> {selectedTable.columns.length}
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span> {selectedTable.updatedAt.toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="columns" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="columns">Columns</TabsTrigger>
                  <TabsTrigger value="indexes">Indexes</TabsTrigger>
                  <TabsTrigger value="relationships">Relationships</TabsTrigger>
                  <TabsTrigger value="sql">SQL</TabsTrigger>
                </TabsList>

                <TabsContent value="columns" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Columns ({selectedTable.columns.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedTable.columns.map(column => (
                          <div key={column.id} className="flex items-center gap-3 p-3 border rounded">
                            <div className="flex items-center gap-2">
                              {getColumnIcon(column.type)}
                              <span className="font-medium">{column.name}</span>
                              {column.isPrimaryKey && (
                                <Badge variant="secondary" className="text-xs">
                                  <Key className="h-3 w-3 mr-1" />
                                  PK
                                </Badge>
                              )}
                              {column.isForeignKey && (
                                <Badge variant="outline" className="text-xs">
                                  <Link className="h-3 w-3 mr-1" />
                                  FK
                                </Badge>
                              )}
                            </div>
                            <div className="flex-1">
                              <Badge className={`text-xs ${getTypeColor(column.type)}`}>
                                {column.type}
                              </Badge>
                              {!column.isNullable && (
                                <Badge variant="destructive" className="text-xs ml-2">
                                  NOT NULL
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {column.description || 'No description'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="indexes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Indexes ({selectedTable.indexes.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedTable.indexes.length > 0 ? (
                          selectedTable.indexes.map((index, idx) => (
                            <div key={idx} className="p-3 border rounded">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{index.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {index.type}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Columns: {index.columns.join(', ')}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No indexes found
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="relationships" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Relationships ({selectedTable.relationships.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedTable.relationships.length > 0 ? (
                          selectedTable.relationships.map((rel, idx) => (
                            <div key={idx} className="p-3 border rounded">
                              <div className="flex items-center gap-2">
                                <Link className="h-4 w-4" />
                                <span className="font-medium">{rel.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {rel.type}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {rel.fromTable}.{rel.fromColumn} → {rel.toTable}.{rel.toColumn}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No relationships found
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sql" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Table Definition</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded font-mono text-sm overflow-x-auto">
                        <pre>{`CREATE TABLE ${selectedTable.name} (
${selectedTable.columns.map(col => 
  `  ${col.name} ${col.type}${!col.isNullable ? ' NOT NULL' : ''}${col.defaultValue ? ` DEFAULT ${col.defaultValue}` : ''}${col.isPrimaryKey ? ' PRIMARY KEY' : ''}`
).join(',\n')}
);`}</pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Table</h3>
                <p className="text-muted-foreground">
                  Choose a table from the list to view its schema and details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
