'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { PlacedWidget } from './widgets'

interface StyleSectionProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
}

export function StyleSection({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
}: StyleSectionProps) {
  const updateProperty = (key: string, value: any) => {
    setPlacedWidgets(prev => prev.map(w => 
      w.id === selectedWidgetId 
        ? { ...w, properties: { ...w.properties, [key]: value } }
        : w
    ))
  }

  return (
    <AccordionItem value="style">
      <AccordionTrigger className="text-xs font-semibold py-2">Style</AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3">
          {/* Toggle Controls */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Visibility & Effects</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Show Title</Label>
                <Switch
                  checked={widget.properties?.showTitle !== false}
                  onCheckedChange={(checked) => updateProperty('showTitle', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Show Background</Label>
                <Switch
                  checked={widget.properties?.showBackground !== false}
                  onCheckedChange={(checked) => updateProperty('showBackground', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Show Border</Label>
                <Switch
                  checked={widget.properties?.showBorder ?? false}
                  onCheckedChange={(checked) => updateProperty('showBorder', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Shadow</Label>
                <Switch
                  checked={widget.properties?.shadow ?? false}
                  onCheckedChange={(checked) => updateProperty('shadow', checked)}
                />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Colors</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Background</Label>
                <div className="relative">
                  <Input
                    type="color"
                    value={widget.properties?.backgroundColor || '#ffffff'}
                    onChange={(e) => updateProperty('backgroundColor', e.target.value)}
                    className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 border-0 cursor-pointer rounded-none"
                    style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none' }}
                    disabled={widget.properties?.showBackground === false}
                  />
                  <Input
                    type="text"
                    value={widget.properties?.backgroundColor || '#ffffff'}
                    onChange={(e) => updateProperty('backgroundColor', e.target.value)}
                    className="h-7 text-xs pl-7"
                    placeholder="#ffffff"
                    disabled={widget.properties?.showBackground === false}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Text Color</Label>
                <div className="relative">
                  <Input
                    type="color"
                    value={widget.properties?.textColor || '#000000'}
                    onChange={(e) => updateProperty('textColor', e.target.value)}
                    className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 border-0 cursor-pointer rounded-none"
                    style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none' }}
                  />
                  <Input
                    type="text"
                    value={widget.properties?.textColor || '#000000'}
                    onChange={(e) => updateProperty('textColor', e.target.value)}
                    className="h-7 text-xs pl-7"
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Border Color</Label>
                <div className="relative">
                  <Input
                    type="color"
                    value={widget.properties?.borderColor || '#e5e7eb'}
                    onChange={(e) => updateProperty('borderColor', e.target.value)}
                    className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 border-0 cursor-pointer rounded-none"
                    style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none' }}
                    disabled={widget.properties?.showBorder !== true}
                  />
                  <Input
                    type="text"
                    value={widget.properties?.borderColor || '#e5e7eb'}
                    onChange={(e) => updateProperty('borderColor', e.target.value)}
                    className="h-7 text-xs pl-7"
                    placeholder="#e5e7eb"
                    disabled={widget.properties?.showBorder !== true}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Typography</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Font Family</Label>
                <Select
                  value={widget.properties?.fontFamily || 'inherit'}
                  onValueChange={(value) => updateProperty('fontFamily', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">Inherit</SelectItem>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                    <SelectItem value="monospace">Monospace</SelectItem>
                    <SelectItem value="sans-serif">Sans-serif</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Font Size</Label>
                <Input
                  type="number"
                  value={widget.properties?.fontSize || 14}
                  onChange={(e) => updateProperty('fontSize', parseInt(e.target.value) || 14)}
                  className="h-7 text-xs"
                  placeholder="14"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Title Font Size</Label>
                <Input
                  type="number"
                  value={widget.properties?.titleFontSize || widget.properties?.fontSize || 16}
                  onChange={(e) => updateProperty('titleFontSize', parseInt(e.target.value) || 16)}
                  className="h-7 text-xs"
                  placeholder="16"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Label Font Size</Label>
                <Input
                  type="number"
                  value={widget.properties?.labelFontSize || widget.properties?.fontSize || 12}
                  onChange={(e) => updateProperty('labelFontSize', parseInt(e.target.value) || 12)}
                  className="h-7 text-xs"
                  placeholder="12"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Font Weight</Label>
                <Select
                  value={widget.properties?.fontWeight || 'normal'}
                  onValueChange={(value) => updateProperty('fontWeight', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="100">Thin (100)</SelectItem>
                    <SelectItem value="300">Light (300)</SelectItem>
                    <SelectItem value="400">Regular (400)</SelectItem>
                    <SelectItem value="500">Medium (500)</SelectItem>
                    <SelectItem value="600">Semi Bold (600)</SelectItem>
                    <SelectItem value="700">Bold (700)</SelectItem>
                    <SelectItem value="800">Extra Bold (800)</SelectItem>
                    <SelectItem value="900">Black (900)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Text Align</Label>
                <Select
                  value={widget.properties?.textAlign || 'left'}
                  onValueChange={(value) => updateProperty('textAlign', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
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
          </div>

          {/* Borders */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Borders & Rounded Corners</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Border Width</Label>
                <Input
                  type="number"
                  value={widget.properties?.borderWidth || 0}
                  onChange={(e) => updateProperty('borderWidth', parseInt(e.target.value) || 0)}
                  className="h-7 text-xs"
                  placeholder="0"
                  disabled={widget.properties?.showBorder !== true}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Border Radius (Rounded)</Label>
                <Input
                  type="number"
                  value={widget.properties?.borderRadius || 0}
                  onChange={(e) => updateProperty('borderRadius', parseInt(e.target.value) || 0)}
                  className="h-7 text-xs"
                  placeholder="0"
                  disabled={widget.properties?.showBorder !== true}
                />
              </div>
              <div className="space-y-1 col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Border Radius</Label>
                  <span className="text-xs text-muted-foreground">
                    {widget.properties?.borderRadius || 0}px
                  </span>
                </div>
                <Slider
                  value={[widget.properties?.borderRadius || 0]}
                  onValueChange={(value) => updateProperty('borderRadius', value[0])}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                  disabled={widget.properties?.showBorder !== true}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0px</span>
                  <span>50px</span>
                </div>
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Border Style</Label>
                <Select
                  value={widget.properties?.borderStyle || 'solid'}
                  onValueChange={(value) => updateProperty('borderStyle', value)}
                  disabled={widget.properties?.showBorder !== true}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="dashed">Dashed</SelectItem>
                    <SelectItem value="dotted">Dotted</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Spacing */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Spacing</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Padding</Label>
                <Input
                  type="number"
                  value={widget.properties?.padding || 0}
                  onChange={(e) => updateProperty('padding', parseInt(e.target.value) || 0)}
                  className="h-7 text-xs"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Margin</Label>
                <Input
                  type="number"
                  value={widget.properties?.margin || 0}
                  onChange={(e) => updateProperty('margin', parseInt(e.target.value) || 0)}
                  className="h-7 text-xs"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Effects */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Effects</Label>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">Opacity</Label>
                <Input
                  type="number"
                  value={Math.round((widget.properties?.opacity ?? 1) * 100)}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    const clampedValue = Math.max(0, Math.min(100, value))
                    updateProperty('opacity', clampedValue / 100)
                  }}
                  min={0}
                  max={100}
                  className="h-7 text-xs"
                  placeholder="100"
                />
              </div>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

