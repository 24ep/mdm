'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Database, ChevronRight, ChevronDown, Hash, Calendar, Type, DollarSign, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataModel {
  id: string
  name: string
  display_name: string
  description?: string
}

interface Attribute {
  id: string
  name: string
  display_name: string
  type: string
  is_required?: boolean
  is_unique?: boolean
}

interface DataModelExplorerProps {
  spaceId: string
  selectedDataModelId?: string
  onDataModelSelect?: (modelId: string | null) => void
  className?: string
}

export function DataModelExplorer({
  spaceId,
  selectedDataModelId,
  onDataModelSelect,
  className
}: DataModelExplorerProps) {
  if (!spaceId) return null
  
  const [dataModels, setDataModels] = useState<DataModel[]>([])
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set())
  const [attributesMap, setAttributesMap] = useState<Record<string, Attribute[]>>({})
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Load data models for the space
  useEffect(() => {
    const loadDataModels = async () => {
      if (!spaceId) return
      
      setLoading(true)
      try {
        const res = await fetch(`/api/spaces/${spaceId}/data-models`)
        if (!res.ok) throw new Error('Failed to load data models')
        const json = await res.json()
        setDataModels(json.dataModels || [])
        
        // Auto-expand selected model
        if (selectedDataModelId) {
          setExpandedModels(new Set([selectedDataModelId]))
          loadAttributes(selectedDataModelId)
        }
      } catch (error) {
        console.error('Error loading data models:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDataModels()
  }, [spaceId, selectedDataModelId])

  // Load attributes for a specific model
  const loadAttributes = async (modelId: string) => {
    if (attributesMap[modelId]) return // Already loaded
    
    try {
      const res = await fetch(`/api/data-models/${modelId}/attributes`)
      if (!res.ok) throw new Error('Failed to load attributes')
      const json = await res.json()
      setAttributesMap(prev => ({
        ...prev,
        [modelId]: json.attributes || []
      }))
    } catch (error) {
      console.error('Error loading attributes:', error)
      setAttributesMap(prev => ({
        ...prev,
        [modelId]: []
      }))
    }
  }

  const toggleModel = (modelId: string) => {
    setExpandedModels(prev => {
      const next = new Set(prev)
      if (next.has(modelId)) {
        next.delete(modelId)
      } else {
        next.add(modelId)
        loadAttributes(modelId)
      }
      return next
    })
  }

  const handleAttributeDragStart = (e: React.DragEvent, attribute: Attribute, model: DataModel) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      attribute,
      model,
      type: 'attribute'
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const getAttributeIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('number') || lowerType.includes('integer') || lowerType.includes('decimal')) {
      return <Hash className="h-3 w-3 text-blue-500" />
    }
    if (lowerType.includes('date') || lowerType.includes('time')) {
      return <Calendar className="h-3 w-3 text-green-500" />
    }
    if (lowerType.includes('money') || lowerType.includes('currency')) {
      return <DollarSign className="h-3 w-3 text-yellow-500" />
    }
    return <Type className="h-3 w-3 text-gray-500" />
  }

  const isNumeric = (type: string): boolean => {
    const lowerType = type.toLowerCase()
    return lowerType.includes('number') || 
           lowerType.includes('integer') || 
           lowerType.includes('decimal') ||
           lowerType.includes('float') ||
           lowerType.includes('money') ||
           lowerType.includes('currency')
  }

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return dataModels
    
    const query = searchQuery.toLowerCase()
    return dataModels.filter(model => 
      model.name.toLowerCase().includes(query) ||
      model.display_name.toLowerCase().includes(query)
    )
  }, [dataModels, searchQuery])

  const filteredAttributes = (modelId: string): Attribute[] => {
    const attrs = attributesMap[modelId] || []
    if (!searchQuery.trim()) return attrs
    
    const query = searchQuery.toLowerCase()
    return attrs.filter(attr =>
      attr.name.toLowerCase().includes(query) ||
      attr.display_name.toLowerCase().includes(query)
    )
  }

  return (
    <div className={cn("flex flex-col h-full bg-white border-l", className)}>
      <div className="p-3 border-b">
        <h3 className="text-sm font-semibold mb-2">Data Models</h3>
        <input
          type="text"
          placeholder="Search models or attributes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-2 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-xs text-gray-500">Loading data models...</div>
        ) : filteredModels.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500">
            {searchQuery ? 'No models found' : 'No data models available'}
          </div>
        ) : (
          <div className="p-2">
            {filteredModels.map((model) => {
              const isExpanded = expandedModels.has(model.id)
              const isSelected = selectedDataModelId === model.id
              const attributes = filteredAttributes(model.id)
              const numericAttributes = attributes.filter(attr => isNumeric(attr.type))
              const dimensionAttributes = attributes.filter(attr => !isNumeric(attr.type))

              return (
                <div key={model.id} className="mb-1">
                  <div
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 transition-colors",
                      isSelected && "bg-blue-50 border border-blue-200"
                    )}
                    onClick={() => {
                      toggleModel(model.id)
                      onDataModelSelect?.(model.id)
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-gray-500" />
                    )}
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium flex-1">{model.display_name || model.name}</span>
                    {attributes.length > 0 && (
                      <span className="text-xs text-gray-400">{attributes.length}</span>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-3">
                      {/* Dimensions Section */}
                      {dimensionAttributes.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-1 px-1">
                            Dimensions
                          </div>
                          <div className="space-y-0.5">
                            {dimensionAttributes.map((attr) => (
                              <div
                                key={attr.id}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.stopPropagation()
                                  handleAttributeDragStart(e, attr, model)
                                }}
                                onDragEnd={(e) => {
                                  e.stopPropagation()
                                }}
                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-grab active:cursor-grabbing group transition-colors bg-white dark:bg-gray-800 border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                                title={`Drag to dimensions: ${attr.display_name || attr.name} (${attr.type})`}
                              >
                                {getAttributeIcon(attr.type)}
                                <span className="text-xs flex-1 text-gray-900 dark:text-gray-100">{attr.display_name || attr.name}</span>
                                <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100">
                                  {attr.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Measures Section */}
                      {numericAttributes.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-1 px-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Measures
                          </div>
                          <div className="space-y-0.5">
                            {numericAttributes.map((attr) => (
                              <div
                                key={attr.id}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.stopPropagation()
                                  handleAttributeDragStart(e, attr, model)
                                }}
                                onDragEnd={(e) => {
                                  e.stopPropagation()
                                }}
                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-grab active:cursor-grabbing group transition-colors bg-white dark:bg-gray-800 border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                                title={`Drag to measures: ${attr.display_name || attr.name} (${attr.type})`}
                              >
                                {getAttributeIcon(attr.type)}
                                <span className="text-xs flex-1 text-gray-900 dark:text-gray-100">{attr.display_name || attr.name}</span>
                                <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100">
                                  {attr.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {attributes.length === 0 && (
                        <div className="text-xs text-gray-400 px-2 py-1">No attributes found</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

