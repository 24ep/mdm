'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ColorPickerPopover } from './ColorPickerPopover'
import { Star, Home, Settings, Table as TableIcon, BarChart3, LineChart, AreaChart } from 'lucide-react'
import { PlacedWidget } from './widgets'

interface HeaderSectionProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
}

export function HeaderSection({ widget, selectedWidgetId, setPlacedWidgets }: HeaderSectionProps) {
  const updateProperty = (key: string, value: any) => {
    setPlacedWidgets(prev => prev.map(w => 
      w.id === selectedWidgetId 
        ? { ...w, properties: { ...w.properties, [key]: value } }
        : w
    ))
  }

  return (
    <div className="space-y-3 px-4 pb-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-xs font-medium">Show Header</Label>
          <p className="text-xs text-muted-foreground">Display header above element</p>
        </div>
        <Switch
          checked={widget.properties?.showElementHeaderBar ?? false}
          onCheckedChange={(checked) => updateProperty('showElementHeaderBar', checked)}
        />
      </div>

      {(widget.properties?.showElementHeaderBar ?? false) && (
        <>
          <Separator />
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Title</Label>
              <Input
                value={widget.properties?.title || ''}
                onChange={(e) => updateProperty('title', e.target.value)}
                placeholder="Element title"
                className="h-7 text-xs"
              />
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
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4" />
                      <span>None</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="star">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      <span>Star</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="home">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      <span>Home</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="settings">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="table">
                    <div className="flex items-center gap-2">
                      <TableIcon className="h-4 w-4" />
                      <span>Table</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bar">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>Bar</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="line">
                    <div className="flex items-center gap-2">
                      <LineChart className="h-4 w-4" />
                      <span>Line</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="area">
                    <div className="flex items-center gap-2">
                      <AreaChart className="h-4 w-4" />
                      <span>Area</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  min={8}
                  max={32}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Header Background</Label>
              <div className="relative w-28">
                <ColorPickerPopover
                  value={widget.properties?.headerBackgroundColor || '#ffffff'}
                  onChange={(color) => updateProperty('headerBackgroundColor', color)}
                  allowImageVideo={true}
                >
                  <button
                    type="button"
                    className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10"
                    style={{
                      backgroundColor: (widget.properties?.headerBackgroundColor || '#ffffff') as string,
                      border: 'none',
                      outline: 'none',
                      backgroundImage: String(widget.properties?.headerBackgroundColor || '').startsWith('linear-gradient') || String(widget.properties?.headerBackgroundColor || '').startsWith('radial-gradient')
                        ? (widget.properties?.headerBackgroundColor as string)
                        : String(widget.properties?.headerBackgroundColor || '').startsWith('url(')
                        ? (widget.properties?.headerBackgroundColor as string)
                        : 'none',
                      backgroundSize: String(widget.properties?.headerBackgroundColor || '').startsWith('url(') ? 'cover' : 'auto'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </ColorPickerPopover>
                <Input
                  type="text"
                  value={widget.properties?.headerBackgroundColor || '#ffffff'}
                  onChange={(e) => updateProperty('headerBackgroundColor', e.target.value)}
                  className="h-7 text-xs pl-7"
                  placeholder="#ffffff"
                />
              </div>
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
          </div>
        </>
      )}
    </div>
  )
}


