'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Database,
  Search,
  X,
  GripVertical,
  Filter,
  ArrowUpDown,
  Calendar as CalendarIcon,
  Hash,
  Type,
  DollarSign,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Plus,
} from 'lucide-react'
import { PlacedWidget } from './widgets'
import toast from 'react-hot-toast'

interface Attribute {
  id: string
  name: string
  display_name: string
  type: string
  is_required?: boolean
  is_unique?: boolean
}

interface DataModel {
  id: string
  name: string
  display_name: string
  description?: string
}

interface FieldConfig {
  fieldName: string
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'COUNT_DISTINCT' | 'MIN' | 'MAX' | 'NONE'
  format?: string
  type: 'dimension' | 'metric'
}

interface FilterConfig {
  field: string
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'NOT_CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN' | 'IN' | 'NOT_IN'
  value: any
  value2?: any // For BETWEEN
}

interface SortConfig {
  field: string
  direction: 'ASC' | 'DESC'
}

interface LookerStudioDataSourceProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  spaceId?: string
}

export function LookerStudioDataSource({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
  spaceId,
}: LookerStudioDataSourceProps) {
  const [dataModels, setDataModels] = useState<DataModel[]>([])
  const initialModelId = (widget.properties?.dataModelId 
    || (widget.properties as any)?.data_model_id 
    || (widget as any)?.data_config?.data_model_id 
    || (widget as any)?.data_config?.dataModelId 
    || '') as string
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId)
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loadingAttributes, setLoadingAttributes] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['fields', 'data']))
  
  // Field configurations
  const dimensions = useMemo(() => {
    const dims = widget.properties?.dimensions || []
    return dims.map((d: string) => ({
      fieldName: d,
      type: 'dimension' as const,
      aggregation: 'NONE' as const,
    }))
  }, [widget.properties?.dimensions])

  const metrics = useMemo(() => {
    const measures = widget.properties?.measures || []
    return measures.map((m: string | FieldConfig) => {
      if (typeof m === 'string') {
        return { fieldName: m, type: 'metric' as const, aggregation: 'SUM' as const }
      }
      return m as FieldConfig
    })
  }, [widget.properties?.measures])

  const filters = useMemo(() => {
    return (widget.properties?.filters || []) as FilterConfig[]
  }, [widget.properties?.filters])

  const sorts = useMemo(() => {
    return (widget.properties?.sorts || []) as SortConfig[]
  }, [widget.properties?.sorts])

  const updateProperty = useCallback((key: string, value: any) => {
    setPlacedWidgets(prev => prev.map(w =>
      w.id === selectedWidgetId
        ? { ...w, properties: { ...w.properties, [key]: value } }
        : w
    ))
  }, [selectedWidgetId, setPlacedWidgets])

  // Load data models
  useEffect(() => {
    if (!spaceId) return
    
    const loadDataModels = async () => {
      try {
        const res = await fetch(`/api/spaces/${spaceId}/data-models`)
        if (res.ok) {
          const json = await res.json()
          setDataModels(json.dataModels || [])
        }
      } catch (error) {
        console.error('Error loading data models:', error)
      }
    }
    
    loadDataModels()
  }, [spaceId])

  // Load attributes when model is selected
  useEffect(() => {
    if (!selectedModelId) {
      setAttributes([])
      return
    }
    
    const loadAttributes = async () => {
      setLoadingAttributes(true)
      try {
        const res = await fetch(`/api/data-models/${selectedModelId}/attributes`)
        if (res.ok) {
          const json = await res.json()
          setAttributes(json.attributes || [])
        }
      } catch (error) {
        console.error('Error loading attributes:', error)
      } finally {
        setLoadingAttributes(false)
      }
    }
    
    loadAttributes()
  }, [selectedModelId])

  // Update widget when model changes (mirror snake_case and camelCase)
  useEffect(() => {
    if (selectedModelId && selectedModelId !== (widget.properties?.dataModelId || (widget.properties as any)?.data_model_id)) {
      setPlacedWidgets(prev => prev.map(w => 
        w.id === selectedWidgetId
          ? {
              ...w,
              properties: {
                ...w.properties,
                dataModelId: selectedModelId,
                // @ts-ignore legacy
                data_model_id: selectedModelId,
                dataSource: 'data-model',
                dimensions: [],
                measures: [],
              },
            }
          : w
      ))
    }
  }, [selectedModelId, selectedWidgetId, setPlacedWidgets, widget.properties])

  // Auto-select only model if exactly one
  useEffect(() => {
    if (!selectedModelId && dataModels.length === 1) {
      const only = dataModels[0]
      const modelId = (only as any).id || (only as any)._id || String(only)
      setSelectedModelId(modelId)
      setPlacedWidgets(prev => prev.map(w => 
        w.id === selectedWidgetId
          ? {
              ...w,
              properties: { 
                ...w.properties, 
                dataModelId: modelId, 
                // @ts-ignore legacy
                data_model_id: modelId 
              }
            }
          : w
      ))
    }
  }, [dataModels, selectedModelId, selectedWidgetId, setPlacedWidgets])

  const filteredAttributes = useMemo(() => {
    if (!searchQuery.trim()) return attributes
    const query = searchQuery.toLowerCase()
    return attributes.filter(attr =>
      attr.name.toLowerCase().includes(query) ||
      attr.display_name.toLowerCase().includes(query) ||
      attr.type.toLowerCase().includes(query)
    )
  }, [attributes, searchQuery])

  const isNumeric = (type: string) => {
    const lowerType = type.toLowerCase()
    return lowerType.includes('number') ||
           lowerType.includes('integer') ||
           lowerType.includes('decimal') ||
           lowerType.includes('float') ||
           lowerType.includes('money') ||
           lowerType.includes('currency')
  }

  const getAttributeIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (isNumeric(type)) return Hash
    if (lowerType.includes('date') || lowerType.includes('time')) return CalendarIcon
    if (lowerType.includes('money') || lowerType.includes('currency')) return DollarSign
    return Type
  }

  const handleAddDimension = (attribute: Attribute) => {
    const currentDims = widget.properties?.dimensions || []
    if (!currentDims.includes(attribute.name)) {
      updateProperty('dimensions', [...currentDims, attribute.name])
      toast.success(`Added ${attribute.display_name || attribute.name} to dimensions`)
    }
  }

  const handleAddMetric = (attribute: Attribute) => {
    const currentMeasures = widget.properties?.measures || []
    const measureConfig = {
      fieldName: attribute.name,
      type: 'metric' as const,
      aggregation: 'SUM' as const,
    }
    const existing = currentMeasures.find((m: any) => 
      (typeof m === 'string' ? m : m.fieldName) === attribute.name
    )
    if (!existing) {
      updateProperty('measures', [...currentMeasures, measureConfig])
      toast.success(`Added ${attribute.display_name || attribute.name} to metrics`)
    }
  }

  const handleRemoveDimension = (fieldName: string) => {
    const currentDims = widget.properties?.dimensions || []
    updateProperty('dimensions', currentDims.filter((d: string) => d !== fieldName))
  }

  const handleRemoveMetric = (fieldName: string) => {
    const currentMeasures = widget.properties?.measures || []
    updateProperty('measures', currentMeasures.filter((m: any) =>
      (typeof m === 'string' ? m : m.fieldName) !== fieldName
    ))
  }

  const handleUpdateMetricAggregation = (fieldName: string, aggregation: FieldConfig['aggregation']) => {
    const currentMeasures = widget.properties?.measures || []
    updateProperty('measures', currentMeasures.map((m: any) => {
      const name = typeof m === 'string' ? m : m.fieldName
      if (name === fieldName) {
        return { fieldName: name, type: 'metric', aggregation: aggregation || 'SUM' }
      }
      return m
    }))
  }

  const handleAddFilter = () => {
    const currentFilters = widget.properties?.filters || []
    updateProperty('filters', [...currentFilters, {
      field: '',
      operator: 'EQUALS',
      value: '',
    }])
  }

  const handleUpdateFilter = (index: number, updates: Partial<FilterConfig>) => {
    const currentFilters = widget.properties?.filters || []
    updateProperty('filters', currentFilters.map((f: FilterConfig, i: number) =>
      i === index ? { ...f, ...updates } : f
    ))
  }

  const handleRemoveFilter = (index: number) => {
    const currentFilters = widget.properties?.filters || []
    updateProperty('filters', currentFilters.filter((_: any, i: number) => i !== index))
  }

  const handleAddSort = () => {
    const currentSorts = widget.properties?.sorts || []
    updateProperty('sorts', [...currentSorts, {
      field: '',
      direction: 'ASC',
    }])
  }

  const handleUpdateSort = (index: number, updates: Partial<SortConfig>) => {
    const currentSorts = widget.properties?.sorts || []
    updateProperty('sorts', currentSorts.map((s: SortConfig, i: number) =>
      i === index ? { ...s, ...updates } : s
    ))
  }

  const handleRemoveSort = (index: number) => {
    const currentSorts = widget.properties?.sorts || []
    updateProperty('sorts', currentSorts.filter((_: any, i: number) => i !== index))
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const selectedModel = dataModels.find(m => m.id === selectedModelId)

  return (
    <div className="flex flex-col h-full">
      {/* Data Source Header */}
      <div className="p-3 border-b bg-muted/30">
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Data Source</Label>
          <Select
            value={selectedModelId}
            onValueChange={setSelectedModelId}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select data model" />
            </SelectTrigger>
            <SelectContent>
              {dataModels.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5" />
                    <span>{model.display_name || model.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedModel && (
            <p className="text-xs text-muted-foreground mt-1">
              {selectedModel.description || `${attributes.length} fields available`}
            </p>
          )}
        </div>
      </div>

      {!selectedModelId ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Select a data model to configure</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Fields */}
          <div className="w-64 border-r flex flex-col">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search fields..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 pl-7 text-xs"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {loadingAttributes ? (
                  <div className="text-xs text-muted-foreground p-2 text-center">Loading fields...</div>
                ) : filteredAttributes.length === 0 ? (
                  <div className="text-xs text-muted-foreground p-2 text-center">
                    {searchQuery ? 'No fields found' : 'No fields available'}
                  </div>
                ) : (
                  filteredAttributes.map((attr: any) => {
                    const Icon = getAttributeIcon(attr.type)
                     const isDim = dimensions.some((d: any) => d.fieldName === attr.name)
                    const isMet = metrics.some((m: any) => 
                      (typeof m === 'string' ? m : m.fieldName) === attr.name
                    )
                    
                    return (
                      <div
                        key={attr.id}
                        className={`
                          flex items-center gap-2 p-2 rounded text-xs cursor-pointer
                          hover:bg-muted transition-colors group
                          ${isDim || isMet ? 'bg-blue-50 border border-blue-200' : ''}
                        `}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify({
                            attribute: attr,
                            model: selectedModel,
                            type: 'attribute',
                          }))
                        }}
                      >
                        <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 truncate">{attr.display_name || attr.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      {attr.type || 'text'}
                    </span>
                        {isDim && (
                          <Badge variant="outline" className="h-4 px-1 text-[10px]">Dim</Badge>
                        )}
                        {isMet && (
                          <Badge variant="outline" className="h-4 px-1 text-[10px]">Met</Badge>
                        )}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isDim && !isNumeric(attr.type) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => handleAddDimension(attr)}
                              title="Add as dimension"
                            >
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          )}
                          {!isMet && isNumeric(attr.type) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => handleAddMetric(attr)}
                              title="Add as metric"
                            >
                              <TrendingUp className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel: Configuration */}
          <div className="flex-1 overflow-y-auto">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-3">
                {/* Dimensions Section */}
                <div className="border rounded-lg">
                  <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSection('dimensions')}
                        className="p-0.5 hover:bg-muted rounded"
                      >
                        {expandedSections.has('dimensions') ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <Label className="text-xs font-semibold">Dimensions</Label>
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                        {dimensions.length}
                      </Badge>
                    </div>
                  </div>
                  {expandedSections.has('dimensions') && (
                    <div 
                      className="p-2 space-y-1 min-h-[120px]" 
                      data-dimension-area
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        try {
                          const data = e.dataTransfer?.getData('application/json')
                          if (!data) return
                          const { attribute } = JSON.parse(data)
                          if (attribute) {
                            handleAddDimension(attribute)
                          }
                        } catch (error) {
                          console.error('Error handling drop:', error)
                        }
                      }}
                    >
                      {dimensions.length === 0 ? (
                        <div className="text-xs text-muted-foreground p-4 text-center border-2 border-dashed rounded">
                          Drag dimensions here or click fields to add
                        </div>
                      ) : (
                         dimensions.map((dim: any, index: number) => {
                          const attr = attributes.find(a => a.name === dim.fieldName)
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-muted/50 rounded group"
                            >
                              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="text-xs font-medium">
                                  {attr?.display_name || dim.fieldName}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {attr?.type || 'unknown'}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() => handleRemoveDimension(dim.fieldName)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Metrics Section */}
                <div className="border rounded-lg">
                  <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSection('metrics')}
                        className="p-0.5 hover:bg-muted rounded"
                      >
                        {expandedSections.has('metrics') ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <Label className="text-xs font-semibold">Metrics</Label>
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                        {metrics.length}
                      </Badge>
                    </div>
                  </div>
                  {expandedSections.has('metrics') && (
                    <div 
                      className="p-2 space-y-2 min-h-[120px]" 
                      data-measure-area
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        try {
                          const data = e.dataTransfer?.getData('application/json')
                          if (!data) return
                          const { attribute } = JSON.parse(data)
                          if (attribute) {
                            handleAddMetric(attribute)
                          }
                        } catch (error) {
                          console.error('Error handling drop:', error)
                        }
                      }}
                    >
                      {metrics.length === 0 ? (
                        <div className="text-xs text-muted-foreground p-4 text-center border-2 border-dashed rounded">
                          Drag metrics here or click numeric fields to add
                        </div>
                      ) : (
                         metrics.map((metric: any, index: number) => {
                          const fieldName = typeof metric === 'string' ? metric : metric.fieldName
                          const attr = attributes.find(a => a.name === fieldName)
                          const agg = typeof metric === 'object' ? metric.aggregation : 'SUM'
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-muted/50 rounded group"
                            >
                              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">
                                    {attr?.display_name || fieldName}
                                  </span>
                                  <Select
                                    value={agg}
                                    onValueChange={(value) => handleUpdateMetricAggregation(fieldName, value as FieldConfig['aggregation'])}
                                  >
                                    <SelectTrigger className="h-6 w-24 text-[10px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="SUM">Sum</SelectItem>
                                      <SelectItem value="AVG">Avg</SelectItem>
                                      <SelectItem value="COUNT">Count</SelectItem>
                                      <SelectItem value="COUNT_DISTINCT">Count Distinct</SelectItem>
                                      <SelectItem value="MIN">Min</SelectItem>
                                      <SelectItem value="MAX">Max</SelectItem>
                                      <SelectItem value="NONE">None</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {attr?.type || 'unknown'}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() => handleRemoveMetric(fieldName)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Filters Section */}
                <div className="border rounded-lg">
                  <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSection('filters')}
                        className="p-0.5 hover:bg-muted rounded"
                      >
                        {expandedSections.has('filters') ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <Filter className="h-3.5 w-3.5" />
                      <Label className="text-xs font-semibold">Filters</Label>
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                        {filters.length}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={handleAddFilter}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  {expandedSections.has('filters') && (
                    <div className="p-2 space-y-2">
                      {filters.length === 0 ? (
                        <div className="text-xs text-muted-foreground p-4 text-center">
                          No filters applied
                        </div>
                      ) : (
                        filters.map((filter, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded">
                            <Select
                              value={filter.field}
                              onValueChange={(value) => handleUpdateFilter(index, { field: value })}
                            >
                              <SelectTrigger className="h-7 w-32 text-xs">
                                <SelectValue placeholder="Field" />
                              </SelectTrigger>
                              <SelectContent>
                                {attributes.map(attr => (
                                  <SelectItem key={attr.id} value={attr.name}>
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="truncate">{attr.display_name || attr.name}</span>
                                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                        {attr.type || 'text'}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={filter.operator}
                              onValueChange={(value) => handleUpdateFilter(index, { operator: value as FilterConfig['operator'] })}
                            >
                              <SelectTrigger className="h-7 w-32 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="EQUALS">Equals</SelectItem>
                                <SelectItem value="NOT_EQUALS">Not equals</SelectItem>
                                <SelectItem value="CONTAINS">Contains</SelectItem>
                                <SelectItem value="NOT_CONTAINS">Not contains</SelectItem>
                                <SelectItem value="GREATER_THAN">Greater than</SelectItem>
                                <SelectItem value="LESS_THAN">Less than</SelectItem>
                                <SelectItem value="BETWEEN">Between</SelectItem>
                                <SelectItem value="IN">In</SelectItem>
                                <SelectItem value="NOT_IN">Not in</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              value={filter.value || ''}
                              onChange={(e) => handleUpdateFilter(index, { value: e.target.value })}
                              placeholder="Value"
                              className="h-7 flex-1 text-xs"
                            />
                            {filter.operator === 'BETWEEN' && (
                              <Input
                                value={filter.value2 || ''}
                                onChange={(e) => handleUpdateFilter(index, { value2: e.target.value })}
                                placeholder="Value 2"
                                className="h-7 w-24 text-xs"
                              />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleRemoveFilter(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Sorting Section */}
                <div className="border rounded-lg">
                  <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSection('sorts')}
                        className="p-0.5 hover:bg-muted rounded"
                      >
                        {expandedSections.has('sorts') ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <Label className="text-xs font-semibold">Sort</Label>
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                        {sorts.length}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={handleAddSort}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  {expandedSections.has('sorts') && (
                    <div className="p-2 space-y-2">
                      {sorts.length === 0 ? (
                        <div className="text-xs text-muted-foreground p-4 text-center">
                          No sorting applied
                        </div>
                      ) : (
                        sorts.map((sort, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded">
                            <Select
                              value={sort.field}
                              onValueChange={(value) => handleUpdateSort(index, { field: value })}
                            >
                              <SelectTrigger className="h-7 flex-1 text-xs">
                                <SelectValue placeholder="Field" />
                              </SelectTrigger>
                              <SelectContent>
                                {attributes.map(attr => (
                                  <SelectItem key={attr.id} value={attr.name}>
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="truncate">{attr.display_name || attr.name}</span>
                                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                        {attr.type || 'text'}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={sort.direction}
                              onValueChange={(value) => handleUpdateSort(index, { direction: value as 'ASC' | 'DESC' })}
                            >
                              <SelectTrigger className="h-7 w-24 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ASC">Ascending</SelectItem>
                                <SelectItem value="DESC">Descending</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleRemoveSort(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Date Range (if date fields exist) */}
                {attributes.some(attr => attr.type.toLowerCase().includes('date')) && (
                  <div className="border rounded-lg">
                    <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSection('daterange')}
                          className="p-0.5 hover:bg-muted rounded"
                        >
                          {expandedSections.has('daterange') ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <Label className="text-xs font-semibold">Date Range</Label>
                      </div>
                    </div>
                    {expandedSections.has('daterange') && (
                      <div className="p-2 space-y-2">
                        <Select
                          value={widget.properties?.dateRangeField || ''}
                          onValueChange={(value) => updateProperty('dateRangeField', value)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Select date field" />
                          </SelectTrigger>
                          <SelectContent>
                            {attributes
                              .filter(attr => attr.type.toLowerCase().includes('date'))
                              .map(attr => (
                                <SelectItem key={attr.id} value={attr.name}>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="truncate">{attr.display_name || attr.name}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                                      {attr.type || 'date'}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Start Date</Label>
                            <Input
                              type="date"
                              value={widget.properties?.dateRangeStart || ''}
                              onChange={(e) => updateProperty('dateRangeStart', e.target.value)}
                              className="h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">End Date</Label>
                            <Input
                              type="date"
                              value={widget.properties?.dateRangeEnd || ''}
                              onChange={(e) => updateProperty('dateRangeEnd', e.target.value)}
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Refresh Settings */}
                <div className="border rounded-lg">
                  <div className="p-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Auto Refresh</Label>
                      <Switch
                        checked={widget.properties?.autoRefresh ?? false}
                        onCheckedChange={(checked) => updateProperty('autoRefresh', checked)}
                      />
                    </div>
                    {widget.properties?.autoRefresh && (
                      <div>
                        <Label className="text-xs">Interval (seconds)</Label>
                        <Input
                          type="number"
                          value={widget.properties?.refreshInterval || 30}
                          onChange={(e) => updateProperty('refreshInterval', parseInt(e.target.value) || 30)}
                          className="h-7 text-xs"
                          min="1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  )
}

