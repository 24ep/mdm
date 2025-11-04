'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { BarChart3, Type, Layout, Eye, Tag, MoveVertical, Square, Box, Layers, Grid3x3, HelpCircle, Palette, DollarSign, TrendingUp } from 'lucide-react'
import { PlacedWidget } from './widgets'

interface ChartConfigurationSectionProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
}

export function ChartConfigurationSection({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
}: ChartConfigurationSectionProps) {
  const updateProperty = (key: string, value: any) => {
    setPlacedWidgets(prev => prev.map(w => 
      w.id === selectedWidgetId 
        ? { ...w, properties: { ...w.properties, [key]: value } }
        : w
    ))
  }

  const chartType = widget.properties?.chartType || widget.type.replace('-chart', '')
  const isPieDonut = chartType === 'pie' || chartType === 'donut'
  const isBarLineArea = chartType === 'bar' || chartType === 'line' || chartType === 'area'
  const hasAxes = isBarLineArea || chartType === 'scatter'
  
  // Get measures for series configuration
  const measures = widget.properties?.measures || []
  const seriesStyles = widget.properties?.seriesStyles || {}

  return (
    <>
      {/* Chart Style - Looker Studio style (Chart type) */}
      <AccordionItem value="chart-style" className="border-0">
        <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
          <div className="flex items-center gap-2 flex-1">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Chart style</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-3">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Chart type</Label>
              <Select
                value={chartType}
                onValueChange={(value) => updateProperty('chartType', value)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="donut">Donut Chart</SelectItem>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                  <SelectItem value="radar">Radar Chart</SelectItem>
                  <SelectItem value="gauge">Gauge Chart</SelectItem>
                  <SelectItem value="funnel">Funnel Chart</SelectItem>
                  <SelectItem value="waterfall">Waterfall Chart</SelectItem>
                  <SelectItem value="treemap">Treemap</SelectItem>
                  <SelectItem value="heatmap">Heatmap</SelectItem>
                  <SelectItem value="bubble">Bubble Map</SelectItem>
                  <SelectItem value="combo">Combo Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Common options for chart subtypes */}
            {chartType === 'bar' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Bar mode</Label>
                  <Select
                    value={widget.properties?.barMode || 'grouped'}
                    onValueChange={(value) => updateProperty('barMode', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grouped">Grouped</SelectItem>
                      <SelectItem value="stacked">Stacked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Orientation</Label>
                  <Select
                    value={widget.properties?.barOrientation || 'vertical'}
                    onValueChange={(value) => updateProperty('barOrientation', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vertical">Vertical</SelectItem>
                      <SelectItem value="horizontal">Horizontal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {chartType === 'line' || chartType === 'area' ? (
              <div className="space-y-1">
                <Label className="text-xs font-medium">Curve</Label>
                <Select
                  value={widget.properties?.lineCurve || 'monotone'}
                  onValueChange={(value) => updateProperty('lineCurve', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monotone">Smooth</SelectItem>
                    <SelectItem value="linear">Straight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Title - Looker Studio style */}
      <AccordionItem value="title" className="border-0">
        <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
          <div className="flex items-center gap-2 flex-1">
            <Type className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Title</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium">Show Header</Label>
                <p className="text-xs text-muted-foreground">Display header above chart</p>
              </div>
              <Switch
                checked={widget.properties?.showHeader ?? true}
                onCheckedChange={(checked) => updateProperty('showHeader', checked)}
              />
            </div>

            {(widget.properties?.showHeader ?? true) && (
              <>
                <Separator />
                
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Title Color</Label>
                      <Input
                        type="color"
                        value={widget.properties?.titleColor || '#111827'}
                        onChange={(e) => updateProperty('titleColor', e.target.value)}
                        className="h-7 text-xs p-0 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Font Size</Label>
                      <Input
                        type="number"
                        value={widget.properties?.titleFontSize || 14}
                        onChange={(e) => updateProperty('titleFontSize', parseInt(e.target.value) || 14)}
                        className="h-7 text-xs"
                        min="8"
                        max="32"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Header Background</Label>
                    <Input
                      type="color"
                      value={widget.properties?.headerBackgroundColor || '#ffffff'}
                      onChange={(e) => updateProperty('headerBackgroundColor', e.target.value)}
                      className="h-7 text-xs p-0 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Text Alignment</Label>
                    <Select
                      value={widget.properties?.titleAlign || 'left'}
                      onValueChange={(value) => updateProperty('titleAlign', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Header Icon</Label>
                    <Select
                      value={widget.properties?.headerIcon || 'none'}
                      onValueChange={(value) => updateProperty('headerIcon', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="area">Area Chart</SelectItem>
                        <SelectItem value="pie">Pie Chart</SelectItem>
                        <SelectItem value="donut">Donut Chart</SelectItem>
                        <SelectItem value="scatter">Scatter Plot</SelectItem>
                        <SelectItem value="radar">Radar Chart</SelectItem>
                        <SelectItem value="gauge">Gauge Chart</SelectItem>
                        <SelectItem value="funnel">Funnel Chart</SelectItem>
                        <SelectItem value="waterfall">Waterfall Chart</SelectItem>
                        <SelectItem value="treemap">Treemap</SelectItem>
                        <SelectItem value="heatmap">Heatmap</SelectItem>
                        <SelectItem value="bubble">Bubble Chart</SelectItem>
                        <SelectItem value="combo">Combo Chart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Series - Looker Studio style */}
      {(isBarLineArea || chartType === 'scatter') && measures.length > 0 && (
        <AccordionItem value="series" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Palette className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Series</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <div className="space-y-3">
              {measures.map((measure: string, index: number) => {
                const seriesStyle = seriesStyles[measure] || {}
                return (
                  <div key={measure} className="space-y-2 pb-2 border-b last:border-0">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">{measure}</Label>
                      <span className="text-xs text-muted-foreground">Series {index + 1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Color</Label>
                        <Input
                          type="color"
                          value={seriesStyle.color || '#0088FE'}
                          onChange={(e) => {
                            const newSeriesStyles = {
                              ...seriesStyles,
                              [measure]: {
                                ...seriesStyle,
                                color: e.target.value
                              }
                            }
                            updateProperty('seriesStyles', newSeriesStyles)
                          }}
                          className="h-7 text-xs p-0 cursor-pointer"
                        />
                      </div>
                      {chartType === 'line' && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Line width</Label>
                          <Input
                            type="number"
                            value={seriesStyle.strokeWidth || 2}
                            onChange={(e) => {
                              const newSeriesStyles = {
                                ...seriesStyles,
                                [measure]: {
                                  ...seriesStyle,
                                  strokeWidth: parseInt(e.target.value) || 2
                                }
                              }
                              updateProperty('seriesStyles', newSeriesStyles)
                            }}
                            className="h-7 text-xs"
                            min="1"
                            max="10"
                          />
                        </div>
                      )}
                      {chartType === 'bar' && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Bar size</Label>
                          <Input
                            type="number"
                            value={seriesStyle.barSize || ''}
                            onChange={(e) => {
                              const newSeriesStyles = {
                                ...seriesStyles,
                                [measure]: {
                                  ...seriesStyle,
                                  barSize: e.target.value ? parseInt(e.target.value) : undefined
                                }
                              }
                              updateProperty('seriesStyles', newSeriesStyles)
                            }}
                            placeholder="Auto"
                            className="h-7 text-xs"
                            min="10"
                            max="100"
                          />
                        </div>
                      )}
                    </div>
                    {chartType === 'line' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">Show points</Label>
                          <Switch
                            checked={seriesStyle.showDots !== false}
                            onCheckedChange={(checked) => {
                              const newSeriesStyles = {
                                ...seriesStyles,
                                [measure]: {
                                  ...seriesStyle,
                                  showDots: checked
                                }
                              }
                              updateProperty('seriesStyles', newSeriesStyles)
                            }}
                          />
                        </div>
                        {seriesStyle.showDots !== false && (
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Point size</Label>
                            <Input
                              type="number"
                              value={seriesStyle.dotRadius || 4}
                              onChange={(e) => {
                                const newSeriesStyles = {
                                  ...seriesStyles,
                                  [measure]: {
                                    ...seriesStyle,
                                    dotRadius: parseInt(e.target.value) || 4
                                  }
                                }
                                updateProperty('seriesStyles', newSeriesStyles)
                              }}
                              className="h-7 text-xs"
                              min="2"
                              max="12"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {chartType === 'area' && (
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Opacity</Label>
                        <Input
                          type="number"
                          value={seriesStyle.fillOpacity ?? 0.6}
                          onChange={(e) => {
                            const newSeriesStyles = {
                              ...seriesStyles,
                              [measure]: {
                                ...seriesStyle,
                                fillOpacity: parseFloat(e.target.value) || 0.6
                              }
                            }
                            updateProperty('seriesStyles', newSeriesStyles)
                          }}
                          className="h-7 text-xs"
                          min="0"
                          max="1"
                          step="0.1"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Legend - Looker Studio style */}
      <AccordionItem value="legend" className="border-0">
        <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
          <div className="flex items-center gap-2 flex-1">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Legend</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium">Show</Label>
                <p className="text-xs text-muted-foreground">Display chart legend</p>
              </div>
              <Switch
                checked={widget.properties?.showLegend ?? true}
                onCheckedChange={(checked) => updateProperty('showLegend', checked)}
              />
            </div>
            {(widget.properties?.showLegend ?? true) && (
              <>
                <Separator />
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Position</Label>
                    <Select
                      value={widget.properties?.legendPosition || 'bottom'}
                      onValueChange={(value) => updateProperty('legendPosition', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                        <SelectItem value="left">Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Font Size</Label>
                      <Input
                        type="number"
                        value={widget.properties?.legendFontSize || 12}
                        onChange={(e) => updateProperty('legendFontSize', parseInt(e.target.value) || 12)}
                        className="h-7 text-xs"
                        min="8"
                        max="24"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Color</Label>
                      <Input
                        type="color"
                        value={widget.properties?.legendColor || '#111827'}
                        onChange={(e) => updateProperty('legendColor', e.target.value)}
                        className="h-7 text-xs p-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Font Family</Label>
                    <Select
                      value={widget.properties?.legendFontFamily || 'Roboto'}
                      onValueChange={(value) => updateProperty('legendFontFamily', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Data labels - Looker Studio style */}
      {(isPieDonut || isBarLineArea) && (
        <AccordionItem value="dataLabels" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Data labels</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <div className="space-y-3">
              {isPieDonut && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Show</Label>
                    <p className="text-xs text-muted-foreground">Display values on slices</p>
                  </div>
                  <Switch
                    checked={widget.properties?.showLabels ?? true}
                    onCheckedChange={(checked) => updateProperty('showLabels', checked)}
                  />
                </div>
              )}
              {chartType === 'donut' && (
                <div className="space-y-1 pt-1">
                  <Label className="text-xs font-medium">Inner Radius (%)</Label>
                  <Input
                    type="number"
                    value={widget.properties?.innerRadius || 50}
                    onChange={(e) => updateProperty('innerRadius', parseInt(e.target.value) || 50)}
                    className="h-7 text-xs"
                    min="0"
                    max="90"
                  />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Grid - Looker Studio style */}
      {hasAxes && (
        <AccordionItem value="grid" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Grid3x3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Grid</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Show gridlines</Label>
                  <p className="text-xs text-muted-foreground">Display grid lines on chart</p>
                </div>
                <Switch
                  checked={widget.properties?.showGrid ?? true}
                  onCheckedChange={(checked) => updateProperty('showGrid', checked)}
                />
              </div>
              {(widget.properties?.showGrid ?? true) && (
                <>
                  <Separator />
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Grid color</Label>
                        <Input
                          type="color"
                          value={widget.properties?.gridColor || '#f0f0f0'}
                          onChange={(e) => updateProperty('gridColor', e.target.value)}
                          className="h-7 text-xs p-0 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Dash pattern</Label>
                        <Select
                          value={widget.properties?.gridDash || '3 3'}
                          onValueChange={(value) => updateProperty('gridDash', value)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0 0">Solid</SelectItem>
                            <SelectItem value="3 3">Dashed (3 3)</SelectItem>
                            <SelectItem value="5 5">Dashed (5 5)</SelectItem>
                            <SelectItem value="2 2">Dashed (2 2)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* X-axis - Looker Studio style */}
      {hasAxes && (
        <AccordionItem value="xAxis" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <MoveVertical className="h-3.5 w-3.5 text-muted-foreground rotate-90" />
              <span>X-axis</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Show</Label>
                  <p className="text-xs text-muted-foreground">Display X-axis</p>
                </div>
                <Switch
                  checked={widget.properties?.showXAxis ?? true}
                  onCheckedChange={(checked) => updateProperty('showXAxis', checked)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Title</Label>
                <Input
                  value={widget.properties?.xAxisLabel || ''}
                  onChange={(e) => updateProperty('xAxisLabel', e.target.value)}
                  placeholder="Enter X-axis title"
                  className="h-7 text-xs"
                />
              </div>
              {(widget.properties?.showXAxis ?? true) && (
                <>
                  <Separator />
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Title Font Size</Label>
                      <Input
                        type="number"
                        value={widget.properties?.xAxisTitleFontSize || 12}
                        onChange={(e) => updateProperty('xAxisTitleFontSize', parseInt(e.target.value) || 12)}
                        className="h-7 text-xs"
                        min="8"
                        max="24"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Title Color</Label>
                        <Input
                          type="color"
                          value={widget.properties?.xAxisTitleColor || '#111827'}
                          onChange={(e) => updateProperty('xAxisTitleColor', e.target.value)}
                          className="h-7 text-xs p-0 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Tick Color</Label>
                        <Input
                          type="color"
                          value={widget.properties?.xAxisTickColor || '#111827'}
                          onChange={(e) => updateProperty('xAxisTickColor', e.target.value)}
                          className="h-7 text-xs p-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Tick Font Size</Label>
                        <Input
                          type="number"
                          value={widget.properties?.xAxisTickFontSize || 12}
                          onChange={(e) => updateProperty('xAxisTickFontSize', parseInt(e.target.value) || 12)}
                          className="h-7 text-xs"
                          min="8"
                          max="20"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Font Family</Label>
                        <Select
                          value={widget.properties?.xAxisFontFamily || 'Roboto'}
                          onValueChange={(value) => updateProperty('xAxisFontFamily', value)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Y-axis - Looker Studio style */}
      {hasAxes && (
        <AccordionItem value="yAxis" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <MoveVertical className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Y-axis</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Show</Label>
                  <p className="text-xs text-muted-foreground">Display Y-axis</p>
                </div>
                <Switch
                  checked={widget.properties?.showYAxis ?? true}
                  onCheckedChange={(checked) => updateProperty('showYAxis', checked)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Title</Label>
                <Input
                  value={widget.properties?.yAxisLabel || ''}
                  onChange={(e) => updateProperty('yAxisLabel', e.target.value)}
                  placeholder="Enter Y-axis title"
                  className="h-7 text-xs"
                />
              </div>
              {(widget.properties?.showYAxis ?? true) && (
                <>
                  <Separator />
                  <div className="space-y-3 pt-1">
                    {/* Axis Scale - Min/Max */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Min value</Label>
                        <Input
                          type="number"
                          value={widget.properties?.yAxisMin || ''}
                          onChange={(e) => updateProperty('yAxisMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="Auto"
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Max value</Label>
                        <Input
                          type="number"
                          value={widget.properties?.yAxisMax || ''}
                          onChange={(e) => updateProperty('yAxisMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="Auto"
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Title Font Size</Label>
                      <Input
                        type="number"
                        value={widget.properties?.yAxisTitleFontSize || 12}
                        onChange={(e) => updateProperty('yAxisTitleFontSize', parseInt(e.target.value) || 12)}
                        className="h-7 text-xs"
                        min="8"
                        max="24"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Title Color</Label>
                        <Input
                          type="color"
                          value={widget.properties?.yAxisTitleColor || '#111827'}
                          onChange={(e) => updateProperty('yAxisTitleColor', e.target.value)}
                          className="h-7 text-xs p-0 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Tick Color</Label>
                        <Input
                          type="color"
                          value={widget.properties?.yAxisTickColor || '#111827'}
                          onChange={(e) => updateProperty('yAxisTickColor', e.target.value)}
                          className="h-7 text-xs p-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Tick Font Size</Label>
                        <Input
                          type="number"
                          value={widget.properties?.yAxisTickFontSize || 12}
                          onChange={(e) => updateProperty('yAxisTickFontSize', parseInt(e.target.value) || 12)}
                          className="h-7 text-xs"
                          min="8"
                          max="20"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Font Family</Label>
                        <Select
                          value={widget.properties?.yAxisFontFamily || 'Roboto'}
                          onValueChange={(value) => updateProperty('yAxisFontFamily', value)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Number format - Looker Studio style */}
      <AccordionItem value="numberFormat" className="border-0">
        <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
          <div className="flex items-center gap-2 flex-1">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Number format</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-3">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Format type</Label>
              <Select
                value={widget.properties?.numberFormatType || 'auto'}
                onValueChange={(value) => updateProperty('numberFormatType', value)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="scientific">Scientific</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(widget.properties?.numberFormatType === 'number' || widget.properties?.numberFormatType === 'currency') && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Decimal places</Label>
                  <Input
                    type="number"
                    value={widget.properties?.decimalPlaces ?? 2}
                    onChange={(e) => updateProperty('decimalPlaces', parseInt(e.target.value) || 0)}
                    className="h-7 text-xs"
                    min="0"
                    max="10"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Thousands separator</Label>
                    <p className="text-xs text-muted-foreground">Use comma for thousands</p>
                  </div>
                  <Switch
                    checked={widget.properties?.thousandsSeparator ?? true}
                    onCheckedChange={(checked) => updateProperty('thousandsSeparator', checked)}
                  />
                </div>
              </>
            )}
            {widget.properties?.numberFormatType === 'currency' && (
              <div className="space-y-1">
                <Label className="text-xs font-medium">Currency symbol</Label>
                <Input
                  value={widget.properties?.currencySymbol || '$'}
                  onChange={(e) => updateProperty('currencySymbol', e.target.value)}
                  placeholder="$"
                  className="h-7 text-xs"
                  maxLength={3}
                />
              </div>
            )}
            {widget.properties?.numberFormatType === 'percentage' && (
              <div className="space-y-1">
                <Label className="text-xs font-medium">Decimal places</Label>
                <Input
                  type="number"
                  value={widget.properties?.decimalPlaces ?? 1}
                  onChange={(e) => updateProperty('decimalPlaces', parseInt(e.target.value) || 0)}
                  className="h-7 text-xs"
                  min="0"
                  max="10"
                />
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Tooltip - Looker Studio style */}
      <AccordionItem value="tooltip" className="border-0">
        <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
          <div className="flex items-center gap-2 flex-1">
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Tooltip</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-3">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Font Size</Label>
                <Input
                  type="number"
                  value={widget.properties?.tooltipFontSize || 12}
                  onChange={(e) => updateProperty('tooltipFontSize', parseInt(e.target.value) || 12)}
                  className="h-7 text-xs"
                  min="8"
                  max="20"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Font Family</Label>
                <Select
                  value={widget.properties?.tooltipFontFamily || 'Roboto'}
                  onValueChange={(value) => updateProperty('tooltipFontFamily', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Pie/Donut chart - Looker Studio style */}
      {isPieDonut && (
        <AccordionItem value="pieSettings" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Pie/Donut chart</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Outer Radius</Label>
                <Input
                  type="number"
                  value={widget.properties?.pieOuterRadius || 80}
                  onChange={(e) => updateProperty('pieOuterRadius', parseInt(e.target.value) || 80)}
                  className="h-7 text-xs"
                  min="20"
                  max="150"
                />
              </div>
              {chartType === 'donut' && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Inner Radius</Label>
                    <Input
                      type="number"
                      value={widget.properties?.innerRadius || 40}
                      onChange={(e) => updateProperty('innerRadius', parseInt(e.target.value) || 40)}
                      className="h-7 text-xs"
                      min="0"
                      max="90"
                    />
                  </div>
                </>
              )}
              {(widget.properties?.showLabels ?? true) && (
                <div className="flex items-center justify-between pt-1">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Show Label Lines</Label>
                    <p className="text-xs text-muted-foreground">Display lines to labels</p>
                  </div>
                  <Switch
                    checked={widget.properties?.showLabelLines ?? false}
                    onCheckedChange={(checked) => updateProperty('showLabelLines', checked)}
                  />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}
    </>
  )
}

