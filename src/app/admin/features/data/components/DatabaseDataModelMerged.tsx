'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Database, 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  Search,
  FolderPlus,
  Table,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Eye,
  EyeOff,
  GitBranch
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ERDDiagram from '@/components/erd/ERDDiagram'
import { DatabaseConnection } from '../types'
import { getDatabaseTypes, type Asset } from '@/lib/assets'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface DataModel {
  id: string
  name: string
  display_name?: string
  description?: string
  folder_id?: string
  icon?: string
  primary_color?: string
  tags?: string[]
  shared_spaces?: any[]
  created_at?: string
  updated_at?: string
}

interface Folder {
  id: string
  name: string
  description?: string
  parent_id?: string
  children?: Folder[]
  models?: DataModel[]
  created_at?: string
  updated_at?: string
}

interface DatabaseSchema {
  tables: Array<{
    name: string
    columns: Array<{
      name: string
      type: string
      nullable: boolean
      default?: string
    }>
  }>
  functions: string[]
}

export function DatabaseDataModelMerged() {
  // Database state
  const [connections, setConnections] = useState<DatabaseConnection[]>([])
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>('all')
  const [databaseTypes, setDatabaseTypes] = useState<Asset[]>([])
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false)

  // Data Model state
  const [models, setModels] = useState<DataModel[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<string[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  // View toggle - 'models' | 'schema' | 'erd'
  const [viewMode, setViewMode] = useState<'models' | 'schema' | 'erd'>('models')
  const [databaseSchema, setDatabaseSchema] = useState<DatabaseSchema | null>(null)
  const [isLoadingSchema, setIsLoadingSchema] = useState(false)
  
  // ERD state
  const [erdModels, setErdModels] = useState<any[]>([])
  const [erdRelationships, setErdRelationships] = useState<any[]>([])
  const [isLoadingERD, setIsLoadingERD] = useState(false)

  useEffect(() => {
    loadDatabaseTypes()
    loadConnections()
    loadModels()
    loadFolders()
  }, [])

  useEffect(() => {
    if (viewMode === 'schema' && selectedDatabase && selectedDatabase !== 'all') {
      loadDatabaseSchema(selectedDatabase)
    }
  }, [viewMode, selectedDatabase])

  useEffect(() => {
    if (viewMode === 'erd') {
      loadERDData()
    }
  }, [viewMode])

  const loadDatabaseTypes = async () => {
    try {
      const types = await getDatabaseTypes()
      setDatabaseTypes(types.filter((t) => t.isActive))
    } catch (error) {
      console.error('Error loading database types:', error)
    }
  }

  const loadConnections = async () => {
    setIsLoadingDatabases(true)
    try {
      const response = await fetch('/api/admin/database-connections')
      if (response.ok) {
        const data = await response.json()
        setConnections(data.connections.map((conn: any) => ({
          ...conn,
          lastConnected: conn.lastConnected ? new Date(conn.lastConnected) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading connections:', error)
      toast.error('Failed to load database connections')
    } finally {
      setIsLoadingDatabases(false)
    }
  }

  const loadModels = async () => {
    setIsLoadingModels(true)
    try {
      const res = await fetch(`/api/data-models`)
      const json = await res.json()
      setModels(json.dataModels || [])
    } catch (error) {
      console.error('Error loading models:', error)
      toast.error('Failed to load data models')
    } finally {
      setIsLoadingModels(false)
    }
  }

  const loadFolders = async () => {
    try {
      const res = await fetch('/api/folders?type=data_model')
      if (res.status === 503) {
        setFolders([])
        return
      }
      const json = await res.json().catch(() => ({}))
      setFolders(json.folders || [])
    } catch (e) {
      setFolders([])
    }
  }

  const loadDatabaseSchema = async (connectionId: string) => {
    setIsLoadingSchema(true)
    try {
      const response = await fetch(`/api/db/schema`)
      if (response.ok) {
        const data = await response.json()
        setDatabaseSchema(data)
      } else {
        toast.error('Failed to load database schema')
      }
    } catch (error) {
      console.error('Error loading schema:', error)
      toast.error('Failed to load database schema')
    } finally {
      setIsLoadingSchema(false)
    }
  }

  const loadERDData = async () => {
    setIsLoadingERD(true)
    try {
      // Load data models
      const modelsRes = await fetch('/api/data-models')
      const modelsData = await modelsRes.json()
      
      const modelsWithAttributes: any[] = []
      
      // Load attributes for each model
      for (const model of modelsData.dataModels || []) {
        try {
          const attrsRes = await fetch(`/api/data-models/${model.id}/attributes`)
          const attrsData = await attrsRes.json()
          
          modelsWithAttributes.push({
            ...model,
            attributes: (attrsData.attributes || []).map((attr: any) => ({
              id: attr.id,
              name: attr.name,
              display_name: attr.display_name || attr.name,
              type: attr.type || attr.data_type || 'TEXT',
              is_required: attr.is_required || false,
              is_unique: attr.is_unique || false,
              is_primary_key: attr.is_primary_key || false,
              is_foreign_key: attr.is_foreign_key || false,
              referenced_table: attr.referenced_table,
              referenced_column: attr.referenced_column
            }))
          })
        } catch (error) {
          console.error(`Error loading attributes for model ${model.id}:`, error)
          modelsWithAttributes.push({
            ...model,
            attributes: []
          })
        }
      }
      
      setErdModels(modelsWithAttributes)
      
      // Create relationships based on foreign keys
      const relationships: any[] = []
      modelsWithAttributes.forEach(model => {
        model.attributes.forEach((attr: any) => {
          if (attr.is_foreign_key && attr.referenced_table) {
            const targetModel = modelsWithAttributes.find((m: any) => 
              m.name.toLowerCase() === attr.referenced_table?.toLowerCase()
            )
            if (targetModel) {
              const targetAttr = targetModel.attributes.find((a: any) => 
                a.name.toLowerCase() === attr.referenced_column?.toLowerCase() ||
                a.is_primary_key
              )
              if (targetAttr) {
                relationships.push({
                  id: `${model.id}-${attr.id}-${targetModel.id}-${targetAttr.id}`,
                  fromModel: model.id,
                  toModel: targetModel.id,
                  fromAttribute: attr.id,
                  toAttribute: targetAttr.id,
                  type: 'one-to-many',
                  label: `${model.display_name || model.name} → ${targetModel.display_name || targetModel.name}`
                })
              }
            }
          }
        })
      })
      
      setErdRelationships(relationships)
    } catch (error) {
      console.error('Error loading ERD data:', error)
      toast.error('Failed to load ERD data')
    } finally {
      setIsLoadingERD(false)
    }
  }

  const getDatabaseIcon = (type: string) => {
    const asset = databaseTypes.find(t => t.code === type)
    if (asset?.icon) {
      return <span className="text-lg">{asset.icon}</span>
    }
    return <Database className="h-4 w-4 text-blue-500" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-gray-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  // Build tree structure for data models
  const treeStructure = useMemo(() => {
    const folderMap = new Map<string, Folder>()
    const rootFolders: Folder[] = []
    
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [], models: [] })
    })
    
    folders.forEach(folder => {
      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id)
        if (parent) {
          parent.children!.push(folderMap.get(folder.id)!)
        }
      } else {
        rootFolders.push(folderMap.get(folder.id)!)
      }
    })
    
    const filteredModels = searchValue
      ? models.filter(model => 
          (model.name || '').toLowerCase().includes(searchValue.toLowerCase()) ||
          (model.display_name || '').toLowerCase().includes(searchValue.toLowerCase()) ||
          (model.description || '').toLowerCase().includes(searchValue.toLowerCase())
        )
      : models
    
    filteredModels.forEach(model => {
      if (model.folder_id) {
        const folder = folderMap.get(model.folder_id)
        if (folder) {
          folder.models!.push(model)
        }
      }
    })
    
    return rootFolders
  }, [folders, models, searchValue])

  const rootModels = useMemo(() => {
    const filtered = searchValue
      ? models.filter(model => 
          (model.name || '').toLowerCase().includes(searchValue.toLowerCase()) ||
          (model.display_name || '').toLowerCase().includes(searchValue.toLowerCase()) ||
          (model.description || '').toLowerCase().includes(searchValue.toLowerCase())
        )
      : models
    return filtered.filter(model => !model.folder_id)
  }, [models, searchValue])

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    )
  }

  const renderModelItem = (model: DataModel) => (
    <div key={`model:${model.id}`} className="p-2 ml-6 rounded-md hover:bg-muted transition-colors cursor-pointer">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-blue-500" />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">
            {model.display_name || model.name}
          </div>
          {model.description && (
            <div className="text-xs text-muted-foreground truncate mt-1">
              {model.description}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderFolderItem = (folder: Folder, level = 0) => {
    const isExpanded = expandedFolders.includes(folder.id)
    
    return (
      <div key={`folder:${folder.id}`} className="select-none">
        <div
          className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors cursor-pointer"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => toggleFolder(folder.id)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleFolder(folder.id)
            }}
            className="p-1 hover:bg-background rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          
          <Folder className={cn("h-4 w-4", isExpanded ? "text-blue-500" : "text-muted-foreground")} />
          <span className="font-medium flex-1 truncate">{folder.name}</span>
          {folder.models && folder.models.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {folder.models.length}
            </Badge>
          )}
        </div>
        
        {isExpanded && (
          <div>
            {(folder.models || []).map(renderModelItem)}
            {(folder.children || []).map(childFolder => renderFolderItem(childFolder, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const selectedConnection = connections.find(c => c.id === selectedDatabase)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Databases & Data Models
          </h2>
          <p className="text-muted-foreground">
            Manage database connections and data models in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadConnections} disabled={isLoadingDatabases}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingDatabases ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Database List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Databases
            </CardTitle>
            <CardDescription>Select a database connection</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                <Button
                  variant={selectedDatabase === 'all' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedDatabase('all')}
                >
                  <Database className="h-4 w-4 mr-2" />
                  All Databases
                </Button>
                
                {isLoadingDatabases ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 mx-auto animate-spin mb-2" />
                    Loading databases...
                  </div>
                ) : connections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No database connections</p>
                  </div>
                ) : (
                  connections.map(connection => (
                    <Button
                      key={connection.id}
                      variant={selectedDatabase === connection.id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedDatabase(connection.id)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {getDatabaseIcon(connection.type)}
                        <div className="flex-1 text-left">
                          <div className="font-medium">{connection.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {connection.host}:{connection.port}
                          </div>
                        </div>
                        {getStatusIcon(connection.status)}
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Column - Data Models or Schema */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {viewMode === 'schema' ? (
                    <>
                      <Table className="h-5 w-5" />
                      Database Schema
                    </>
                  ) : viewMode === 'erd' ? (
                    <>
                      <GitBranch className="h-5 w-5" />
                      ERD Diagram
                    </>
                  ) : (
                    <>
                      <Folder className="h-5 w-5" />
                      Data Models
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {viewMode === 'schema'
                    ? selectedConnection 
                      ? `Schema for ${selectedConnection.name}`
                      : 'Select a database to view schema'
                    : viewMode === 'erd'
                    ? 'Entity Relationship Diagram - Visualize and manage data model relationships'
                    : 'Organize your data models in folders'
                  }
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="models">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        Models
                      </div>
                    </SelectItem>
                    <SelectItem value="schema" disabled={!selectedDatabase || selectedDatabase === 'all'}>
                      <div className="flex items-center gap-2">
                        <Table className="h-4 w-4" />
                        Schema
                      </div>
                    </SelectItem>
                    <SelectItem value="erd">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        ERD
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {viewMode === 'models' && (
                  <Button variant="outline" size="sm" onClick={loadModels}>
                    <RefreshCw className={`h-4 w-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
                  </Button>
                )}
                {viewMode === 'erd' && (
                  <Button variant="outline" size="sm" onClick={loadERDData}>
                    <RefreshCw className={`h-4 w-4 ${isLoadingERD ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'schema' ? (
              // Database Schema View
              <ScrollArea className="h-[600px]">
                {isLoadingSchema ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 mx-auto animate-spin mb-2" />
                    Loading schema...
                  </div>
                ) : !databaseSchema ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Table className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Select a database to view schema</p>
                  </div>
                ) : databaseSchema.tables.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Table className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No tables found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {databaseSchema.tables.map(table => (
                      <div key={table.name} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Table className="h-4 w-4 text-blue-500" />
                          <h3 className="font-semibold">{table.name}</h3>
                        </div>
                        <div className="space-y-2">
                          {table.columns.map(column => (
                            <div key={column.name} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium">{column.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {column.type}
                                </Badge>
                                {!column.nullable && (
                                  <Badge variant="secondary" className="text-xs">
                                    NOT NULL
                                  </Badge>
                                )}
                              </div>
                              {column.default && (
                                <span className="text-muted-foreground text-xs">
                                  Default: {column.default}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            ) : viewMode === 'erd' ? (
              // ERD Diagram View
              <div className="h-[600px] relative">
                {isLoadingERD ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 mx-auto animate-spin mb-2" />
                    Loading ERD diagram...
                  </div>
                ) : erdModels.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <GitBranch className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-lg font-medium">No data models found</p>
                    <p className="text-sm">Create data models to visualize relationships</p>
                  </div>
                ) : (
                  <ERDDiagram
                    models={erdModels.map(model => ({
                      id: model.id,
                      name: model.name,
                      display_name: model.display_name || model.name,
                      description: model.description,
                      attributes: model.attributes || [],
                      position: model.position
                    }))}
                    onUpdateModel={(updatedModel) => {
                      setErdModels(prev => prev.map(m => m.id === updatedModel.id ? { ...m, ...updatedModel } : m))
                    }}
                    onUpdateAttribute={async (modelId, attribute) => {
                      try {
                        const res = await fetch(`/api/data-models/${modelId}/attributes/${attribute.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(attribute)
                        })
                        if (res.ok) {
                          setErdModels(prev => prev.map(model => 
                            model.id === modelId 
                              ? { ...model, attributes: model.attributes.map((attr: any) => 
                                  attr.id === attribute.id ? attribute : attr
                                )}
                              : model
                          ))
                        }
                      } catch (error) {
                        console.error('Error updating attribute:', error)
                        toast.error('Failed to update attribute')
                      }
                    }}
                    onDeleteAttribute={async (modelId, attributeId) => {
                      try {
                        const res = await fetch(`/api/data-models/${modelId}/attributes/${attributeId}`, {
                          method: 'DELETE'
                        })
                        if (res.ok) {
                          setErdModels(prev => prev.map(model => 
                            model.id === modelId 
                              ? { ...model, attributes: model.attributes.filter((attr: any) => attr.id !== attributeId)}
                              : model
                          ))
                        }
                      } catch (error) {
                        console.error('Error deleting attribute:', error)
                        toast.error('Failed to delete attribute')
                      }
                    }}
                    onCreateRelationship={(relationship) => {
                      const newRelationship = {
                        ...relationship,
                        id: `${relationship.fromModel}-${relationship.fromAttribute}-${relationship.toModel}-${relationship.toAttribute}`
                      }
                      setErdRelationships(prev => [...prev, newRelationship])
                      toast.success('Relationship created')
                    }}
                    onUpdateRelationship={(relationship) => {
                      setErdRelationships(prev => prev.map(r => r.id === relationship.id ? relationship : r))
                      toast.success('Relationship updated')
                    }}
                    onDeleteRelationship={(relationshipId) => {
                      setErdRelationships(prev => prev.filter(r => r.id !== relationshipId))
                      toast.success('Relationship deleted')
                    }}
                  />
                )}
              </div>
            ) : (
              // Data Model View
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search models..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Tree View */}
                <ScrollArea className="h-[500px]">
                  {isLoadingModels ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-6 w-6 mx-auto animate-spin mb-2" />
                      Loading models...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Root Models */}
                      {rootModels.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 p-3 text-sm font-medium bg-muted rounded-lg">
                            <Database className="h-4 w-4" />
                            <span>Root Models ({rootModels.length})</span>
                          </div>
                          <div className="space-y-1">
                            {rootModels.map(renderModelItem)}
                          </div>
                        </div>
                      )}
                      
                      {/* Folders */}
                      {treeStructure.map(folder => renderFolderItem(folder))}

                      {/* Empty State */}
                      {models.length === 0 && folders.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-lg font-medium">No data models yet</p>
                          <p className="text-sm">Create your first data model to get started</p>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

