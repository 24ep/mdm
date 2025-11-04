'use client'

import React, { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Database } from 'lucide-react'
import { PlacedWidget } from './widgets'
import { ChartDataSourceConfigProps, Attribute } from './chartDataSourceTypes'
import { CHART_DIMENSIONS, isValueMetricDimension } from './chartDimensions'
import { getEffectiveType } from './chartDataSourceUtils'
import { useDataModels, useAttributes } from './useChartDataSource'
import { AttributeDropZone } from './AttributeDropZone'

// Aggregation types for value/metric dimensions
export type AggregationType = 'SUM' | 'AVG' | 'COUNT' | 'COUNT_DISTINCT' | 'MIN' | 'MAX' | 'NONE'

export function ChartDataSourceConfig({
  widget,
  setPlacedWidgets,
  spaceId,
}: ChartDataSourceConfigProps) {
  const { dataModels, loading: loadingModels } = useDataModels(spaceId)
  
  // Support both camelCase and snake_case for backward compatibility
  const initialModelId = (widget.properties?.dataModelId 
    || (widget.properties as any)?.data_model_id 
    || (widget as any)?.data_config?.data_model_id 
    || (widget as any)?.data_config?.dataModelId 
    || '') as string
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId)
  
  const { attributes, loading } = useAttributes(selectedModelId, spaceId)
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({})
  const [openComboboxes, setOpenComboboxes] = useState<Record<string, boolean>>({})
  const [dragOverDimensions, setDragOverDimensions] = useState<Set<string>>(new Set())
  const [draggingBadge, setDraggingBadge] = useState<{ dimKey: string; index: number } | null>(null)
  const [dragOverBadge, setDragOverBadge] = useState<{ dimKey: string; index: number } | null>(null)
  
  // Per-dimension overrides for how to treat an attribute's type (e.g., as text/number/date)
  const [attributeTypeOverrides, setAttributeTypeOverrides] = useState<Record<string, Record<string, string>>>(
    (widget.properties?.chartDimensionTypeOverrides as Record<string, Record<string, string>>) || {}
  )
  
  // Per-dimension aggregation overrides for value/metric attributes
  const [attributeAggregations, setAttributeAggregations] = useState<Record<string, Record<string, AggregationType>>>(
    (widget.properties?.chartDimensionAggregations as Record<string, Record<string, AggregationType>>) || {}
  )
  
  // Sync selectedModelId with widget properties
  useEffect(() => {
    const modelId = (widget.properties?.dataModelId 
      || (widget.properties as any)?.data_model_id 
      || (widget as any)?.data_config?.data_model_id 
      || (widget as any)?.data_config?.dataModelId 
      || '') as string
    if (modelId && modelId !== selectedModelId) {
      setSelectedModelId(modelId)
    }
  }, [
    widget.properties?.dataModelId,
    (widget.properties as any)?.data_model_id,
    (widget as any)?.data_config?.data_model_id,
    (widget as any)?.data_config?.dataModelId,
    selectedModelId,
  ])
  
  // If models load and none selected, auto-select the only model
  useEffect(() => {
    if (!selectedModelId && dataModels.length === 1) {
      const only = dataModels[0]
      const modelId = (only as any).id || (only as any)._id || String(only)
      setSelectedModelId(modelId)
      setPlacedWidgets(prev => prev.map(w => 
        w.id === widget.id 
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
  }, [dataModels, selectedModelId, setPlacedWidgets, widget.id])
  
  // Get chart dimensions configuration
  const chartDims = CHART_DIMENSIONS[widget.type] || [
    { key: 'dimension', label: 'Dimension', required: true },
    { key: 'metric', label: 'Metric', required: true },
  ]
  
  // Update widget property
  const updateProperty = (key: string, value: any) => {
    setPlacedWidgets(prev => prev.map(w => 
      w.id === widget.id 
        ? { ...w, properties: { ...w.properties, [key]: value } }
        : w
    ))
  }
  
  // Persist a denormalized map of effective types per dimension for visualization layer
  const recomputeAndPersistEffectiveTypes = (nextChartDimensions?: Record<string, any>) => {
    const dims = (nextChartDimensions || widget.properties?.chartDimensions || {}) as Record<string, any>
    const result: Record<string, Record<string, string>> = {}
    Object.keys(dims).forEach((dimKey) => {
      const value = dims[dimKey]
      const values: string[] = Array.isArray(value) ? value : (value ? [value] : [])
      if (values.length > 0) {
        const map: Record<string, string> = {}
        values.forEach((name) => {
          const attr = attributes.find(a => a.name === name)
          const eff = getEffectiveType(dimKey, attr, attributeTypeOverrides)
          map[name] = eff
        })
        result[dimKey] = map
      }
    })
    updateProperty('chartDimensionsEffectiveTypes', result)
  }
  
  // Get current dimension value
  const getDimensionValue = (dimKey: string): string | string[] => {
    const dims = widget.properties?.chartDimensions || {}
    return dims[dimKey] || (CHART_DIMENSIONS[widget.type]?.find(d => d.key === dimKey)?.multiple ? [] : '')
  }
  
  // Set dimension value
  const setDimensionValue = (dimKey: string, value: string | string[]) => {
    const dims = widget.properties?.chartDimensions || {}
    const next = { ...dims, [dimKey]: value }
    updateProperty('chartDimensions', next)
    recomputeAndPersistEffectiveTypes(next)
  }
  
  // Handle model selection
  const handleModelChange = (modelId: string) => {
    console.log('handleModelChange called with:', modelId)
    if (!modelId || modelId === 'none') return
    
    setSelectedModelId(modelId)
    setPlacedWidgets(prev => prev.map(w => 
      w.id === widget.id 
        ? { 
            ...w, 
            properties: { 
              ...w.properties, 
              dataModelId: modelId, 
              dataSource: 'data-model', // Ensure data source is set to data-model
              // @ts-ignore legacy
              data_model_id: modelId 
            } 
          }
        : w
    ))
    // Clear dimensions when model changes
    updateProperty('chartDimensions', {})
  }
  
  // Handle attribute selection for dimension
  const handleAttributeSelect = (dimKey: string, attributeName: string) => {
    const dim = chartDims.find(d => d.key === dimKey)
    const isValueMetric = isValueMetricDimension(dimKey)
    
    if (dim?.multiple) {
      const current = Array.isArray(getDimensionValue(dimKey)) ? getDimensionValue(dimKey) as string[] : []
      if (current.includes(attributeName)) {
        setDimensionValue(dimKey, current.filter(a => a !== attributeName))
        // Remove aggregation when attribute is removed
        if (isValueMetric) {
          setAttributeAggregations(prev => {
            const updated = { ...prev }
            if (updated[dimKey]) {
              const { [attributeName]: _, ...rest } = updated[dimKey]
              updated[dimKey] = rest
            }
            updateProperty('chartDimensionAggregations', updated)
            return updated
          })
        }
      } else {
        setDimensionValue(dimKey, [...current, attributeName])
        // Force aggregation for value/metric dimensions - default to SUM for numbers, COUNT for others
        if (isValueMetric) {
          const attr = attributes.find(a => a.name === attributeName)
          const isNumeric = attr?.type?.toLowerCase().includes('number') || 
                           attr?.type?.toLowerCase().includes('integer') ||
                           attr?.type?.toLowerCase().includes('decimal') ||
                           attr?.type?.toLowerCase().includes('float')
          const defaultAggregation: AggregationType = isNumeric ? 'SUM' : 'COUNT'
          
          setAttributeAggregations(prev => {
            const updated = {
              ...prev,
              [dimKey]: {
                ...(prev[dimKey] || {}),
                [attributeName]: defaultAggregation
              }
            }
            updateProperty('chartDimensionAggregations', updated)
            return updated
          })
        }
      }
    } else {
      setDimensionValue(dimKey, attributeName)
      // Force aggregation for value/metric dimensions
      if (isValueMetric) {
        const attr = attributes.find(a => a.name === attributeName)
        const isNumeric = attr?.type?.toLowerCase().includes('number') || 
                         attr?.type?.toLowerCase().includes('integer') ||
                         attr?.type?.toLowerCase().includes('decimal') ||
                         attr?.type?.toLowerCase().includes('float')
        const defaultAggregation: AggregationType = isNumeric ? 'SUM' : 'COUNT'
        
        setAttributeAggregations(prev => {
          const updated = {
            ...prev,
            [dimKey]: {
              [attributeName]: defaultAggregation
            }
          }
          updateProperty('chartDimensionAggregations', updated)
          return updated
        })
      }
    }
  }
  
  // Handle aggregation change for value/metric attributes
  const handleAggregationChange = (dimKey: string, attrName: string, aggregation: AggregationType) => {
    setAttributeAggregations(prev => {
      const updated = {
        ...prev,
        [dimKey]: {
          ...(prev[dimKey] || {}),
          [attrName]: aggregation
        }
      }
      updateProperty('chartDimensionAggregations', updated)
      return updated
    })
  }

  // Handle badge reorder within drop zone
  const handleBadgeReorder = (dimKey: string, fromIndex: number, toIndex: number) => {
    const current = Array.isArray(getDimensionValue(dimKey)) ? getDimensionValue(dimKey) as string[] : []
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= current.length || toIndex >= current.length) {
      return
    }
    const reordered = Array.from(current)
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    setDimensionValue(dimKey, reordered)
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
      
      const { attribute, model } = parsed
      if (attribute && attribute.name) {
        // If no model is selected, auto-select the model from the dropped attribute
        if (!selectedModelId && model && model.id) {
          handleModelChange(model.id)
        }
        console.log('Setting attribute:', attribute.name, 'for dimension:', dimKey)
        // handleAttributeSelect will automatically set aggregation for value/metric dimensions
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

  const setTypeOverride = (dimKey: string, attrName: string, nextType: string) => {
    setAttributeTypeOverrides(prev => {
      const updated: Record<string, Record<string, string>> = {
        ...prev,
        [dimKey]: {
          ...(prev[dimKey] || {}),
          [attrName]: nextType,
        }
      }
      updateProperty('chartDimensionTypeOverrides', updated)
      recomputeAndPersistEffectiveTypes()
      return updated
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
                  
                  <AttributeDropZone
                    dimKey={dim.key}
                    dimLabel={dim.label}
                    required={dim.required}
                    isMultiple={isMultiple}
                    values={values}
                    singleValue={singleValue}
                    attributes={attributes}
                    selectedModelId={selectedModelId}
                    loading={loading}
                    searchQuery={searchQueries[dim.key] || ''}
                    onSearchChange={(query) => {
                      setSearchQueries(prev => ({ ...prev, [dim.key]: query }))
                    }}
                    onAttributeSelect={handleAttributeSelect}
                    onDimensionValueChange={(dimKey, value) => setDimensionValue(dimKey, value)}
                    attributeTypeOverrides={attributeTypeOverrides}
                    onTypeOverride={setTypeOverride}
                    isValueMetric={isValueMetricDimension(dim.key)}
                    attributeAggregations={attributeAggregations[dim.key] || {}}
                    onAggregationChange={handleAggregationChange}
                    dragOverDimensions={dragOverDimensions}
                    draggingBadge={draggingBadge}
                    dragOverBadge={dragOverBadge}
                    onDragStart={(dimKey, index) => setDraggingBadge({ dimKey, index })}
                    onDragOver={(dimKey, index) => setDragOverBadge({ dimKey, index })}
                    onDragLeave={() => setDragOverBadge(null)}
                    onDrop={handleBadgeReorder}
                    onDragEnd={() => {
                      setDraggingBadge(null)
                      setDragOverBadge(null)
                    }}
                    onDragOverZone={handleDragOver}
                    onDragLeaveZone={handleDragLeave}
                    onDropZone={handleAttributeDrop}
                    openCombobox={openComboboxes[dim.key] || false}
                    onOpenChange={(open) => setOpenComboboxes(prev => ({ ...prev, [dim.key]: open }))}
                  />
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
