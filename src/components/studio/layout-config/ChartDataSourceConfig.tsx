'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Database, Search, ChevronDown, ChevronRight, Check, Plus, X } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PlacedWidget } from './widgets'

interface Attribute {
  id: string
  name: string
  display_name: string
  type: string
}

interface DataModel {
  id: string
  name: string
  display_name: string
}

interface ChartDataSourceConfigProps {
  widget: PlacedWidget
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  spaceId?: string
}

// Chart type configuration - defines what inputs each chart type needs
const CHART_DIMENSIONS: Record<string, Array<{ key: string; label: string; required?: boolean; multiple?: boolean }>> = {
  'bar-chart': [
    { key: 'x', label: 'X-Axis (Category)', required: true },
    { key: 'y', label: 'Y-Axis (Value)', required: true },
    { key: 'series', label: 'Series (Optional)', required: false },
  ],
  'line-chart': [
    { key: 'x', label: 'X-Axis (Category)', required: true },
    { key: 'y', label: 'Y-Axis (Value)', required: true },
    { key: 'series', label: 'Series (Optional)', required: false },
  ],
  'area-chart': [
    { key: 'x', label: 'X-Axis (Category)', required: true },
    { key: 'y', label: 'Y-Axis (Value)', required: true },
    { key: 'series', label: 'Series (Optional)', required: false },
  ],
  'pie-chart': [
    { key: 'category', label: 'Category', required: true },
    { key: 'value', label: 'Value', required: true },
  ],
  'donut-chart': [
    { key: 'category', label: 'Category', required: true },
    { key: 'value', label: 'Value', required: true },
  ],
  'scatter-chart': [
    { key: 'x', label: 'X-Axis', required: true },
    { key: 'y', label: 'Y-Axis', required: true },
    { key: 'size', label: 'Size (Optional)', required: false },
    { key: 'color', label: 'Color (Optional)', required: false },
  ],
  'table': [
    { key: 'columns', label: 'Columns', required: true, multiple: true },
    { key: 'rows', label: 'Rows (Optional)', required: false, multiple: true },
  ],
  'pivot-table': [
    { key: 'rows', label: 'Rows', required: true, multiple: true },
    { key: 'columns', label: 'Columns', required: false, multiple: true },
    { key: 'values', label: 'Values', required: true, multiple: true },
  ],
}

