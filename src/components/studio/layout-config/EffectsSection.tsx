'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Eye, Minus, RotateCcw } from 'lucide-react'
import { PlacedWidget } from './widgets'
import { ComponentStyle } from './types'
import { isUsingGlobalStyle } from './globalStyleUtils'
import { ColorInput } from './ColorInput'

// Custom square with shadow icon
const SquareWithShadow = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Shadow */}
    <rect x="3" y="4" width="10" height="10" fill="#9ca3af" opacity="0.5" rx="0.4" />
    {/* Square */}
    <rect x="2" y="3" width="10" height="10" fill="#6b7280" rx="0.4" />
  </svg>
)

interface EffectsSectionProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  globalStyle?: ComponentStyle
}

export function EffectsSection({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
  globalStyle,
}: EffectsSectionProps) {
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

  // Get effective shadow value (widget property or global style)
  const effectiveShadow = widget.properties?.shadow ?? globalStyle?.shadow ?? false
  const isShadowGlobal = widget.properties?.shadow === undefined && globalStyle?.shadow !== undefined

  const shadowType = widget.properties?.shadowType || 'drop-shadow'

  const handleAdd = () => {
    updateProperty('shadow', true)
  }

  const handleRemove = () => {
    updateProperty('shadow', false)
  }

  const handleToggleVisibility = () => {
    // Toggle shadow visibility
    updateProperty('shadow', !effectiveShadow)
  }

  return (
    <div className="space-y-2 px-4 pb-3">
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 flex-shrink-0 bg-gray-200 hover:bg-gray-300 rounded-[4px]"
          onClick={() => updateProperty('shadow', !effectiveShadow)}
          title="Toggle Shadow"
        >
          <SquareWithShadow className={`h-4 w-4 ${effectiveShadow ? 'opacity-100' : 'opacity-50'}`} />
        </Button>
        <div className="flex-1 flex items-center gap-1">
          <Select
            value={shadowType}
            onValueChange={(value) => {
              if (!effectiveShadow) {
                updateProperty('shadow', true)
              }
              updateProperty('shadowType', value)
            }}
          >
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="drop-shadow">Drop Shadow</SelectItem>
              <SelectItem value="inner-shadow">Inner Shadow</SelectItem>
              <SelectItem value="glow">Glow</SelectItem>
            </SelectContent>
          </Select>
          {effectiveShadow && !isShadowGlobal && globalStyle && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => resetProperty('shadow')}
              title="Reset to global style"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Shadow Properties */}
      {effectiveShadow && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">X</Label>
            <Input
              type="number"
              value={widget.properties?.shadowX || 0}
              onChange={(e) => updateProperty('shadowX', parseInt(e.target.value) || 0)}
              className="h-7 text-xs"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Y</Label>
            <Input
              type="number"
              value={widget.properties?.shadowY || 0}
              onChange={(e) => updateProperty('shadowY', parseInt(e.target.value) || 0)}
              className="h-7 text-xs"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Blur</Label>
            <Input
              type="number"
              value={widget.properties?.shadowBlur || 4}
              onChange={(e) => updateProperty('shadowBlur', parseInt(e.target.value) || 4)}
              className="h-7 text-xs"
              placeholder="4"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Spread</Label>
            <Input
              type="number"
              value={widget.properties?.shadowSpread || 0}
              onChange={(e) => updateProperty('shadowSpread', parseInt(e.target.value) || 0)}
              className="h-7 text-xs"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Color</Label>
            <ColorInput
              value={widget.properties?.shadowColor || '#000000'}
              onChange={(color) => updateProperty('shadowColor', color)}
              allowImageVideo={false}
              className="relative"
              placeholder="#000000"
              inputClassName="h-7 text-xs pl-7"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Opacity (%)</Label>
            <Input
              type="number"
              value={widget.properties?.shadowOpacity !== undefined ? Math.round((widget.properties.shadowOpacity as number) * 100) : 25}
              onChange={(e) => {
                const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                updateProperty('shadowOpacity', v / 100)
              }}
              className="h-7 text-xs w-40"
              placeholder="25"
              min={0}
              max={100}
            />
          </div>
        </div>
      )}
    </div>
  )
}
