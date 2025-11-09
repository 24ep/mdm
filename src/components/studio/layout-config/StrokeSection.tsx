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
import { ColorInput } from './ColorInput'
import { MultiSideInput } from '@/components/shared/MultiSideInput'

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

  const setBorderSides = (sides: Partial<Record<'top' | 'right' | 'bottom' | 'left', boolean>>) => {
    updateProperty('borderSides', {
      top: sides.top ?? false,
      right: sides.right ?? false,
      bottom: sides.bottom ?? false,
      left: sides.left ?? false,
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
    <div className="space-y-2 px-4 pb-3">
      {/* Show/Hide Border Toggle */}
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs font-medium">Show border</Label>
        <Switch
          checked={showStroke}
          onCheckedChange={(checked) => updateProperty('showBorder', checked)}
        />
      </div>

      {/* Stroke Color */}
      <div className="relative mb-2 w-28">
        <ColorInput
          value={effectiveBorderColor}
          onChange={(color) => updateProperty('borderColor', color)}
          allowImageVideo={false}
          className="relative"
          placeholder="#e5e7eb"
          inputClassName="h-7 text-xs pl-7"
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
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-muted-foreground">Sides</Label>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setBorderSides({ top: true, right: true, bottom: true, left: true })}>All</Button>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setBorderSides({})}>None</Button>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setBorderSides({ top: true, bottom: true })}>H</Button>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setBorderSides({ left: true, right: true })}>V</Button>
          </div>
        </div>
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
          <MultiSideInput
            label=""
            baseKey="borderWidth"
            type="sides"
            defaultValue={effectiveBorderWidth}
            inputClassName="h-7 text-xs"
            getValue={(side: string) => {
              const key = `borderWidth${side.charAt(0).toUpperCase() + side.slice(1)}`
              const baseValue = typeof widget.properties?.borderWidth === 'number' 
                ? widget.properties.borderWidth 
                : (widget.properties?.borderWidth || effectiveBorderWidth)
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
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-px bg-transparent" />
                  <span>None</span>
                </div>
              </SelectItem>
              <SelectItem value="solid">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-px bg-current" />
                  <span>Solid</span>
                </div>
              </SelectItem>
              <SelectItem value="dashed">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-0 border-t border-dashed border-current" />
                  <span>Dashed</span>
                </div>
              </SelectItem>
              <SelectItem value="dotted">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-0 border-t border-dotted border-current" />
                  <span>Dotted</span>
                </div>
              </SelectItem>
              <SelectItem value="double">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-0 border-t-4 border-b-0 border-current" style={{ boxShadow: '0 -3px 0 0 currentColor inset' as any }} />
                  <span>Double</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Corner Radius */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Corner Radius</Label>
        <MultiSideInput
          label=""
          baseKey="borderRadius"
          type="corners"
          defaultValue={0}
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
            
            Object.keys(updates).forEach(key => {
              if (key === 'borderRadius') {
                const value = updates[key]
                if (typeof value === 'string' && value.endsWith('px')) {
                  const numValue = parseInt(value.replace('px', '')) || 0
                  brObj = {
                    topLeft: { value: numValue, unit: 'px' },
                    topRight: { value: numValue, unit: 'px' },
                    bottomRight: { value: numValue, unit: 'px' },
                    bottomLeft: { value: numValue, unit: 'px' }
                  }
                } else if (typeof value === 'string' && value.endsWith('%')) {
                  const numValue = parseInt(value.replace('%', '')) || 0
                  brObj = {
                    topLeft: { value: numValue, unit: '%' },
                    topRight: { value: numValue, unit: '%' },
                    bottomRight: { value: numValue, unit: '%' },
                    bottomLeft: { value: numValue, unit: '%' }
                  }
                }
              } else if (key.startsWith('borderRadius')) {
                const corner = key.replace('borderRadius', '').charAt(0).toLowerCase() + key.replace('borderRadius', '').slice(1)
                const value = updates[key]
                if (typeof value === 'string' && value.endsWith('px')) {
                  const numValue = parseInt(value.replace('px', '')) || 0
                  brObj[corner] = { value: numValue, unit: 'px' }
                } else if (typeof value === 'string' && value.endsWith('%')) {
                  const numValue = parseInt(value.replace('%', '')) || 0
                  brObj[corner] = { value: numValue, unit: '%' }
                }
              }
            })
            
            const allSame = brObj.topLeft.value === brObj.topRight.value &&
                           brObj.topRight.value === brObj.bottomRight.value &&
                           brObj.bottomRight.value === brObj.bottomLeft.value &&
                           brObj.topLeft.unit === brObj.topRight.unit &&
                           brObj.topRight.unit === brObj.bottomRight.unit &&
                           brObj.bottomRight.unit === brObj.bottomLeft.unit
            
            updateProperty('borderRadius', allSame ? brObj.topLeft.value : brObj)
          }}
        />
      </div>
    </div>
  )
}

