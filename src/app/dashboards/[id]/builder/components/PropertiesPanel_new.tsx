'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Database, Hash, Calendar as CalendarIcon, Type as TypeIcon } from 'lucide-react'
import { DashboardElement, DataSource } from '../hooks/useDashboardState'
import { IconPicker } from './IconPicker'
import ReactDOM from 'react-dom'

interface PropertiesPanelProps {
  selectedElement: DashboardElement | null
  dataSources: DataSource[]
  gridSize: number
  canvasWidth: number
  canvasHeight: number
  showPixelMode: boolean
  onUpdateElement: (elementId: string, updates: Partial<DashboardElement>) => void
  gridToPixel: (gridValue: number, gridSize: number, canvasSize: number) => number
}

export function PropertiesPanel({
  selectedElement,
  dataSources,
  gridSize,
  canvasWidth,
  canvasHeight,
  showPixelMode,
  onUpdateElement,
  gridToPixel
}: PropertiesPanelProps) {
  const [availableFields, setAvailableFields] = React.useState<Array<{ name: string; type?: string }>>([])
  const selectedModelId = selectedElement?.data_config?.data_model_id || ''

  const getTypeBadgeClass = (type?: string) => {
    const t = (type || '').toLowerCase()
    if (t.includes('int') || t.includes('num') || t.includes('dec') || t.includes('float') || t.includes('double')) {
      return 'bg-amber-100 text-amber-800'
    }
    if (t.includes('date') || t.includes('time')) {
      return 'bg-emerald-100 text-emerald-800'
    }
    if (t.includes('bool')) {
      return 'bg-purple-100 text-purple-800'
    }
    return 'bg-gray-100 text-gray-700'
  }

  const getAttributeIcon = (type?: string) => {
    const t = (type || '').toLowerCase()
    if (t.includes('int') || t.includes('num') || t.includes('dec') || t.includes('float') || t.includes('double')) return Hash
    if (t.includes('date') || t.includes('time')) return CalendarIcon
    return TypeIcon
  }

  React.useEffect(() => {
    let cancelled = false
    const loadFields = async () => {
      if (!selectedModelId) { setAvailableFields([]); return }
      try {
        // Try to load attributes for the selected data model
        const res = await fetch(`/api/data-models/${selectedModelId}/fields`)
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setAvailableFields(Array.isArray(data?.fields) ? data.fields : [])
        } else {
          if (!cancelled) setAvailableFields([])
        }
      } catch {
        if (!cancelled) setAvailableFields([])
      }
    }
    loadFields()
    return () => { cancelled = true }
  }, [selectedModelId])
  if (!selectedElement) {
    return (
      <div className="w-80 bg-background border-l flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Select an element to edit its properties</p>
        </div>
      </div>
    )
  }

  // Determine if the selected element is a chart element
  const chartKinds = new Set([
    'BAR','COLUMN','LINE','AREA','PIE','DONUT','SCATTER','RADAR','RADIALBAR','GAUGE','HEATMAP','TREEMAP','BUBBLE','FUNNEL','WATERFALL','TABLE','PIVOT','BUTTON'
  ])
  const selectedKind = (selectedElement.chart_type || selectedElement.type || '').toUpperCase()
  const isChartElement = chartKinds.has(selectedKind)

  return (
    <div className="w-80 bg-background border-l flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Element Properties</h3>
        <p className="text-sm text-muted-foreground">{selectedElement.name}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="w-full">
          <Tabs defaultValue={isChartElement ? "data" : "layout"}>
            <TabsList className={`grid w-full ${isChartElement ? 'grid-cols-3' : 'grid-cols-1'}`}>
              {isChartElement && <TabsTrigger value="data">Data</TabsTrigger>}
              {isChartElement && <TabsTrigger value="chart">Chart</TabsTrigger>}
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>
            
            {isChartElement && (
              <TabsContent value="data" className="space-y-4">
                {/* Available Fields (drag to Dimensions or Measures) */}
            <div>
              <Label>Fields</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(availableFields || []).map((f) => (
                  <div
                    key={f.name}
                    className="p-2 border rounded cursor-move bg-muted/50 hover:bg-muted transition-colors"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', f.name)
                    }}
                  >
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{f.type || 'text'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Model Selection */}
            <div>
              <Label>Data Model</Label>
              <Select
                value={selectedElement.data_config?.data_model_id || ''}
                onValueChange={(value) => onUpdateElement(selectedElement.id, {
                  data_config: { ...selectedElement.data_config, data_model_id: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a data model" />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dimensions and Measures based on chart type */}
            {selectedElement.chart_type === 'TABLE' ? (
              <div>
                <Label>Columns</Label>
                <div className="space-y-2">
                  {(selectedElement.data_config?.dimensions || []).map((dim, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Select
                        value={dim || ''}
                        onValueChange={(value) => {
                          const newDims = [...(selectedElement.data_config?.dimensions || [])]
                          newDims[idx] = value
                          onUpdateElement(selectedElement.id, {
                            data_config: { ...selectedElement.data_config, dimensions: newDims }
                          })
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields.map((f) => {
                            const Icon = getAttributeIcon(f.type)
                            return (
                              <SelectItem key={f.name} value={f.name}>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="truncate">{f.name}</span>
                                  </div>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${getTypeBadgeClass(f.type)}`}>{f.type || 'text'}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newDims = (selectedElement.data_config?.dimensions || []).filter((_, i) => i !== idx)
                          onUpdateElement(selectedElement.id, {
                            data_config: { ...selectedElement.data_config, dimensions: newDims }
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newDims = [...(selectedElement.data_config?.dimensions || []), '']
                      onUpdateElement(selectedElement.id, {
                        data_config: { ...selectedElement.data_config, dimensions: newDims }
                      })
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Column
                  </Button>
                </div>
              </div>
            ) : selectedElement.chart_type === 'PIE' || selectedElement.chart_type === 'DONUT' ? (
              <>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={selectedElement.data_config?.dimensions?.[0] || ''}
                    onValueChange={(value) => onUpdateElement(selectedElement.id, {
                      data_config: { ...selectedElement.data_config, dimensions: [value] }
                    })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select category field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((f) => {
                        const Icon = getAttributeIcon(f.type)
                        return (
                          <SelectItem key={f.name} value={f.name}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="truncate">{f.name}</span>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${getTypeBadgeClass(f.type)}`}>{f.type || 'text'}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Value</Label>
                  <Select
                    value={selectedElement.data_config?.measures?.[0] || ''}
                    onValueChange={(value) => onUpdateElement(selectedElement.id, {
                      data_config: { ...selectedElement.data_config, measures: [value] }
                    })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select value field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((f) => {
                        const Icon = getAttributeIcon(f.type)
                        return (
                          <SelectItem key={f.name} value={f.name}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="truncate">{f.name}</span>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${getTypeBadgeClass(f.type)}`}>{f.type || 'text'}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label>Dimensions</Label>
                  <div className="space-y-2">
                    {(selectedElement.data_config?.dimensions || []).map((dim, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Select
                          value={dim || ''}
                          onValueChange={(value) => {
                            const newDims = [...(selectedElement.data_config?.dimensions || [])]
                            newDims[idx] = value
                            onUpdateElement(selectedElement.id, {
                              data_config: { ...selectedElement.data_config, dimensions: newDims }
                            })
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs flex-1">
                            <SelectValue placeholder="Select dimension" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.map((f) => {
                              const Icon = getAttributeIcon(f.type)
                              return (
                                <SelectItem key={f.name} value={f.name}>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="truncate">{f.name}</span>
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${getTypeBadgeClass(f.type)}`}>{f.type || 'text'}</span>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newDims = (selectedElement.data_config?.dimensions || []).filter((_, i) => i !== idx)
                            onUpdateElement(selectedElement.id, {
                              data_config: { ...selectedElement.data_config, dimensions: newDims }
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newDims = [...(selectedElement.data_config?.dimensions || []), '']
                        onUpdateElement(selectedElement.id, {
                          data_config: { ...selectedElement.data_config, dimensions: newDims }
                        })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Dimension
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Measures</Label>
                  <div className="space-y-2">
                    {(selectedElement.data_config?.measures || []).map((measure, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Select
                          value={measure || ''}
                          onValueChange={(value) => {
                            const newMeasures = [...(selectedElement.data_config?.measures || [])]
                            newMeasures[idx] = value
                            onUpdateElement(selectedElement.id, {
                              data_config: { ...selectedElement.data_config, measures: newMeasures }
                            })
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs flex-1">
                            <SelectValue placeholder="Select measure" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.map((f) => {
                              const Icon = getAttributeIcon(f.type)
                              return (
                                <SelectItem key={f.name} value={f.name}>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="truncate">{f.name}</span>
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${getTypeBadgeClass(f.type)}`}>{f.type || 'text'}</span>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newMeasures = (selectedElement.data_config?.measures || []).filter((_, i) => i !== idx)
                            onUpdateElement(selectedElement.id, {
                              data_config: { ...selectedElement.data_config, measures: newMeasures }
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newMeasures = [...(selectedElement.data_config?.measures || []), '']
                        onUpdateElement(selectedElement.id, {
                          data_config: { ...selectedElement.data_config, measures: newMeasures }
                        })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Measure
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Filters */}
            <div>
              <Label>Filters</Label>
              <div className="space-y-2">
                {(selectedElement.data_config?.filters || []).map((filter, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                    <Input
                      value={filter.field}
                      onChange={(e) => {
                        const newFilters = [...(selectedElement.data_config?.filters || [])]
                        newFilters[idx] = { ...newFilters[idx], field: e.target.value }
                        onUpdateElement(selectedElement.id, {
                          data_config: { ...selectedElement.data_config, filters: newFilters }
                        })
                      }}
                      placeholder="Field"
                      className="flex-1"
                    />
                    <Select
                      value={filter.operator}
                      onValueChange={(value) => {
                        const newFilters = [...(selectedElement.data_config?.filters || [])]
                        newFilters[idx] = { ...newFilters[idx], operator: value }
                        onUpdateElement(selectedElement.id, {
                          data_config: { ...selectedElement.data_config, filters: newFilters }
                        })
                      }}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="=">=</SelectItem>
                        <SelectItem value="!=">!=</SelectItem>
                        <SelectItem value=">">{'>'}</SelectItem>
                        <SelectItem value="<">{'<'}</SelectItem>
                        <SelectItem value=">=">{'>='}</SelectItem>
                        <SelectItem value="<=">{'<='}</SelectItem>
                        <SelectItem value="contains">contains</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={filter.value}
                      onChange={(e) => {
                        const newFilters = [...(selectedElement.data_config?.filters || [])]
                        newFilters[idx] = { ...newFilters[idx], value: e.target.value }
                        onUpdateElement(selectedElement.id, {
                          data_config: { ...selectedElement.data_config, filters: newFilters }
                        })
                      }}
                      placeholder="Value"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newFilters = (selectedElement.data_config?.filters || []).filter((_, i) => i !== idx)
                        onUpdateElement(selectedElement.id, {
                          data_config: { ...selectedElement.data_config, filters: newFilters }
                        })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newFilters = [...(selectedElement.data_config?.filters || []), { field: '', operator: '=', value: '' }]
                    onUpdateElement(selectedElement.id, {
                      data_config: { ...selectedElement.data_config, filters: newFilters }
                    })
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Filter
                </Button>
              </div>
            </div>
          </TabsContent>
          )}
          
          {isChartElement && (
          <TabsContent value="chart" className="space-y-4">
            <div>
              <Label>Chart Title</Label>
              <Input
                value={selectedElement.name}
                onChange={(e) => onUpdateElement(selectedElement.id, { name: e.target.value })}
                placeholder="Enter chart title"
              />
            </div>
            <div>
              <Label>Chart Type</Label>
              <Select
                value={selectedElement.chart_type || ''}
                onValueChange={(value) => onUpdateElement(selectedElement.id, { chart_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAR">Bar Chart</SelectItem>
                  <SelectItem value="LINE">Line Chart</SelectItem>
                  <SelectItem value="AREA">Area Chart</SelectItem>
                  <SelectItem value="PIE">Pie Chart</SelectItem>
                  <SelectItem value="DONUT">Donut Chart</SelectItem>
                  <SelectItem value="SCATTER">Scatter Plot</SelectItem>
                  <SelectItem value="RADAR">Radar Chart</SelectItem>
                  <SelectItem value="TABLE">Table</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Show Legend</Label>
              <Switch
                checked={selectedElement.config?.showLegend !== false}
                onCheckedChange={(checked) => onUpdateElement(selectedElement.id, {
                  config: { ...selectedElement.config, showLegend: checked }
                })}
              />
            </div>
            <div>
              <Label>Show Grid</Label>
              <Switch
                checked={selectedElement.config?.showGrid !== false}
                onCheckedChange={(checked) => onUpdateElement(selectedElement.id, {
                  config: { ...selectedElement.config, showGrid: checked }
                })}
              />
            </div>
          </TabsContent>
          )}
          
          <TabsContent value="layout" className="space-y-4">
            <div>
              <Label>Element Name</Label>
              <Input
                value={selectedElement.name}
                onChange={(e) => onUpdateElement(selectedElement.id, { name: e.target.value })}
                placeholder="Enter element name"
              />
            </div>
            <div>
              <Label>Position</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X</Label>
                  <Input
                    type="number"
                    value={showPixelMode ? 
                      Math.round((selectedElement.config?.freeform?.x || 0)) : 
                      selectedElement.position_x
                    }
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      if (showPixelMode) {
                        onUpdateElement(selectedElement.id, {
                          config: { ...selectedElement.config, freeform: { ...selectedElement.config?.freeform, x: value } }
                        })
                      } else {
                        onUpdateElement(selectedElement.id, { position_x: value })
                      }
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Y</Label>
                  <Input
                    type="number"
                    value={showPixelMode ? 
                      Math.round((selectedElement.config?.freeform?.y || 0)) : 
                      selectedElement.position_y
                    }
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      if (showPixelMode) {
                        onUpdateElement(selectedElement.id, {
                          config: { ...selectedElement.config, freeform: { ...selectedElement.config?.freeform, y: value } }
                        })
                      } else {
                        onUpdateElement(selectedElement.id, { position_y: value })
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Size</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Width</Label>
                  <Input
                    type="number"
                    value={showPixelMode ? 
                      Math.round((selectedElement.config?.freeform?.w || 0)) : 
                      selectedElement.width
                    }
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      if (showPixelMode) {
                        onUpdateElement(selectedElement.id, {
                          config: { ...selectedElement.config, freeform: { ...selectedElement.config?.freeform, w: value } }
                        })
                      } else {
                        onUpdateElement(selectedElement.id, { width: value })
                      }
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Height</Label>
                  <Input
                    type="number"
                    value={showPixelMode ? 
                      Math.round((selectedElement.config?.freeform?.h || 0)) : 
                      selectedElement.height
                    }
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      if (showPixelMode) {
                        onUpdateElement(selectedElement.id, {
                          config: { ...selectedElement.config, freeform: { ...selectedElement.config?.freeform, h: value } }
                        })
                      } else {
                        onUpdateElement(selectedElement.id, { height: value })
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Z-Index</Label>
              <Input
                type="number"
                value={selectedElement.z_index}
                onChange={(e) => onUpdateElement(selectedElement.id, { z_index: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={selectedElement.is_visible !== false}
                onCheckedChange={(checked) => onUpdateElement(selectedElement.id, { is_visible: checked })}
              />
              <Label>Visible</Label>
            </div>
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
