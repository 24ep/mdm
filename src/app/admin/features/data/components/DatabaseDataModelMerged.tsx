'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Database, 
  Folder, 
  ChevronRight, 
  ChevronDown,
  Search,
  Table,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GitBranch,
  MoreVertical,
  Sparkles
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ERDDiagram from '@/components/erd/ERDDiagram'
import { DatabaseConnection } from '../types'
import { getDatabaseTypes, type Asset } from '@/lib/assets'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { BrandingConfig } from '@/app/admin/features/system/types'

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
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null)
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

  // Theme config state
  const [themeConfig, setThemeConfig] = useState<BrandingConfig | null>(null)

  useEffect(() => {
    loadDatabaseTypes()
    loadConnections()
    loadModels()
    loadFolders()
    loadThemeConfig()
  }, [])

  const loadThemeConfig = async () => {
    try {
      const response = await fetch('/api/themes')
      if (response.ok) {
        const data = await response.json()
        const activeTheme = data.themes?.find((t: any) => t.isActive)
        if (activeTheme?.config) {
          setThemeConfig(activeTheme.config as BrandingConfig)
        }
      }
    } catch (error) {
      console.error('Error loading theme config:', error)
    }
  }

  useEffect(() => {
    if (viewMode === 'schema' && selectedDatabase) {
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
        // Auto-select first database if none selected
        if (!selectedDatabase && data.connections.length > 0) {
          setSelectedDatabase(data.connections[0].id)
        }
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
      const modelsRes = await fetch('/api/data-models')
      const modelsData = await modelsRes.json()
      
      const modelsWithAttributes: any[] = []
      
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
      return <span className="text-base">{asset.icon}</span>
    }
    return <Database className="h-4 w-4 text-blue-500" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
      case 'disconnected':
        return <div className="h-2 w-2 rounded-full bg-gray-400" />
      case 'error':
        return <div className="h-2 w-2 rounded-full bg-red-500" />
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
    <div 
      key={`model:${model.id}`} 
      className="group flex items-center gap-3 px-3 py-2.5 ml-6 rounded-lg transition-all duration-200 cursor-pointer"
      style={{
        backgroundColor: 'transparent',
        borderRadius: borderRadius,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${primaryColor} 3%, transparent)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      <div 
        className="flex items-center justify-center w-5 h-5 rounded-md"
        style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)` }}
      >
        <Database className="h-3.5 w-3.5" style={{ color: primaryColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div 
          className="font-medium text-sm truncate"
          style={{ color: bodyText }}
        >
          {model.display_name || model.name}
        </div>
        {model.description && (
          <div 
            className="text-xs truncate mt-0.5"
            style={{ color: bodyText, opacity: 0.6 }}
          >
            {model.description}
          </div>
        )}
      </div>
    </div>
  )

  const renderFolderItem = (folder: Folder, level = 0) => {
    const isExpanded = expandedFolders.includes(folder.id)
    
    return (
      <div key={`folder:${folder.id}`} className="select-none">
        <div
          className={cn(
            "group flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
            level === 0 && "font-medium"
          )}
          style={{ 
            paddingLeft: `${level * 16 + 12}px`,
            backgroundColor: 'transparent',
            borderRadius: borderRadius,
          }}
          onClick={() => toggleFolder(folder.id)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${primaryColor} 3%, transparent)`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleFolder(folder.id)
            }}
            className="p-0.5 hover:bg-white/20 dark:hover:bg-white/10 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" style={{ color: bodyText, opacity: 0.6 }} />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" style={{ color: bodyText, opacity: 0.6 }} />
            )}
          </button>
          
          <Folder 
            className="h-4 w-4 transition-colors"
            style={{ color: isExpanded ? primaryColor : bodyText, opacity: isExpanded ? 1 : 0.6 }}
          />
          <span 
            className="flex-1 truncate text-sm"
            style={{ color: bodyText }}
          >
            {folder.name}
          </span>
          {folder.models && folder.models.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {folder.models.length}
            </Badge>
          )}
        </div>
        
        {isExpanded && (
          <div className="mt-1">
            {(folder.models || []).map(renderModelItem)}
            {(folder.children || []).map(childFolder => renderFolderItem(childFolder, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const selectedConnection = connections.find(c => c.id === selectedDatabase)

  // Get theme colors - precise engineering approach
  const primaryColor = themeConfig?.primaryColor || '#007AFF'
  const uiBg = themeConfig?.uiBackgroundColor || themeConfig?.topMenuBackgroundColor || '#ffffff'
  const uiBorder = themeConfig?.uiBorderColor || 'rgba(0, 0, 0, 0.06)'
  const bodyText = themeConfig?.bodyTextColor || '#0F172A'
  const bodyBg = themeConfig?.bodyBackgroundColor || '#FAFAFA'
  
  // Precise border styling
  const borderColor = uiBorder
  const borderWidth = themeConfig?.globalStyling?.borderWidth || '0.5px'
  const borderRadius = themeConfig?.globalStyling?.borderRadius || '8px'
  
  // Subtle backdrop for panels
  const panelBg = `color-mix(in srgb, ${uiBg} 95%, transparent)`
  const panelBackdrop = 'blur(30px) saturate(200%)'

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col font-sans" style={{ fontFamily: themeConfig?.globalStyling?.fontFamily || '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      {/* Main Layout - Split View */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Panel - Database List */}
        <div className="w-80 flex-shrink-0 flex flex-col">
          {/* Precise Panel */}
          <div 
            className="flex-1 flex flex-col overflow-hidden"
            style={{
              backgroundColor: panelBg,
              backdropFilter: panelBackdrop,
              borderRadius: borderRadius,
              borderColor: borderColor,
              borderWidth: borderWidth,
              borderStyle: 'solid',
            }}
          >
            {/* Header */}
            <div 
              className="px-5 py-4 border-b"
              style={{ borderColor: uiBorder }}
            >
              <div className="flex items-center justify-between mb-1">
                <h2 
                  className="text-lg font-semibold tracking-tight"
                  style={{ color: bodyText }}
                >
                  Databases
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadConnections}
                  disabled={isLoadingDatabases}
                  className="h-7 w-7 p-0 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-lg transition-all"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5 text-gray-500 dark:text-gray-400", isLoadingDatabases && "animate-spin")} />
                </Button>
              </div>
              <p 
                className="text-xs"
                style={{ color: bodyText, opacity: 0.6 }}
              >
                {connections.length} connection{connections.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Database List */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                {isLoadingDatabases ? (
                  <div 
                    className="flex flex-col items-center justify-center py-12"
                    style={{ color: bodyText, opacity: 0.6 }}
                  >
                    <RefreshCw className="h-6 w-6 animate-spin mb-3" />
                    <p className="text-sm">Loading databases...</p>
                  </div>
                ) : connections.length === 0 ? (
                  <div 
                    className="flex flex-col items-center justify-center py-12"
                    style={{ color: bodyText, opacity: 0.6 }}
                  >
                    <Database className="h-10 w-10 mb-3 opacity-50" />
                    <p className="text-sm font-medium">No databases</p>
                    <p className="text-xs mt-1">Add a connection to get started</p>
                  </div>
                ) : (
                  connections.map(connection => {
                    const isSelected = selectedDatabase === connection.id
                    return (
                      <button
                        key={connection.id}
                        onClick={() => setSelectedDatabase(connection.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-left",
                          isSelected && "shadow-sm"
                        )}
                        style={{
                          backgroundColor: isSelected 
                            ? `color-mix(in srgb, ${primaryColor} 6%, transparent)` 
                            : 'transparent',
                          border: isSelected 
                            ? `${borderWidth} solid color-mix(in srgb, ${primaryColor} 15%, transparent)` 
                            : 'none',
                          borderRadius: borderRadius,
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${primaryColor} 3%, transparent)`
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }
                        }}
                      >
                        <div className="flex-shrink-0">
                          {getDatabaseIcon(connection.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span 
                              className="text-sm font-medium truncate"
                              style={{ 
                                color: isSelected ? primaryColor : bodyText 
                              }}
                            >
                              {connection.name}
                            </span>
                            {getStatusIcon(connection.status)}
                          </div>
                          <div 
                            className="text-xs truncate"
                            style={{ color: bodyText, opacity: 0.6 }}
                          >
                            {connection.host}:{connection.port}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right Body - Data Models or Tables */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Precise Panel */}
          <div 
            className="flex-1 flex flex-col overflow-hidden"
            style={{
              backgroundColor: panelBg,
              backdropFilter: panelBackdrop,
              borderRadius: borderRadius,
              borderColor: borderColor,
              borderWidth: borderWidth,
              borderStyle: 'solid',
            }}
          >
            {/* Header */}
            <div 
              className="px-6 py-4 border-b"
              style={{ borderColor: uiBorder }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    {viewMode === 'schema' ? (
                      <Table className="h-5 w-5" style={{ color: primaryColor }} />
                    ) : viewMode === 'erd' ? (
                      <GitBranch className="h-5 w-5" style={{ color: primaryColor }} />
                    ) : (
                      <Folder className="h-5 w-5" style={{ color: primaryColor }} />
                    )}
                    <h2 
                      className="text-lg font-semibold tracking-tight"
                      style={{ color: bodyText }}
                    >
                      {viewMode === 'schema' ? 'Database Schema' : viewMode === 'erd' ? 'ERD Diagram' : 'Data Models'}
                    </h2>
                  </div>
                  <p 
                    className="text-xs ml-8"
                    style={{ color: bodyText, opacity: 0.6 }}
                  >
                    {viewMode === 'schema'
                      ? selectedConnection 
                        ? `Schema for ${selectedConnection.name}`
                        : 'Select a database to view schema'
                      : viewMode === 'erd'
                      ? 'Entity Relationship Diagram'
                      : 'Organize your data models'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="models">
                        <div className="flex items-center gap-2">
                          <Folder className="h-3.5 w-3.5" />
                          <span>Models</span>
                        </div>
                      </SelectItem>
                      {selectedDatabase ? (
                        <SelectItem value="schema">
                          <div className="flex items-center gap-2">
                            <Table className="h-3.5 w-3.5" />
                            <span>Schema</span>
                          </div>
                        </SelectItem>
                      ) : null}
                      <SelectItem value="erd">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-3.5 w-3.5" />
                          <span>ERD</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {viewMode === 'models' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={loadModels}
                      className="h-8 w-8 p-0 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-lg"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5 text-gray-500 dark:text-gray-400", isLoadingModels && "animate-spin")} />
                    </Button>
                  )}
                  {viewMode === 'erd' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={loadERDData}
                      className="h-8 w-8 p-0 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-lg"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5 text-gray-500 dark:text-gray-400", isLoadingERD && "animate-spin")} />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {viewMode === 'schema' ? (
                // Database Schema View
                <ScrollArea className="h-full">
                  <div className="p-6">
                    {!selectedDatabase ? (
                      <div 
                        className="flex flex-col items-center justify-center py-16"
                        style={{ color: bodyText, opacity: 0.6 }}
                      >
                        <Table className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-sm font-medium">Select a database</p>
                        <p className="text-xs mt-1">Choose a database from the left panel to view its schema</p>
                      </div>
                    ) : isLoadingSchema ? (
                      <div 
                        className="flex flex-col items-center justify-center py-16"
                        style={{ color: bodyText, opacity: 0.6 }}
                      >
                        <RefreshCw className="h-6 w-6 animate-spin mb-3" />
                        <p className="text-sm">Loading schema...</p>
                      </div>
                    ) : !databaseSchema ? (
                      <div 
                        className="flex flex-col items-center justify-center py-16"
                        style={{ color: bodyText, opacity: 0.6 }}
                      >
                        <Table className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-sm font-medium">No schema data</p>
                      </div>
                    ) : databaseSchema.tables.length === 0 ? (
                      <div 
                        className="flex flex-col items-center justify-center py-16"
                        style={{ color: bodyText, opacity: 0.6 }}
                      >
                        <Table className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-sm font-medium">No tables found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {databaseSchema.tables.map(table => (
                          <div 
                            key={table.name} 
                            className="p-5 transition-all border"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${uiBg} 98%, transparent)`,
                              borderColor: borderColor,
                              borderWidth: borderWidth,
                              borderRadius: borderRadius,
                              borderStyle: 'solid',
                            }}
                          >
                            <div className="flex items-center gap-2 mb-4">
                              <div 
                                className="flex items-center justify-center w-8 h-8 rounded-lg"
                                style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)` }}
                              >
                                <Table className="h-4 w-4" style={{ color: primaryColor }} />
                              </div>
                              <h3 
                                className="font-semibold text-sm font-mono"
                                style={{ color: bodyText }}
                              >
                                {table.name}
                              </h3>
                            </div>
                            <div className="space-y-2">
                              {table.columns.map(column => (
                                <div 
                                  key={column.name} 
                                  className="flex items-center justify-between py-2.5 px-3 transition-colors border-b last:border-0"
                                  style={{
                                    borderColor: borderColor,
                                    backgroundColor: 'transparent',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${primaryColor} 3%, transparent)`
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <span 
                                      className="font-mono font-medium text-sm"
                                      style={{ color: bodyText }}
                                    >
                                      {column.name}
                                    </span>
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs px-2 py-0.5 h-5 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                                    >
                                      {column.type}
                                    </Badge>
                                    {!column.nullable && (
                                      <Badge 
                                        variant="secondary" 
                                        className="text-xs px-2 py-0.5 h-5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50"
                                      >
                                        NOT NULL
                                      </Badge>
                                    )}
                                  </div>
                                  {column.default && (
                                    <span 
                                      className="text-xs font-mono"
                                      style={{ color: bodyText, opacity: 0.6 }}
                                    >
                                      {column.default}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              ) : viewMode === 'erd' ? (
                // ERD Diagram View
                <div className="h-full relative">
                  {isLoadingERD ? (
                    <div 
                      className="flex flex-col items-center justify-center h-full"
                      style={{ color: bodyText, opacity: 0.6 }}
                    >
                      <RefreshCw className="h-6 w-6 animate-spin mb-3" />
                      <p className="text-sm">Loading ERD diagram...</p>
                    </div>
                  ) : erdModels.length === 0 ? (
                    <div 
                      className="flex flex-col items-center justify-center h-full"
                      style={{ color: bodyText, opacity: 0.6 }}
                    >
                      <GitBranch className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-sm font-medium">No data models found</p>
                      <p className="text-xs mt-1">Create data models to visualize relationships</p>
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
                <div className="flex flex-col h-full">
                  {/* Search Bar */}
                  <div 
                    className="px-6 pt-4 pb-3 border-b"
                    style={{ borderColor: uiBorder }}
                  >
                    <div className="relative">
                      <Search 
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" 
                        style={{ color: bodyText, opacity: 0.5 }}
                      />
                      <Input
                        placeholder="Search models..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="pl-10 h-9 backdrop-blur-sm text-sm"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${uiBg} 98%, transparent)`,
                          borderColor: borderColor,
                          borderWidth: borderWidth,
                          borderRadius: borderRadius,
                        }}
                      />
                    </div>
                  </div>

                  {/* Tree View */}
                  <ScrollArea className="flex-1">
                    <div className="p-4">
                      {isLoadingModels ? (
                        <div 
                          className="flex flex-col items-center justify-center py-16"
                          style={{ color: bodyText, opacity: 0.6 }}
                        >
                          <RefreshCw className="h-6 w-6 animate-spin mb-3" />
                          <p className="text-sm">Loading models...</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {/* Root Models */}
                          {rootModels.length > 0 && (
                            <div className="space-y-1 mb-4">
                              <div 
                                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider"
                                style={{ color: bodyText, opacity: 0.6 }}
                              >
                                <Database className="h-3.5 w-3.5" />
                                <span>Root Models ({rootModels.length})</span>
                              </div>
                              <div className="space-y-0.5">
                                {rootModels.map(renderModelItem)}
                              </div>
                            </div>
                          )}
                          
                          {/* Folders */}
                          {treeStructure.map(folder => renderFolderItem(folder))}

                          {/* Empty State */}
                          {models.length === 0 && folders.length === 0 && (
                            <div 
                              className="flex flex-col items-center justify-center py-16"
                              style={{ color: bodyText, opacity: 0.6 }}
                            >
                              <Folder className="h-12 w-12 mb-4 opacity-50" />
                              <p className="text-sm font-medium">No data models yet</p>
                              <p className="text-xs mt-1">Create your first data model to get started</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
