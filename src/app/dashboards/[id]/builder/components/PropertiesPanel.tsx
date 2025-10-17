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
import { Plus, Trash2 } from 'lucide-react'
import { DashboardElement } from '../hooks/useDashboardState'
import { IconPicker } from './IconPicker'
import { EnhancedColorPicker } from '@/components/ui/EnhancedColorPicker'
import ReactDOM from 'react-dom'

interface PropertiesPanelProps {
  selectedElement: DashboardElement | null
  gridSize: number
  canvasWidth: number
  canvasHeight: number
  showPixelMode: boolean
  onUpdateElement: (elementId: string, updates: Partial<DashboardElement>) => void
  gridToPixel: (gridValue: number, gridSize: number, canvasSize: number) => number
}

export function PropertiesPanel({
  selectedElement,
  gridSize,
  canvasWidth,
  canvasHeight,
  showPixelMode,
  onUpdateElement,
  gridToPixel
}: PropertiesPanelProps) {
  
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
        <h3 className="font-semibold" style={{ fontFamily: 'Roboto, sans-serif' }}>Element Properties</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue={isChartElement ? "data" : "layout"} className="w-full">
          <TabsList className={`grid w-full ${isChartElement ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="data">Data</TabsTrigger>
            {isChartElement && <TabsTrigger value="chart">Chart</TabsTrigger>}
            <TabsTrigger value="layout">Layout</TabsTrigger>
          </TabsList>
          


          {/* Data tab for all elements */}
          <TabsContent value="data" className="space-y-4">
            <div>
              <Label>Data Model</Label>
                <Select
                value={(selectedElement.data_config?.data_model_id ?? 'none') as any}
                  onValueChange={(value) => onUpdateElement(selectedElement.id, {
                  data_config: { ...(selectedElement.data_config || {}), data_model_id: (value === 'none' ? null : value) }
                  })}
                >
                <SelectTrigger>
                  <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                  {/* TODO: populate from settings models via props or store */}
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="model_sales">Sales</SelectItem>
                  <SelectItem value="model_customers">Customers</SelectItem>
                  </SelectContent>
                </Select>
            </div>

            {/* Element-specific mapping */}
            {(() => {
              const type = (selectedElement.type || '').toUpperCase()
              const ct = (selectedElement.chart_type || '').toUpperCase()
              // Simple field inputs by element kind
              if (type === 'TEXT') {
                return (
              <div>
                    <Label>Text field</Label>
                  <Input
                    value={selectedElement.data_config?.dimensions?.[0] || ''}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                        data_config: { ...(selectedElement.data_config || {}), dimensions: [e.target.value] }
                      })}
                  />
                </div>
                )
              }
              if (type === 'KPI' || type === 'METRIC') {
                return (
            <div>
                    <Label>Value field</Label>
                  <Input
                    value={selectedElement.data_config?.measures?.[0] || ''}
                onChange={(e) => onUpdateElement(selectedElement.id, {
                        data_config: { ...(selectedElement.data_config || {}), measures: [e.target.value] }
                      })}
              />
            </div>
                )
              }
              if (type === 'PROGRESS') {
                const dims = selectedElement.data_config?.dimensions || []
                const meas = selectedElement.data_config?.measures || []
                return (
                  <div className="grid grid-cols-2 gap-2">
              <div>
                      <Label>Value</Label>
                      <Input value={meas[0] || ''} onChange={(e)=> onUpdateElement(selectedElement.id, { data_config: { ...(selectedElement.data_config||{}), measures: [e.target.value, meas[1] || ''] } })} />
              </div>
              <div>
                      <Label>Max</Label>
                      <Input value={meas[1] || ''} onChange={(e)=> onUpdateElement(selectedElement.id, { data_config: { ...(selectedElement.data_config||{}), measures: [meas[0] || '', e.target.value] } })} />
                    </div>
                </div>
                )
              }
              if (type === 'IMAGE') {
                return (
            <div>
                    <Label>Image URL field</Label>
                    <Input
                      value={selectedElement.data_config?.dimensions?.[0] || ''}
                      onChange={(e) => onUpdateElement(selectedElement.id, {
                        data_config: { ...(selectedElement.data_config || {}), dimensions: [e.target.value] }
                      })}
                    />
                  </div>
                )
              }
              // Charts: category/value minimal
              if (ct === 'TABLE') {
                return (
                  <div>
                    <Label>Columns</Label>
                    <Input
                      value={(selectedElement.data_config?.dimensions||[]).join(', ')}
                      onChange={(e)=> onUpdateElement(selectedElement.id, { data_config: { ...(selectedElement.data_config||{}), dimensions: e.target.value.split(',').map(s=>s.trim()) } })}
                    />
                  </div>
                )
              }
              if (ct === 'PIE' || ct === 'DONUT') {
                return (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Category</Label>
                      <Input value={selectedElement.data_config?.dimensions?.[0] || ''} onChange={(e)=> onUpdateElement(selectedElement.id, { data_config: { ...(selectedElement.data_config||{}), dimensions: [e.target.value] } })} />
                    </div>
                    <div>
                      <Label>Value</Label>
                      <Input value={selectedElement.data_config?.measures?.[0] || ''} onChange={(e)=> onUpdateElement(selectedElement.id, { data_config: { ...(selectedElement.data_config||{}), measures: [e.target.value] } })} />
                    </div>
                  </div>
                )
              }
              if (isChartElement) {
                return (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Dimension</Label>
                      <Input value={selectedElement.data_config?.dimensions?.[0] || ''} onChange={(e)=> onUpdateElement(selectedElement.id, { data_config: { ...(selectedElement.data_config||{}), dimensions: [e.target.value] } })} />
                    </div>
                    <div>
                      <Label>Measure</Label>
                      <Input value={selectedElement.data_config?.measures?.[0] || ''} onChange={(e)=> onUpdateElement(selectedElement.id, { data_config: { ...(selectedElement.data_config||{}), measures: [e.target.value] } })} />
              </div>
            </div>
                )
              }
              return null
            })()}
          </TabsContent>

          {isChartElement && (
          <TabsContent value="chart" className="space-y-4">
              <div>
              <Label>Title</Label>
                <Input
                value={selectedElement.name}
                onChange={(e) => onUpdateElement(selectedElement.id, { name: e.target.value })}
              />
            </div>
            <div>
              <Label>Type</Label>
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
              <Label>Legend</Label>
              <Switch
                checked={selectedElement.config?.showLegend !== false}
                onCheckedChange={(checked) => onUpdateElement(selectedElement.id, {
                  config: { ...selectedElement.config, showLegend: checked }
                })}
                />
              </div>
            <div>
              <Label>Grid</Label>
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

            {(() => {
              const kind = (selectedElement.chart_type || selectedElement.type || '').toUpperCase()
              if (kind === 'WEB_PAGE' || kind === 'IFRAME' || kind === 'YOUTUBE' || kind === 'VIDEO') {
                return (
                  <div>
                    <Label>URL</Label>
                    <Input
                      value={String((selectedElement.config as any)?.url || (selectedElement.config as any)?.src || '')}
                      onChange={(e) => {
                        const val = e.target.value
                        const cfg: any = { ...(selectedElement.config || {}) }
                        if (kind === 'WEB_PAGE' || kind === 'YOUTUBE') {
                          cfg.url = val
                        } else {
                          cfg.src = val
                        }
                        onUpdateElement(selectedElement.id, { config: cfg })
                      }}
                      placeholder={kind === 'YOUTUBE' ? 'https://www.youtube.com/embed/...' : 'https://example.com'}
                    />
                  </div>
                )
              }
              return null
            })()}
            <div>
              <Label>Font</Label>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Family</Label>
                  <Select
                    value={String(selectedElement.style?.fontFamily || 'Roboto, sans-serif')}
                    onValueChange={(value) => {
                      try {
                        const primary = (value.split(',')[0] || '').trim().replace(/^['"]|['"]$/g, '')
                        const googleFamilies: Record<string, string> = {
                          'Roboto': 'Roboto:wght@100;300;400;500;700',
                          'Inter': 'Inter:wght@100;300;400;500;700',
                          'Open Sans': 'Open+Sans:wght@300;400;600;700',
                          'Lato': 'Lato:wght@300;400;700',
                          'Montserrat': 'Montserrat:wght@300;400;600;700',
                          'Poppins': 'Poppins:wght@300;400;600;700',
                          'Source Sans Pro': 'Source+Sans+Pro:wght@300;400;600;700',
                          'Noto Sans': 'Noto+Sans:wght@300;400;600;700'
                        }
                        const fam = googleFamilies[primary]
                        if (fam && typeof document !== 'undefined') {
                          const id = `gf-${primary.replace(/\s+/g, '-')}`
                          if (!document.getElementById(id)) {
                            const link = document.createElement('link')
                            link.id = id
                            link.rel = 'stylesheet'
                            link.href = `https://fonts.googleapis.com/css2?family=${fam}&display=swap`
                            document.head.appendChild(link)
                          }
                        }
                      } catch {}
                      onUpdateElement(selectedElement.id, { style: { ...(selectedElement.style || {}), fontFamily: value } })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                      <SelectItem value="Inter, system-ui, Avenir, Helvetica, Arial, sans-serif">Inter</SelectItem>
                      <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                      <SelectItem value="Lato, sans-serif">Lato</SelectItem>
                      <SelectItem value="Montserrat, sans-serif">Montserrat</SelectItem>
                      <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                      <SelectItem value="'Source Sans Pro', sans-serif">Source Sans Pro</SelectItem>
                      <SelectItem value="'Noto Sans', sans-serif">Noto Sans</SelectItem>
                      <SelectItem value="Arial, Helvetica, sans-serif">Arial</SelectItem>
                      <SelectItem value="Georgia, 'Times New Roman', serif">Georgia</SelectItem>
                      <SelectItem value="'Times New Roman', Times, serif">Times New Roman</SelectItem>
                      <SelectItem value="Courier, 'Courier New', monospace">Courier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Size</Label>
                    <Input
                      type="number"
                      value={Number(selectedElement.style?.fontSize ?? 14)}
                      onChange={(e) => onUpdateElement(selectedElement.id, {
                        style: { ...(selectedElement.style || {}), fontSize: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Weight</Label>
                    <Select
                      value={String(selectedElement.style?.fontWeight || 'normal')}
                      onValueChange={(value) => onUpdateElement(selectedElement.id, {
                        style: { ...(selectedElement.style || {}), fontWeight: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lighter">Light</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Align</Label>
                    <Select
                      value={String(selectedElement.style?.textAlign || 'left')}
                      onValueChange={(value) => onUpdateElement(selectedElement.id, {
                        style: { ...(selectedElement.style || {}), textAlign: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                        <SelectItem value="justify">Justify</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <EnhancedColorPicker
                    value={selectedElement.style?.color || '#111827'}
                    onChange={(color) => onUpdateElement(selectedElement.id, {
                      style: { ...(selectedElement.style || {}), color }
                    })}
                    label="Color"
                    className="text-xs"
                    showApplyCancel={false}
                  />
                </div>
              </div>
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
            <div>
              <Label>Rotation (degrees)</Label>
              <Input
                type="number"
                value={Number(selectedElement.style?.rotation ?? 0)}
                onChange={(e) => onUpdateElement(selectedElement.id, {
                  style: { ...(selectedElement.style || {}), rotation: Number(e.target.value) }
                })}
              />
            </div>
            <div>
              <Label>Opacity (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={Math.round(Number((selectedElement.style?.backgroundOpacity ?? 1) * 100))}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                  onUpdateElement(selectedElement.id, {
                    style: { ...(selectedElement.style || {}), backgroundOpacity: v / 100 }
                  })
                }}
              />
            </div>
            <div>
              <Label>Visibility</Label>
              <Select
                value={selectedElement.is_visible === false ? 'hidden' : 'visible'}
                onValueChange={(value) => {
                  const visibilityValue = value === 'visible'
                  onUpdateElement(selectedElement.id, { is_visible: visibilityValue })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visible">Visible</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Border</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Top Width</Label>
                  <Input type="number" value={Number(selectedElement.style?.borderWidth?.top ?? 0)}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      style: { ...(selectedElement.style || {}), borderWidth: { ...(selectedElement.style?.borderWidth || {}), top: Number(e.target.value) } }
                    })} />
                </div>
                <div>
                  <Label className="text-xs">Right Width</Label>
                  <Input type="number" value={Number(selectedElement.style?.borderWidth?.right ?? 0)}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      style: { ...(selectedElement.style || {}), borderWidth: { ...(selectedElement.style?.borderWidth || {}), right: Number(e.target.value) } }
                    })} />
                </div>
                <div>
                  <Label className="text-xs">Bottom Width</Label>
                  <Input type="number" value={Number(selectedElement.style?.borderWidth?.bottom ?? 0)}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      style: { ...(selectedElement.style || {}), borderWidth: { ...(selectedElement.style?.borderWidth || {}), bottom: Number(e.target.value) } }
                    })} />
                </div>
                <div>
                  <Label className="text-xs">Left Width</Label>
                  <Input type="number" value={Number(selectedElement.style?.borderWidth?.left ?? 0)}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      style: { ...(selectedElement.style || {}), borderWidth: { ...(selectedElement.style?.borderWidth || {}), left: Number(e.target.value) } }
                    })} />
                </div>
                <div>
                  <Label className="text-xs">Top Color</Label>
                  <Input value={typeof selectedElement.style?.borderColor === 'object' ? (selectedElement.style?.borderColor?.top || '') : (selectedElement.style?.borderColor || '')}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      style: { ...(selectedElement.style || {}), borderColor: { ...(typeof selectedElement.style?.borderColor === 'object' ? selectedElement.style?.borderColor : {}), top: e.target.value } }
                    })} />
                </div>
                <div>
                  <Label className="text-xs">Right Color</Label>
                  <Input value={typeof selectedElement.style?.borderColor === 'object' ? (selectedElement.style?.borderColor?.right || '') : ''}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      style: { ...(selectedElement.style || {}), borderColor: { ...(typeof selectedElement.style?.borderColor === 'object' ? selectedElement.style?.borderColor : {}), right: e.target.value } }
                    })} />
                </div>
                <div>
                  <Label className="text-xs">Bottom Color</Label>
                  <Input value={typeof selectedElement.style?.borderColor === 'object' ? (selectedElement.style?.borderColor?.bottom || '') : ''}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      style: { ...(selectedElement.style || {}), borderColor: { ...(typeof selectedElement.style?.borderColor === 'object' ? selectedElement.style?.borderColor : {}), bottom: e.target.value } }
                    })} />
                </div>
                <div>
                  <Label className="text-xs">Left Color</Label>
                  <Input value={typeof selectedElement.style?.borderColor === 'object' ? (selectedElement.style?.borderColor?.left || '') : ''}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      style: { ...(selectedElement.style || {}), borderColor: { ...(typeof selectedElement.style?.borderColor === 'object' ? selectedElement.style?.borderColor : {}), left: e.target.value } }
                    })} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">All Sides Color (fallback)</Label>
                  <Input value={typeof selectedElement.style?.borderColor === 'string' ? (selectedElement.style?.borderColor || '') : ''}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      style: { ...(selectedElement.style || {}), borderColor: e.target.value }
                    })} />
                </div>
              </div>
            </div>

            <div>
              <Label>Corner Radius</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Top Left</Label>
                  <Input type="number" value={Number(selectedElement.style?.borderRadius?.topLeft ?? 0)}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      style: { ...(selectedElement.style || {}), borderRadius: { ...(selectedElement.style?.borderRadius || {}), topLeft: Number(e.target.value) } }
                    })} />
                </div>
                <div>
                  <Label className="text-xs">Top Right</Label>
                  <Input type="number" value={Number(selectedElement.style?.borderRadius?.topRight ?? 0)}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      style: { ...(selectedElement.style || {}), borderRadius: { ...(selectedElement.style?.borderRadius || {}), topRight: Number(e.target.value) } }
                    })} />
                </div>
                <div>
                  <Label className="text-xs">Bottom Right</Label>
                  <Input type="number" value={Number(selectedElement.style?.borderRadius?.bottomRight ?? 0)}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      style: { ...(selectedElement.style || {}), borderRadius: { ...(selectedElement.style?.borderRadius || {}), bottomRight: Number(e.target.value) } }
                    })} />
                </div>
                <div>
                  <Label className="text-xs">Bottom Left</Label>
                  <Input type="number" value={Number(selectedElement.style?.borderRadius?.bottomLeft ?? 0)}
                    onChange={(e) => onUpdateElement(selectedElement.id, {
                      style: { ...(selectedElement.style || {}), borderRadius: { ...(selectedElement.style?.borderRadius || {}), bottomLeft: Number(e.target.value) } }
                    })} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