export function ChartDataSourceConfig({
  widget,
  setPlacedWidgets,
  spaceId,
}: ChartDataSourceConfigProps) {
  const [dataModels, setDataModels] = useState<DataModel[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string>(widget.properties?.dataModelId || '')
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({})
  const [openComboboxes, setOpenComboboxes] = useState<Record<string, boolean>>({})
  const [dragOverDimensions, setDragOverDimensions] = useState<Set<string>>(new Set())
  
  // Sync selectedModelId with widget properties
  useEffect(() => {
    const modelId = widget.properties?.dataModelId || ''
    if (modelId && modelId !== selectedModelId) {
      setSelectedModelId(modelId)
    }
  }, [widget.properties?.dataModelId, selectedModelId])
  
  // Get chart dimensions configuration
  const chartDims = CHART_DIMENSIONS[widget.type] || [
    { key: 'dimension', label: 'Dimension', required: true },
    { key: 'metric', label: 'Metric', required: true },
  ]
  
  // Load data models
  useEffect(() => {
    if (!spaceId) {
      console.log('No spaceId provided')
      return
    }
    
    const loadDataModels = async () => {
      try {
        setLoadingModels(true)
        const response = await fetch(`/api/spaces/${spaceId}/data-models`)
        if (response.ok) {
          const data = await response.json()
          // API returns { dataModels: [...] }
          const models = data.dataModels || data.data || data.models || (Array.isArray(data) ? data : [])
          const modelsArray = Array.isArray(models) ? models : []
          setDataModels(modelsArray)
          console.log('Loaded data models:', modelsArray.length, modelsArray)
          if (modelsArray.length === 0) {
            console.warn('No data models found in response:', data)
          }
        } else {
          const errorText = await response.text()
          console.error('Failed to load data models:', response.status, response.statusText, errorText)
          // Try alternative endpoint
          try {
            const altResponse = await fetch(`/api/data-models?spaceId=${spaceId}`)
            if (altResponse.ok) {
              const altData = await altResponse.json()
              const models = altData.dataModels || altData.data || altData.models || (Array.isArray(altData) ? altData : [])
              setDataModels(Array.isArray(models) ? models : [])
            }
          } catch (altError) {
            console.error('Alternative endpoint also failed:', altError)
          }
        }
      } catch (error) {
        console.error('Failed to load data models:', error)
      } finally {
        setLoadingModels(false)
      }
    }
    
    loadDataModels()
  }, [spaceId])
  
  // Load attributes when model is selected
  useEffect(() => {
    if (!selectedModelId || !spaceId) return
    
    setLoading(true)
    const loadAttributes = async () => {
      try {
        // Use the correct API endpoint: /api/data-models/[id]/attributes
        const response = await fetch(`/api/data-models/${selectedModelId}/attributes`)
        if (response.ok) {
          const data = await response.json()
          // API returns { attributes: [...], count: number }
          const attrs = data.attributes || data.data || (Array.isArray(data) ? data : [])
          const attrsArray = Array.isArray(attrs) ? attrs : []
          setAttributes(attrsArray)
          console.log('Loaded attributes:', attrsArray.length, 'for model:', selectedModelId, attrsArray)
          if (attrsArray.length === 0) {
            console.warn('No attributes loaded. Response:', data)
          }
        } else {
          const errorText = await response.text()
          console.error('Failed to load attributes:', response.status, response.statusText, errorText)
          setAttributes([]) // Clear attributes on error
        }
      } catch (error) {
        console.error('Failed to load attributes:', error)
        setAttributes([]) // Clear attributes on error
      } finally {
        setLoading(false)
      }
    }
    
    loadAttributes()
  }, [selectedModelId, spaceId])
  
  // Filter attributes based on search for a specific dimension
  const getFilteredAttributes = (dimKey: string, searchQuery?: string) => {
    const query = (searchQuery || searchQueries[dimKey] || '').toLowerCase().trim()
    if (!query) return attributes
    
    return attributes.filter(attr => 
      (attr.name?.toLowerCase() || '').includes(query) ||
      (attr.display_name?.toLowerCase() || '').includes(query)
    )
  }
  
  const setSearchQuery = (dimKey: string, query: string) => {
    setSearchQueries(prev => ({ ...prev, [dimKey]: query }))
  }
  
  // Update widget property
  const updateProperty = (key: string, value: any) => {
    setPlacedWidgets(prev => prev.map(w => 
      w.id === widget.id 
        ? { ...w, properties: { ...w.properties, [key]: value } }
        : w
    ))
  }
  
  // Get current dimension value
  const getDimensionValue = (dimKey: string): string | string[] => {
    const dims = widget.properties?.chartDimensions || {}
    return dims[dimKey] || (CHART_DIMENSIONS[widget.type]?.find(d => d.key === dimKey)?.multiple ? [] : '')
  }
  
  // Set dimension value
  const setDimensionValue = (dimKey: string, value: string | string[]) => {
    const dims = widget.properties?.chartDimensions || {}
    updateProperty('chartDimensions', { ...dims, [dimKey]: value })
  }
  
  // Handle model selection
  const handleModelChange = (modelId: string) => {
    console.log('handleModelChange called with:', modelId)
    if (!modelId || modelId === 'none') return
    
    setSelectedModelId(modelId)
    updateProperty('dataModelId', modelId)
    // Clear dimensions when model changes
    updateProperty('chartDimensions', {})
  }
  
  // Handle attribute selection for dimension
  const handleAttributeSelect = (dimKey: string, attributeName: string) => {
    const dim = chartDims.find(d => d.key === dimKey)
    if (dim?.multiple) {
      const current = Array.isArray(getDimensionValue(dimKey)) ? getDimensionValue(dimKey) as string[] : []
      if (current.includes(attributeName)) {
        setDimensionValue(dimKey, current.filter(a => a !== attributeName))
      } else {
        setDimensionValue(dimKey, [...current, attributeName])
      }
    } else {
      setDimensionValue(dimKey, attributeName)
    }
  }

  // Handle drop from data model panel
  const handleAttributeDrop = (e: React.DragEvent, dimKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverDimensions(prev => {
      const next = new Set(prev)
      next.delete(dimKey)
      return next
    })

    try {
      const data = e.dataTransfer.getData('application/json')
      if (!data) {
        console.warn('No data found in drop event')
        return
      }
      
      const parsed = JSON.parse(data)
      console.log('Drop data:', parsed)
      
      const { attribute } = parsed
      if (attribute && attribute.name) {
        console.log('Setting attribute:', attribute.name, 'for dimension:', dimKey)
        handleAttributeSelect(dimKey, attribute.name)
      } else {
        console.warn('Invalid attribute data:', parsed)
      }
    } catch (error) {
      console.error('Error handling attribute drop:', error, e.dataTransfer.getData('application/json'))
    }
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, dimKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    const types = Array.from(e.dataTransfer.types)
    console.log('Drag over types:', types)
    if (types.includes('application/json')) {
      e.dataTransfer.dropEffect = 'copy'
      setDragOverDimensions(prev => new Set(prev).add(dimKey))
    }
  }

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent, dimKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverDimensions(prev => {
      const next = new Set(prev)
      next.delete(dimKey)
      return next
    })
  }
  
  return (
    <div className="space-y-4 p-4 overflow-visible">
      {/* Data Model Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold flex items-center gap-2">
          <Database className="h-3.5 w-3.5" />
          Data Model
          {!spaceId && <span className="text-xs text-red-500">(No space ID)</span>}
        </Label>
        {loadingModels ? (
          <div className="text-xs text-muted-foreground py-2">Loading data models...</div>
        ) : dataModels.length === 0 ? (
          <div className="text-xs text-muted-foreground py-2">
            {!spaceId ? (
              <span className="text-red-500">Space ID is required</span>
            ) : (
              "No data models available"
            )}
          </div>
        ) : (
          <Select 
            value={selectedModelId || ''} 
            onValueChange={(value) => {
              console.log('Model selected:', value)
              handleModelChange(value)
            }}
          >
            <SelectTrigger className="h-8 text-xs w-full">
              <SelectValue placeholder="Select data model" />
            </SelectTrigger>
            <SelectContent 
              position="popper"
              className="z-[10000] max-h-[200px]"
              sideOffset={4}
            >
              {dataModels.map((model: any) => {
                const modelId = model.id || model._id || String(model)
                // API returns name, not display_name
                const modelName = model.name || model.display_name || String(model)
                return (
                  <SelectItem key={modelId} value={modelId}>
                    {modelName}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        )}
        {!spaceId && (
          <div className="text-xs text-red-500 mt-1">Space ID is required to load data models</div>
        )}
      </div>
      
      {/* Chart Dimensions */}
      {selectedModelId && (
        <>
          <div className="space-y-3 border-t pt-3">
            <Label className="text-xs font-semibold">Chart Dimensions</Label>
            
            {chartDims.map(dim => {
              const currentValue = getDimensionValue(dim.key)
              const isMultiple = dim.multiple || false
              const values = isMultiple ? (Array.isArray(currentValue) ? currentValue : []) : []
              const singleValue = isMultiple ? '' : (typeof currentValue === 'string' ? currentValue : '')
              
              return (
                <div key={dim.key} className="space-y-2">
                  <Label className="text-xs">
                    {dim.label}
                    {dim.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  
                  {isMultiple ? (
                    <div className="space-y-2">
                      {/* Selected attributes */}
                      {values.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {values.map(attrName => {
                            const attr = attributes.find(a => a.name === attrName)
                            return (
                              <Popover 
                                key={attrName}
                                open={openComboboxes[`${dim.key}-${attrName}`] || false}
                                onOpenChange={(open) => setOpenComboboxes(prev => ({ ...prev, [`${dim.key}-${attrName}`]: open }))}
                              >
                                <PopoverTrigger asChild>
                                  <button
                                    className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                  >
                                    <span>{attr?.display_name || attrName}</span>
                                    <ChevronDown className="h-3 w-3" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                  <Command shouldFilter={false}>
                                    <CommandInput 
                                      placeholder="Search attributes..." 
                                      value={searchQueries[`${dim.key}-${attrName}`] || ''}
                                      onValueChange={(value) => setSearchQuery(`${dim.key}-${attrName}`, value)}
                                    />
                                    <CommandList>
                                      <CommandEmpty>
                                        {attributes.length === 0 
                                          ? 'No attributes available'
                                          : getFilteredAttributes(dim.key, searchQueries[`${dim.key}-${attrName}`]).filter(attr => attr.name !== attrName).length === 0
                                            ? 'No attributes match your search'
                                            : 'No attributes found'}
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {getFilteredAttributes(dim.key, searchQueries[`${dim.key}-${attrName}`])
                                          .filter(attr => attr.name !== attrName)
                                          .map(attr => (
                                            <CommandItem
                                              key={attr.id}
                                              value={`${attr.display_name || attr.name} ${attr.name}`}
                                              onSelect={() => {
                                                // Replace the current attribute
                                                const newValues = values.map(v => v === attrName ? attr.name : v)
                                                setDimensionValue(dim.key, newValues)
                                                setOpenComboboxes(prev => ({ ...prev, [`${dim.key}-${attrName}`]: false }))
                                                setSearchQuery(`${dim.key}-${attrName}`, '')
                                              }}
                                              className="text-gray-900 dark:text-gray-100 cursor-pointer"
                                            >
                                              <span className="text-gray-900 dark:text-gray-100">
                                                {attr.display_name || attr.name}
                                              </span>
                                            </CommandItem>
                                          ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            )
                          })}
                          <button
                            onClick={() => handleAttributeSelect(dim.key, values[values.length - 1])}
                            className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            title="Remove last attribute"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      
                      {/* Drop zone for adding new attributes */}
                      <div
                        className={`relative min-h-[32px] border-2 border-dashed rounded px-3 py-2 flex items-center justify-center cursor-pointer transition-colors ${
                          dragOverDimensions.has(dim.key)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        } ${loading || !selectedModelId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onDragOver={(e) => {
                          if (!loading && selectedModelId) {
                            handleDragOver(e, dim.key)
                          }
                        }}
                        onDragLeave={(e) => handleDragLeave(e, dim.key)}
                        onDrop={(e) => {
                          if (!loading && selectedModelId) {
                            handleAttributeDrop(e, dim.key)
                          }
                        }}
                        onClick={(e) => {
                          if (!loading && selectedModelId) {
                            e.stopPropagation()
                            setOpenComboboxes(prev => ({ ...prev, [dim.key]: true }))
                          }
                        }}
                      >
                        <Popover 
                          open={openComboboxes[dim.key] || false}
                          onOpenChange={(open) => {
                            if (!loading && selectedModelId) {
                              setOpenComboboxes(prev => ({ ...prev, [dim.key]: open }))
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <div 
                              className="flex items-center gap-2 text-xs text-muted-foreground pointer-events-none"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>{selectedModelId ? 'Drag attribute here or click to add' : 'Select a data model first'}</span>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput 
                                placeholder="Search attributes..." 
                                value={searchQueries[dim.key] || ''}
                                onValueChange={(value) => setSearchQuery(dim.key, value)}
                              />
                              <CommandList>
                                {loading ? (
                                  <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading attributes...</div>
                                ) : (
                                  <>
                                    <CommandEmpty>
                                      {attributes.length === 0 
                                        ? (selectedModelId 
                                            ? 'No attributes available for this data model' 
                                            : 'Please select a data model first')
                                        : getFilteredAttributes(dim.key).filter(attr => !values.includes(attr.name)).length === 0
                                          ? 'No attributes match your search'
                                          : 'No attributes found'}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {getFilteredAttributes(dim.key)
                                        .filter(attr => !values.includes(attr.name))
                                        .map(attr => (
                                          <CommandItem
                                            key={attr.id}
                                            value={`${attr.display_name || attr.name} ${attr.name}`}
                                            onSelect={() => {
                                              handleAttributeSelect(dim.key, attr.name)
                                              setSearchQuery(dim.key, '')
                                            }}
                                            className="text-gray-900 dark:text-gray-100 cursor-pointer"
                                          >
                                            <Plus className="mr-2 h-3 w-3 text-gray-900 dark:text-gray-100" />
                                            <span className="text-gray-900 dark:text-gray-100">
                                              {attr.display_name || attr.name}
                                            </span>
                                          </CommandItem>
                                        ))}
                                    </CommandGroup>
                                  </>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {singleValue ? (
                        // Show selected attribute as clickable badge
                        <div
                          className="flex items-center gap-1 w-full"
                        >
                          <Popover 
                            open={openComboboxes[dim.key] || false}
                            onOpenChange={(open) => setOpenComboboxes(prev => ({ ...prev, [dim.key]: open }))}
                          >
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors w-full justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || !selectedModelId}
                              >
                                <span className="truncate">
                                  {attributes.find(a => a.name === singleValue)?.display_name || singleValue}
                                </span>
                                <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                              <Command shouldFilter={false}>
                                <CommandInput 
                                  placeholder="Search attributes..." 
                                  value={searchQueries[dim.key] || ''}
                                  onValueChange={(value) => setSearchQuery(dim.key, value)}
                                  disabled={loading}
                                />
                                <CommandList>
                                  {loading ? (
                                    <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading attributes...</div>
                                  ) : (
                                    <>
                                      <CommandEmpty>
                                        {attributes.length === 0 
                                          ? (selectedModelId 
                                              ? 'No attributes available for this data model' 
                                              : 'Please select a data model first')
                                          : getFilteredAttributes(dim.key).length === 0
                                            ? 'No attributes match your search'
                                            : 'No attributes found'}
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {getFilteredAttributes(dim.key).map(attr => (
                                          <CommandItem
                                            key={attr.id}
                                            value={`${attr.display_name || attr.name} ${attr.name}`}
                                            onSelect={() => {
                                              setDimensionValue(dim.key, attr.name)
                                              setOpenComboboxes(prev => ({ ...prev, [dim.key]: false }))
                                              setSearchQuery(dim.key, '') // Clear search after selection
                                            }}
                                            className="text-gray-900 dark:text-gray-100 cursor-pointer"
                                          >
                                            <Check
                                              className={`mr-2 h-3 w-3 ${
                                                singleValue === attr.name ? 'opacity-100' : 'opacity-0'
                                              }`}
                                            />
                                            <span className="text-gray-900 dark:text-gray-100">
                                              {attr.display_name || attr.name}
                                            </span>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </>
                                  )}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <button
                            onClick={() => setDimensionValue(dim.key, '')}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 transition-colors"
                            title="Remove attribute"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        // Drop zone when no attribute selected
                        <div
                          className={`relative min-h-[32px] border-2 border-dashed rounded px-3 py-2 flex items-center justify-center cursor-pointer transition-colors ${
                            dragOverDimensions.has(dim.key)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          } ${loading || !selectedModelId ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onDragOver={(e) => {
                            if (!loading && selectedModelId) {
                              handleDragOver(e, dim.key)
                            }
                          }}
                          onDragLeave={(e) => handleDragLeave(e, dim.key)}
                          onDrop={(e) => {
                            if (!loading && selectedModelId) {
                              handleAttributeDrop(e, dim.key)
                            }
                          }}
                          onClick={(e) => {
                            if (!loading && selectedModelId) {
                              e.stopPropagation()
                              setOpenComboboxes(prev => ({ ...prev, [dim.key]: true }))
                            }
                          }}
                        >
                          <Popover 
                            open={openComboboxes[dim.key] || false}
                            onOpenChange={(open) => {
                              if (!loading && selectedModelId) {
                                setOpenComboboxes(prev => ({ ...prev, [dim.key]: open }))
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <div 
                                className="flex items-center gap-2 text-xs text-muted-foreground pointer-events-none"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>{selectedModelId ? 'Drag attribute here or click to select' : 'Select a data model first'}</span>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Command shouldFilter={false}>
                                <CommandInput 
                                  placeholder="Search attributes..." 
                                  value={searchQueries[dim.key] || ''}
                                  onValueChange={(value) => setSearchQuery(dim.key, value)}
                                  disabled={loading}
                                />
                                <CommandList>
                                  {loading ? (
                                    <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading attributes...</div>
                                  ) : (
                                    <>
                                      <CommandEmpty>
                                        {attributes.length === 0 
                                          ? (selectedModelId 
                                              ? 'No attributes available for this data model' 
                                              : 'Please select a data model first')
                                          : getFilteredAttributes(dim.key).length === 0
                                            ? 'No attributes match your search'
                                            : 'No attributes found'}
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {getFilteredAttributes(dim.key).map(attr => (
                                          <CommandItem
                                            key={attr.id}
                                            value={`${attr.display_name || attr.name} ${attr.name}`}
                                            onSelect={() => {
                                              setDimensionValue(dim.key, attr.name)
                                              setOpenComboboxes(prev => ({ ...prev, [dim.key]: false }))
                                              setSearchQuery(dim.key, '') // Clear search after selection
                                            }}
                                          >
                                            {attr.display_name || attr.name}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </>
                                  )}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
        </>
      )}
      
      {!selectedModelId && (
        <div className="text-xs text-muted-foreground text-center py-4">
          Select a data model to configure chart dimensions
        </div>
      )}
    </div>
  )
}

