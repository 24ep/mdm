'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Plus, Eye, Minus, RotateCcw, ChevronUp, ChevronRight, ChevronDown, ChevronLeft } from 'lucide-react'
import { PlacedWidget } from './widgets'
import { ComponentStyle } from './types'
import { getEffectiveStyle, isUsingGlobalStyle } from './globalStyleUtils'
import { ColorPickerPopover } from './ColorPickerPopover'

interface StrokeSectionProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  globalStyle?: ComponentStyle
}

export function StrokeSection({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
  globalStyle,
}: StrokeSectionProps) {
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

  const showStroke = widget.properties?.showBorder ?? false

  // Get effective values
  const effectiveBorderColor = getEffectiveStyle(
    widget.properties?.borderColor,
    globalStyle,
    'borderColor'
  ) || '#e5e7eb'

  const effectiveBorderWidth = getEffectiveStyle(
    widget.properties?.borderWidth,
    globalStyle,
    'borderWidth'
  ) || 1

  const effectiveBorderStyle = widget.properties?.borderStyle || 'solid'

  // Border sides configuration - default to all sides
  const borderSides = widget.properties?.borderSides || {
    top: true,
    right: true,
    bottom: true,
    left: true
  }

  const toggleBorderSide = (side: 'top' | 'right' | 'bottom' | 'left') => {
    updateProperty('borderSides', {
      ...borderSides,
      [side]: !borderSides[side]
    })
  }

  const isBorderColorGlobal = isUsingGlobalStyle(
    widget.properties?.borderColor,
    globalStyle,
    'borderColor'
  )

  const isBorderWidthGlobal = isUsingGlobalStyle(
    widget.properties?.borderWidth,
    globalStyle,
    'borderWidth'
  )

  const handleAdd = () => {
    updateProperty('showBorder', true)
    if (!widget.properties?.borderWidth) {
      updateProperty('borderWidth', 1)
    }
    if (!widget.properties?.borderColor) {
      updateProperty('borderColor', '#e5e7eb')
    }
  }

  const handleRemove = () => {
    updateProperty('showBorder', false)
  }

  const handleToggleVisibility = () => {
    // Toggle stroke visibility by toggling showBorder
    updateProperty('showBorder', !showStroke)
  }

  return (
    <div className="space-y-2 px-4 pb-3 border-b">
      {/* Show/Hide Border Toggle */}
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs font-medium">Show border</Label>
        <Switch
          checked={showStroke}
          onCheckedChange={(checked) => updateProperty('showBorder', checked)}
        />
      </div>

      {/* Stroke Color */}
      <div className="relative mb-2">
        <ColorPickerPopover
          value={effectiveBorderColor}
          onChange={(color) => updateProperty('borderColor', color)}
          allowImageVideo={false}
        >
          <button
            type="button"
            className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10"
            style={{
              backgroundColor: effectiveBorderColor.startsWith('#') || effectiveBorderColor.startsWith('rgb') 
                ? effectiveBorderColor 
                : effectiveBorderColor.startsWith('linear-gradient') || effectiveBorderColor.startsWith('radial-gradient')
                ? 'transparent'
                : '#e5e7eb',
              border: 'none',
              outline: 'none',
              backgroundImage: effectiveBorderColor.startsWith('linear-gradient') || effectiveBorderColor.startsWith('radial-gradient')
                ? effectiveBorderColor
                : 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </ColorPickerPopover>
        <Input
          type="text"
          value={effectiveBorderColor}
          onChange={(e) => updateProperty('borderColor', e.target.value)}
          className="h-7 text-xs pl-7"
          placeholder="#e5e7eb"
        />
        {!isBorderColorGlobal && globalStyle && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
            onClick={() => resetProperty('borderColor')}
            title="Reset to global style"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Border Sides */}
      <div className="mb-2">
        <Label className="text-xs text-muted-foreground mb-2 block">Sides</Label>
        <div className="flex items-center justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 ${borderSides.top ? 'bg-gray-200' : 'bg-gray-100'} hover:bg-gray-300`}
            onClick={() => toggleBorderSide('top')}
            title="Top border"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 ${borderSides.left ? 'bg-gray-200' : 'bg-gray-100'} hover:bg-gray-300`}
              onClick={() => toggleBorderSide('left')}
              title="Left border"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 ${borderSides.right ? 'bg-gray-200' : 'bg-gray-100'} hover:bg-gray-300`}
              onClick={() => toggleBorderSide('right')}
              title="Right border"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 ${borderSides.bottom ? 'bg-gray-200' : 'bg-gray-100'} hover:bg-gray-300`}
            onClick={() => toggleBorderSide('bottom')}
            title="Bottom border"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Stroke Width & Style */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">Width</Label>
            {!isBorderWidthGlobal && globalStyle && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-auto"
                onClick={() => resetProperty('borderWidth')}
                title="Reset to global style"
              >
                <RotateCcw className="h-2.5 w-2.5" />
              </Button>
            )}
          </div>
          <Input
            type="number"
            value={effectiveBorderWidth}
            onChange={(e) => updateProperty('borderWidth', parseInt(e.target.value) || 1)}
            className="h-7 text-xs"
            placeholder="1"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Style</Label>
          <Select
            value={effectiveBorderStyle}
            onValueChange={(value) => updateProperty('borderStyle', value)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Solid</SelectItem>
              <SelectItem value="dashed">Dashed</SelectItem>
              <SelectItem value="dotted">Dotted</SelectItem>
              <SelectItem value="double">Double</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

