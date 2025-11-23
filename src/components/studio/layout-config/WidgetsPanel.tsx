'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash, Search } from 'lucide-react'
import { widgetsPalette, PlacedWidget } from './widgets'

interface WidgetsPanelProps {
  isMobileViewport: boolean
  selectedPageId: string | null
  selectedWidgetId: string | null
  placedWidgets: PlacedWidget[]
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  setSelectedWidgetId: React.Dispatch<React.SetStateAction<string | null>>
}

export function WidgetsPanel({
  isMobileViewport,
  selectedPageId,
  selectedWidgetId,
  placedWidgets,
  setPlacedWidgets,
  setSelectedWidgetId,
}: WidgetsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredWidgets = useMemo(() => {
    if (!searchQuery.trim()) return widgetsPalette
    
    const query = searchQuery.toLowerCase().trim()
    return widgetsPalette.filter(w => 
      w.label.toLowerCase().includes(query) || 
      w.type.toLowerCase().includes(query) ||
      w.category.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const filteredCategories = useMemo(() => {
    const categories = Array.from(new Set(filteredWidgets.map(w => w.category)))
    return categories.map(category => ({
      category,
      widgets: filteredWidgets.filter(w => w.category === category)
    }))
  }, [filteredWidgets])

  if (!selectedPageId) return null

  return (
    <div className="h-full overflow-auto p-3">
      <div className={`${isMobileViewport ? 'text-base' : 'text-sm'} font-semibold mb-3`}>Widgets & Components</div>
      
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <Search className={`absolute left-2 top-1/2 transform -translate-y-1/2 ${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-muted-foreground`} />
          <Input
            type="text"
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${isMobileViewport ? 'h-10 pl-8' : 'h-8 pl-7'} text-sm`}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No widgets found matching "{searchQuery}"
          </div>
        ) : (
          filteredCategories.map(({ category, widgets }) => (
            <div key={category} className="space-y-2">
              <div className={`${isMobileViewport ? 'text-sm' : 'text-xs'} font-medium text-muted-foreground uppercase tracking-wide`}>
                {category}
              </div>
              <div className={`grid ${isMobileViewport ? 'grid-cols-1' : 'grid-cols-1'} gap-2`}>
                {widgets.map(w => {
                  const Icon = w.icon
                  return (
                    <div
                      key={w.type}
                      className={`flex items-center gap-2 ${isMobileViewport ? 'px-3 py-2.5 text-sm' : 'px-2.5 py-2 text-xs'} bg-background border rounded-md cursor-move hover:bg-primary/10 hover:border-primary/30 transition-colors`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('widgetType', w.type)
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                    >
                      <Icon className={`${isMobileViewport ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-muted-foreground`} />
                      <span className="flex-1">{w.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Widget Properties Panel - Show when widget is selected */}
      {selectedWidgetId && (() => {
        const selectedWidget = placedWidgets.find(w => w.id === selectedWidgetId)
        if (!selectedWidget) return null
        
        const widgetDef = widgetsPalette.find(w => w.type === selectedWidget.type)
        return (
          <div key={selectedWidgetId} className="mb-4 border-t pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`${isMobileViewport ? 'text-base' : 'text-sm'} font-semibold`}>
                {widgetDef?.label || 'Widget'} Properties
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => {
                  setPlacedWidgets(prev => prev.filter(w => w.id !== selectedWidgetId))
                  setSelectedWidgetId(null)
                }}
              >
                <Trash className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} mb-1 block`}>Position X</Label>
                <Input
                  type="number"
                  className={isMobileViewport ? "h-10" : "h-8"}
                  value={selectedWidget.x}
                  onChange={(e) => {
                    setPlacedWidgets(prev => prev.map(w => 
                      w.id === selectedWidgetId ? { ...w, x: parseInt(e.target.value) || 0 } : w
                    ))
                  }}
                />
              </div>
              <div>
                <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} mb-1 block`}>Position Y</Label>
                <Input
                  type="number"
                  className={isMobileViewport ? "h-10" : "h-8"}
                  value={selectedWidget.y}
                  onChange={(e) => {
                    setPlacedWidgets(prev => prev.map(w => 
                      w.id === selectedWidgetId ? { ...w, y: parseInt(e.target.value) || 0 } : w
                    ))
                  }}
                />
              </div>
              <div>
                <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} mb-1 block`}>Width (px)</Label>
                <Input
                  type="number"
                  className={isMobileViewport ? "h-10" : "h-8"}
                  value={selectedWidget.width || 200}
                  onChange={(e) => {
                    setPlacedWidgets(prev => prev.map(w => 
                      w.id === selectedWidgetId ? { ...w, width: parseInt(e.target.value) || 200 } : w
                    ))
                  }}
                />
              </div>
              <div>
                <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} mb-1 block`}>Height (px)</Label>
                <Input
                  type="number"
                  className={isMobileViewport ? "h-10" : "h-8"}
                  value={selectedWidget.height || 150}
                  onChange={(e) => {
                    setPlacedWidgets(prev => prev.map(w => 
                      w.id === selectedWidgetId ? { ...w, height: parseInt(e.target.value) || 150 } : w
                    ))
                  }}
                />
              </div>
              
              {/* Widget-specific properties */}
              {selectedWidget.type.includes('chart') && (
                <div className="space-y-2 pt-2 border-t">
                  <div>
                    <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} mb-1 block`}>Title</Label>
                    <Input
                      className={isMobileViewport ? "h-10" : "h-8"}
                      value={selectedWidget.properties?.title || ''}
                      onChange={(e) => {
                        setPlacedWidgets(prev => prev.map(w => 
                          w.id === selectedWidgetId 
                            ? { ...w, properties: { ...w.properties, title: e.target.value } }
                            : w
                        ))
                      }}
                      placeholder="Chart Title"
                    />
                  </div>
                  <div>
                    <Label className={`${isMobileViewport ? 'text-sm' : 'text-xs'} mb-1 block`}>Data Source</Label>
                    <Select
                      value={selectedWidget.properties?.dataSource || 'sample'}
                      onValueChange={(value) => {
                        setPlacedWidgets(prev => prev.map(w => 
                          w.id === selectedWidgetId 
                            ? { ...w, properties: { ...w.properties, dataSource: value } }
                            : w
                        ))
                      }}
                    >
                      <SelectTrigger className={isMobileViewport ? "h-10" : "h-8"}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sample">Sample Data</SelectItem>
                        <SelectItem value="api">API Endpoint</SelectItem>
                        <SelectItem value="database">Database Query</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

