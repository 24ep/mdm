'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Eye, Minus, RotateCcw } from 'lucide-react'
import { PlacedWidget } from './widgets'
import { ComponentStyle } from './types'
import { getEffectiveStyle, isUsingGlobalStyle, resetToGlobalStyle } from './globalStyleUtils'
import { ColorInput } from './ColorInput'

interface FillSectionProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  globalStyle?: ComponentStyle
}

export function FillSection({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
  globalStyle,
}: FillSectionProps) {
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

  const showFill = widget.properties?.showBackground !== false
  const fillOpacity = widget.properties?.fillOpacity ?? (globalStyle?.opacity ? globalStyle.opacity / 100 : 1)

  // Get effective values (widget property or global style)
  const effectiveBackgroundColor = getEffectiveStyle(
    widget.properties?.backgroundColor,
    globalStyle,
    'backgroundColor'
  ) || '#f6f6f6'

  const isBgColorGlobal = isUsingGlobalStyle(
    widget.properties?.backgroundColor,
    globalStyle,
    'backgroundColor'
  )

  const isOpacityGlobal = widget.properties?.fillOpacity === undefined && widget.properties?.opacity === undefined

  const handleAdd = () => {
    updateProperty('showBackground', true)
  }

  const handleRemove = () => {
    updateProperty('showBackground', false)
  }

  const handleToggleVisibility = () => {
    // Toggle visibility - for fill, we can use opacity or a separate visibility flag
    const currentOpacity = widget.properties?.opacity ?? 1
    updateProperty('opacity', currentOpacity > 0 ? 0 : 1)
  }

  return (
    <div className="space-y-2 px-4 pb-3">
      {/* Fill Color and Opacity - Always visible */}
      <div className="flex items-center gap-2">
        <div className="relative basis-2/5 min-w-0">
          <ColorInput
            value={effectiveBackgroundColor}
            onChange={(color) => updateProperty('backgroundColor', color)}
            allowImageVideo={true}
            className="relative"
            placeholder="#f6f6f6"
            inputClassName="h-7 text-xs pl-7 w-full"
          />
          {!isBgColorGlobal && globalStyle && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
              onClick={() => resetProperty('backgroundColor')}
              title="Reset to global style"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="relative basis-3/5 min-w-0">
          <Eye className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none z-10" />
          <Input
            type="number"
            value={Math.round(fillOpacity * 100)}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0
              const clampedValue = Math.max(0, Math.min(100, value))
              updateProperty('fillOpacity', clampedValue / 100)
            }}
            min={0}
            max={100}
            className="h-7 text-xs pl-7 pr-10 w-full"
            placeholder="100"
          />
          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
          {!isOpacityGlobal && globalStyle && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
              onClick={() => {
                resetProperty('fillOpacity')
                resetProperty('opacity')
              }}
              title="Reset to global style"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

