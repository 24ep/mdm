'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Slider } from '@/components/ui/slider'
import { PlacedWidget } from './widgets'
import { ColorInput } from './ColorInput'
import { MultiSideInput } from '@/components/shared/MultiSideInput'

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
                <ColorInput
                  value={widget.properties?.backgroundColor || '#ffffff'}
                  onChange={(color) => updateProperty('backgroundColor', color)}
                  allowImageVideo={false}
                  disabled={widget.properties?.showBackground === false}
                  className="relative"
                  placeholder="#ffffff"
                  inputClassName="h-7 text-xs pl-7"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Text Color</Label>
                <ColorInput
                  value={widget.properties?.textColor || '#000000'}
                  onChange={(color) => updateProperty('textColor', color)}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#000000"
                  inputClassName="h-7 text-xs pl-7"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Border Color</Label>
                <ColorInput
                  value={widget.properties?.borderColor || '#e5e7eb'}
                  onChange={(color) => updateProperty('borderColor', color)}
                  allowImageVideo={false}
                  disabled={widget.properties?.showBorder !== true}
                  className="relative"
                  placeholder="#e5e7eb"
                  inputClassName="h-7 text-xs pl-7"
                />
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
              <MultiSideInput
                label="Border Width"
                baseKey="borderWidth"
                type="sides"
                defaultValue={0}
                disabled={widget.properties?.showBorder !== true}
                inputClassName="h-7 text-xs"
                getValue={(side: string) => {
                  const key = `borderWidth${side.charAt(0).toUpperCase() + side.slice(1)}`
                  const baseValue = typeof widget.properties?.borderWidth === 'number' 
                    ? widget.properties.borderWidth 
                    : (widget.properties?.borderWidth || 0)
                  const sideValue = widget.properties?.[key]
                  return sideValue !== undefined ? sideValue : baseValue
                }}
                setValue={(updates) => {
                  const props = widget.properties || {}
                  const newProps = { ...props }
                  Object.keys(updates).forEach(key => {
                    const value = updates[key]
                    // Convert string with px to number if it's just a number
                    if (typeof value === 'string' && value.endsWith('px')) {
                      const numValue = parseInt(value.replace('px', '')) || 0
                      newProps[key] = numValue
                    } else {
                      newProps[key] = value
                    }
                  })
                  setPlacedWidgets(prev => prev.map(w => 
                    w.id === selectedWidgetId 
                      ? { ...w, properties: newProps }
                      : w
                  ))
                }}
              />
              <MultiSideInput
                label="Border Radius"
                baseKey="borderRadius"
                type="corners"
                defaultValue={0}
                disabled={widget.properties?.showBorder !== true}
                inputClassName="h-7 text-xs"
                getValue={(side: string) => {
                  const br = widget.properties?.borderRadius
                  if (typeof br === 'number') return br
                  if (typeof br === 'object' && br !== null) {
                    const obj = br as any
                    const corner = obj[side]
                    return corner?.value ?? 0
                  }
                  return 0
                }}
                setValue={(updates) => {
                  const props = widget.properties || {}
                  const currentBr = props.borderRadius
                  
                  // Initialize border radius object if it's a number
                  let brObj: any = typeof currentBr === 'number' 
                    ? {
                        topLeft: { value: currentBr, unit: 'px' },
                        topRight: { value: currentBr, unit: 'px' },
                        bottomRight: { value: currentBr, unit: 'px' },
                        bottomLeft: { value: currentBr, unit: 'px' }
                      }
                    : (currentBr || {
                        topLeft: { value: 0, unit: 'px' },
                        topRight: { value: 0, unit: 'px' },
                        bottomRight: { value: 0, unit: 'px' },
                        bottomLeft: { value: 0, unit: 'px' }
                      })
                  
                  // Update the border radius object
                  Object.keys(updates).forEach(key => {
                    if (key === 'borderRadius') {
                      // If all corners are the same, store as number for backward compatibility
                      const value = updates[key]
                      if (typeof value === 'string' && value.endsWith('px')) {
                        const numValue = parseInt(value.replace('px', '')) || 0
                        brObj = {
                          topLeft: { value: numValue, unit: 'px' },
                          topRight: { value: numValue, unit: 'px' },
                          bottomRight: { value: numValue, unit: 'px' },
                          bottomLeft: { value: numValue, unit: 'px' }
                        }
                      }
                    } else if (key.startsWith('borderRadius')) {
                      const corner = key.replace('borderRadius', '').charAt(0).toLowerCase() + key.replace('borderRadius', '').slice(1)
                      const value = updates[key]
                      if (typeof value === 'string' && value.endsWith('px')) {
                        const numValue = parseInt(value.replace('px', '')) || 0
                        brObj[corner] = { value: numValue, unit: 'px' }
                      }
                    }
                  })
                  
                  // Check if all corners are the same
                  const allSame = brObj.topLeft.value === brObj.topRight.value &&
                                 brObj.topRight.value === brObj.bottomRight.value &&
                                 brObj.bottomRight.value === brObj.bottomLeft.value &&
                                 brObj.topLeft.unit === brObj.topRight.unit &&
                                 brObj.topRight.unit === brObj.bottomRight.unit &&
                                 brObj.bottomRight.unit === brObj.bottomLeft.unit
                  
                  updateProperty('borderRadius', allSame ? brObj.topLeft.value : brObj)
                }}
              />
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
              <MultiSideInput
                label="Padding"
                baseKey="padding"
                type="sides"
                defaultValue={0}
                inputClassName="h-7 text-xs"
                getValue={(side: string) => {
                  const key = `padding${side.charAt(0).toUpperCase() + side.slice(1)}`
                  const baseValue = typeof widget.properties?.padding === 'number'
                    ? widget.properties.padding
                    : (typeof widget.properties?.padding === 'object' && widget.properties.padding !== null
                      ? (widget.properties.padding as any)[side] || 0
                      : 0)
                  const sideValue = widget.properties?.[key]
                  return sideValue !== undefined ? sideValue : baseValue
                }}
                setValue={(updates) => {
                  const props = widget.properties || {}
                  const newProps = { ...props }
                  Object.keys(updates).forEach(key => {
                    const value = updates[key]
                    if (typeof value === 'string' && value.endsWith('px')) {
                      const numValue = parseInt(value.replace('px', '')) || 0
                      newProps[key] = numValue
                    } else {
                      newProps[key] = value
                    }
                  })
                  setPlacedWidgets(prev => prev.map(w => 
                    w.id === selectedWidgetId 
                      ? { ...w, properties: newProps }
                      : w
                  ))
                }}
              />
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

