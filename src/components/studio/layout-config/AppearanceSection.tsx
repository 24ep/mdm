'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RotateCcw, Eye, ChevronUp, ChevronRight, ChevronDown, ChevronLeft, Radius } from 'lucide-react'
import { PlacedWidget } from './widgets'
import { ComponentStyle } from './types'
import { getEffectiveStyle, isUsingGlobalStyle } from './globalStyleUtils'

interface AppearanceSectionProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  globalStyle?: ComponentStyle
}

export function AppearanceSection({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
  globalStyle,
}: AppearanceSectionProps) {
  const updateProperty = (key: string, value: any) => {
    setPlacedWidgets(prev => prev.map(w => 
      w.id === selectedWidgetId 
        ? { ...w, properties: { ...w.properties, [key]: value } }
        : w
    ))
  }

  const resetProperty = (key: string) => {
    const currentProperties = widget.properties || {}
    const newProperties = { ...currentProperties }
    delete newProperties[key]
    setPlacedWidgets(prev => prev.map(w => 
      w.id === selectedWidgetId 
        ? { ...w, properties: newProperties }
        : w
    ))
  }

  // Get effective opacity (widget property or global style)
  const globalOpacity = globalStyle?.opacity ? globalStyle.opacity / 100 : undefined
  const effectiveOpacity = widget.properties?.opacity ?? globalOpacity ?? 1

  const isOpacityGlobal = widget.properties?.opacity === undefined

  // Border radius configuration - default to all sides
  const borderRadius = widget.properties?.borderRadius || { 
    topLeft: { value: 0, unit: 'px' },
    topRight: { value: 0, unit: 'px' },
    bottomRight: { value: 0, unit: 'px' },
    bottomLeft: { value: 0, unit: 'px' }
  }
  
  // Handle legacy borderRadius (single number)
  const borderRadiusValue = typeof widget.properties?.borderRadius === 'number' 
    ? {
        topLeft: { value: widget.properties.borderRadius, unit: 'px' },
        topRight: { value: widget.properties.borderRadius, unit: 'px' },
        bottomRight: { value: widget.properties.borderRadius, unit: 'px' },
        bottomLeft: { value: widget.properties.borderRadius, unit: 'px' }
      }
    : (widget.properties?.borderRadius || borderRadius)

  const updateBorderRadius = (side: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft', value: number, unit: 'px' | '%') => {
    updateProperty('borderRadius', {
      ...borderRadiusValue,
      [side]: { value, unit }
    })
  }

  // Get summary of border radius for display
  const getBorderRadiusSummary = () => {
    if (typeof widget.properties?.borderRadius === 'number') {
      return `${widget.properties.borderRadius}px`
    }
    const br = borderRadiusValue
    const allSame = br.topLeft.value === br.topRight.value && 
                     br.topRight.value === br.bottomRight.value && 
                     br.bottomRight.value === br.bottomLeft.value &&
                     br.topLeft.unit === br.topRight.unit &&
                     br.topRight.unit === br.bottomRight.unit &&
                     br.bottomRight.unit === br.bottomLeft.unit
    if (allSame && br.topLeft.value === 0) {
      return '0'
    }
    if (allSame) {
      return `${br.topLeft.value}${br.topLeft.unit}`
    }
    return 'Custom'
  }

  return (
    <div className="space-y-2 py-4 ">
      {/* Opacity and Blend Mode */}
      <div className="px-4">
        <div className="flex items-center gap-2">
          <div className="relative w-40">
            <Eye className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none z-10" />
            <Input
              type="number"
              value={Math.round(effectiveOpacity * 100)}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0
                const clampedValue = Math.max(0, Math.min(100, value))
                updateProperty('opacity', clampedValue / 100)
              }}
              min={0}
              max={100}
              className="h-7 text-xs pl-7 pr-10"
              placeholder="100"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
            {!isOpacityGlobal && globalStyle && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
                onClick={() => resetProperty('opacity')}
                title="Reset to global style"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Select
            value={widget.properties?.blendMode || 'normal'}
            onValueChange={(value) => updateProperty('blendMode', value)}
          >
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="multiply">Multiply</SelectItem>
              <SelectItem value="screen">Screen</SelectItem>
              <SelectItem value="overlay">Overlay</SelectItem>
              <SelectItem value="darken">Darken</SelectItem>
              <SelectItem value="lighten">Lighten</SelectItem>
              <SelectItem value="color-dodge">Color Dodge</SelectItem>
              <SelectItem value="color-burn">Color Burn</SelectItem>
              <SelectItem value="hard-light">Hard Light</SelectItem>
              <SelectItem value="soft-light">Soft Light</SelectItem>
              <SelectItem value="difference">Difference</SelectItem>
              <SelectItem value="exclusion">Exclusion</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Border Radius Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 flex items-center justify-center hover:bg-gray-100 border-0 bg-transparent"
                title="Rounded Corners"
              >
                <Radius className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="p-4" 
              align="start" 
              style={{ 
                width: '280px', 
                minWidth: '280px',
                maxWidth: '280px'
              }}
            >
              <div className="space-y-3">
                <Label className="text-xs font-semibold">Rounded Corners</Label>
                
                {/* Border Radius Grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div></div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        value={borderRadiusValue.topRight.value || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          updateBorderRadius('topRight', val, borderRadiusValue.topRight.unit)
                        }}
                        className="h-7 text-xs pr-8"
                        placeholder="0"
                      />
                      <Select
                        value={borderRadiusValue.topRight.unit}
                         onValueChange={(unit: string) => updateBorderRadius('topRight', borderRadiusValue.topRight.value, unit as 'px' | '%')}
                      >
                        <SelectTrigger className="absolute right-0 top-0 h-7 w-8 px-1 text-xs border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="px">px</SelectItem>
                          <SelectItem value="%">%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div></div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        value={borderRadiusValue.topLeft.value || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          updateBorderRadius('topLeft', val, borderRadiusValue.topLeft.unit)
                        }}
                        className="h-7 text-xs pr-8"
                        placeholder="0"
                      />
                      <Select
                        value={borderRadiusValue.topLeft.unit}
                         onValueChange={(unit: string) => updateBorderRadius('topLeft', borderRadiusValue.topLeft.value, unit as 'px' | '%')}
                      >
                        <SelectTrigger className="absolute right-0 top-0 h-7 w-8 px-1 text-xs border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="px">px</SelectItem>
                          <SelectItem value="%">%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-center border border-gray-300 rounded h-12 bg-gray-50">
                    <span className="text-xs text-muted-foreground">Preview</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        value={borderRadiusValue.bottomRight.value || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          updateBorderRadius('bottomRight', val, borderRadiusValue.bottomRight.unit)
                        }}
                        className="h-7 text-xs pr-8"
                        placeholder="0"
                      />
                      <Select
                        value={borderRadiusValue.bottomRight.unit}
                         onValueChange={(unit: string) => updateBorderRadius('bottomRight', borderRadiusValue.bottomRight.value, unit as 'px' | '%')}
                      >
                        <SelectTrigger className="absolute right-0 top-0 h-7 w-8 px-1 text-xs border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="px">px</SelectItem>
                          <SelectItem value="%">%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div></div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        value={borderRadiusValue.bottomLeft.value || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          updateBorderRadius('bottomLeft', val, borderRadiusValue.bottomLeft.unit)
                        }}
                        className="h-7 text-xs pr-8"
                        placeholder="0"
                      />
                      <Select
                        value={borderRadiusValue.bottomLeft.unit}
                         onValueChange={(unit: string) => updateBorderRadius('bottomLeft', borderRadiusValue.bottomLeft.value, unit as 'px' | '%')}
                      >
                        <SelectTrigger className="absolute right-0 top-0 h-7 w-8 px-1 text-xs border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="px">px</SelectItem>
                          <SelectItem value="%">%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                {/* Summary Display */}
                <div className="text-xs text-muted-foreground text-center">
                  Current: {getBorderRadiusSummary()}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Typography */}
      <div className="px-4 mt-2 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Font Family</Label>
          <Select
            value={String(widget.properties?.fontFamily || 'inherit')}
            onValueChange={(value) => updateProperty('fontFamily', value)}
          >
            <SelectTrigger className="h-7 text-xs w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">Inherit</SelectItem>
              <SelectItem value="system-ui">System UI</SelectItem>
              <SelectItem value="Roboto">Roboto</SelectItem>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
              <SelectItem value="'Times New Roman'">Times New Roman</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Verdana">Verdana</SelectItem>
              <SelectItem value="'Courier New'">Courier New</SelectItem>
              <SelectItem value="monospace">Monospace</SelectItem>
              <SelectItem value="sans-serif">Sans-serif</SelectItem>
              <SelectItem value="serif">Serif</SelectItem>
              <SelectItem value="__custom_google__">Custom (Google)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Weight</Label>
          <Select
            value={String(widget.properties?.fontWeight || 'normal')}
            onValueChange={(value) => updateProperty('fontWeight', value)}
          >
            <SelectTrigger className="h-7 text-xs w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Style</Label>
          <Select
            value={String(widget.properties?.fontStyle || 'normal')}
            onValueChange={(value) => updateProperty('fontStyle', value)}
          >
            <SelectTrigger className="h-7 text-xs w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="italic">Italic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {String(widget.properties?.fontFamily) === '__custom_google__' && (
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Google Font Family</Label>
            <Input
              value={String(widget.properties?.googleFontFamily || '')}
              onChange={(e) => updateProperty('googleFontFamily', e.target.value)}
              placeholder="e.g., Inter or Open Sans"
              className="h-7 text-xs w-32"
            />
          </div>
        )}
      </div>
    </div>
  )
}

