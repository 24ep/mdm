'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ComponentStyle, GlobalStyleConfig } from './types'
import { ColorInput } from './ColorInput'
import { MultiSideInput } from '@/components/shared/MultiSideInput'

interface ComponentStyleEditorProps {
  componentType: 'input' | 'select' | 'button' | 'tabs' | 'card' | 'table' | 'modal' | 'tooltip'
  style: ComponentStyle | undefined
  onUpdate: (style: Partial<ComponentStyle>) => void
  isMobileViewport: boolean
}

function ComponentStyleEditor({ componentType, style, onUpdate, isMobileViewport }: ComponentStyleEditorProps) {
  const updateStyle = (key: keyof ComponentStyle, value: any) => {
    onUpdate({ [key]: value })
  }

  return (
    <div className="space-y-3 pb-3">
      <Label className="text-xs font-semibold capitalize">{componentType}</Label>
      
      {/* Background Color */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Background</Label>
        <ColorInput
          value={style?.backgroundColor || '#ffffff'}
          onChange={(color) => updateStyle('backgroundColor', color)}
          allowImageVideo={false}
          className="relative"
          placeholder="#ffffff"
          inputClassName={`${isMobileViewport ? 'h-8' : 'h-7'} text-xs pl-7`}
        />
      </div>

      {/* Text Color */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Text Color</Label>
        <ColorInput
          value={style?.textColor || '#000000'}
          onChange={(color) => updateStyle('textColor', color)}
          allowImageVideo={false}
          className="relative"
          placeholder="#000000"
          inputClassName={`${isMobileViewport ? 'h-8' : 'h-7'} text-xs pl-7`}
        />
      </div>

      {/* Border */}
      <div className="grid grid-cols-2 gap-2">
        <MultiSideInput
          label="Border Width"
          baseKey="borderWidth"
          type="sides"
          defaultValue={1}
          inputClassName={`${isMobileViewport ? 'h-8' : 'h-7'} text-xs`}
          getValue={(side: string) => {
            const key = `borderWidth${side.charAt(0).toUpperCase() + side.slice(1)}`
            const baseValue = typeof style?.borderWidth === 'number' 
              ? style.borderWidth 
              : (style?.borderWidth || 1)
            const sideValue = (style as any)?.[key]
            return sideValue !== undefined ? sideValue : baseValue
          }}
          setValue={(updates) => {
            const newStyle: any = { ...style }
            Object.keys(updates).forEach(key => {
              const value = updates[key]
              if (typeof value === 'string' && value.endsWith('px')) {
                const numValue = parseInt(value.replace('px', '')) || 0
                newStyle[key] = numValue
              } else {
                newStyle[key] = value
              }
            })
            onUpdate(newStyle)
          }}
        />
        <MultiSideInput
          label="Border Radius"
          baseKey="borderRadius"
          type="corners"
          defaultValue={4}
          inputClassName={`${isMobileViewport ? 'h-8' : 'h-7'} text-xs`}
          getValue={(side: string) => {
            const br = style?.borderRadius
            if (typeof br === 'number') return br
            if (typeof br === 'object' && br !== null) {
              const obj = br as any
              const corner = obj[side]
              return corner?.value ?? 4
            }
            return 4
          }}
          setValue={(updates) => {
            const currentBr = style?.borderRadius
            
            // Initialize border radius object if it's a number
            let brObj: any = typeof currentBr === 'number' 
              ? {
                  topLeft: { value: currentBr, unit: 'px' },
                  topRight: { value: currentBr, unit: 'px' },
                  bottomRight: { value: currentBr, unit: 'px' },
                  bottomLeft: { value: currentBr, unit: 'px' }
                }
              : (currentBr || {
                  topLeft: { value: 4, unit: 'px' },
                  topRight: { value: 4, unit: 'px' },
                  bottomRight: { value: 4, unit: 'px' },
                  bottomLeft: { value: 4, unit: 'px' }
                })
            
            // Update the border radius object
            Object.keys(updates).forEach(key => {
              if (key === 'borderRadius') {
                const value = updates[key]
                if (typeof value === 'string' && value.endsWith('px')) {
                  const numValue = parseInt(value.replace('px', '')) || 4
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
                  const numValue = parseInt(value.replace('px', '')) || 4
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
            
            onUpdate({ borderRadius: allSame ? brObj.topLeft.value : brObj })
          }}
        />
      </div>

      {/* Border Color */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Border Color</Label>
        <ColorInput
          value={style?.borderColor || '#e5e7eb'}
          onChange={(color) => updateStyle('borderColor', color)}
          allowImageVideo={false}
          className="relative"
          placeholder="#e5e7eb"
          inputClassName={`${isMobileViewport ? 'h-8' : 'h-7'} text-xs pl-7`}
        />
      </div>

      {/* Spacing */}
      <div className="grid grid-cols-2 gap-2">
        <MultiSideInput
          label="Padding"
          baseKey="padding"
          type="sides"
          defaultValue={8}
          inputClassName={`${isMobileViewport ? 'h-8' : 'h-7'} text-xs`}
          getValue={(side: string) => {
            const key = `padding${side.charAt(0).toUpperCase() + side.slice(1)}`
            const baseValue = typeof style?.padding === 'number'
              ? style.padding
              : (typeof style?.padding === 'object' && style.padding !== null
                ? (style.padding as any)[side] || 8
                : 8)
            const sideValue = (style as any)?.[key]
            return sideValue !== undefined ? sideValue : baseValue
          }}
          setValue={(updates) => {
            const newStyle: any = { ...style }
            Object.keys(updates).forEach(key => {
              const value = updates[key]
              if (typeof value === 'string' && value.endsWith('px')) {
                const numValue = parseInt(value.replace('px', '')) || 0
                newStyle[key] = numValue
              } else {
                newStyle[key] = value
              }
            })
            onUpdate(newStyle)
          }}
        />
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Margin</Label>
          <Input
            type="number"
            value={style?.margin ?? 0}
            onChange={(e) => updateStyle('margin', parseInt(e.target.value) || 0)}
            className={`${isMobileViewport ? 'h-8' : 'h-7'} text-xs`}
            placeholder="0"
          />
        </div>
      </div>

      {/* Typography */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Font Size</Label>
          <Input
            type="number"
            value={style?.fontSize ?? 14}
            onChange={(e) => updateStyle('fontSize', parseInt(e.target.value) || 14)}
            className={`${isMobileViewport ? 'h-8' : 'h-7'} text-xs`}
            placeholder="14"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Font Weight</Label>
          <Select
            value={style?.fontWeight || 'normal'}
            onValueChange={(value: any) => updateStyle('fontWeight', value)}
          >
            <SelectTrigger className={`${isMobileViewport ? 'h-8' : 'h-7'} text-xs`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="semibold">Semibold</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Font Family */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Font Family</Label>
        <Select
          value={style?.fontFamily || 'inherit'}
          onValueChange={(value) => updateStyle('fontFamily', value)}
        >
          <SelectTrigger className={`${isMobileViewport ? 'h-8' : 'h-7'} text-xs`}>
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

      {/* Opacity */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Opacity</Label>
        <Input
          type="number"
          value={style?.opacity ?? 100}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 0
            const clampedValue = Math.max(0, Math.min(100, value))
            updateStyle('opacity', clampedValue)
          }}
          min={0}
          max={100}
          className={`${isMobileViewport ? 'h-8' : 'h-7'} text-xs`}
          placeholder="100"
        />
      </div>

      {/* Shadow */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Shadow</Label>
        <Switch
          checked={style?.shadow ?? false}
          onCheckedChange={(checked) => updateStyle('shadow', checked)}
        />
      </div>
    </div>
  )
}

interface GlobalComponentStylesProps {
  globalStyle: GlobalStyleConfig | undefined
  onUpdate: (updates: Partial<GlobalStyleConfig>) => void
  isMobileViewport: boolean
}

export function GlobalComponentStyles({ globalStyle, onUpdate, isMobileViewport }: GlobalComponentStylesProps) {
  const updateComponentStyle = (componentType: keyof NonNullable<GlobalStyleConfig['components']>, style: Partial<ComponentStyle>) => {
    onUpdate({
      components: {
        ...globalStyle?.components,
        [componentType]: {
          ...globalStyle?.components?.[componentType],
          ...style
        }
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className={`${isMobileViewport ? 'text-base' : 'text-sm'} font-semibold mb-2 px-4`}>
        Component Styles
      </div>
      <div className="w-full">
      <Accordion type="multiple" defaultValue={['input', 'button']}>
        <AccordionItem value="input" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4">Input</AccordionTrigger>
          <AccordionContent className="px-0 pt-2 pb-3 border-b">
            <div className="px-4">
              <ComponentStyleEditor
                componentType="input"
                style={globalStyle?.components?.input}
                onUpdate={(style) => updateComponentStyle('input', style)}
                isMobileViewport={isMobileViewport}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="select" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4">Select</AccordionTrigger>
          <AccordionContent className="px-0 pt-2 pb-3 border-b">
            <div className="px-4">
              <ComponentStyleEditor
                componentType="select"
                style={globalStyle?.components?.select}
                onUpdate={(style) => updateComponentStyle('select', style)}
                isMobileViewport={isMobileViewport}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="button" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4">Button</AccordionTrigger>
          <AccordionContent className="px-0 pt-2 pb-3 border-b">
            <div className="px-4">
              <ComponentStyleEditor
                componentType="button"
                style={globalStyle?.components?.button}
                onUpdate={(style) => updateComponentStyle('button', style)}
                isMobileViewport={isMobileViewport}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tabs" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4">Tabs</AccordionTrigger>
          <AccordionContent className="px-0 pt-2 pb-3 border-b">
            <div className="px-4">
              <ComponentStyleEditor
                componentType="tabs"
                style={globalStyle?.components?.tabs}
                onUpdate={(style) => updateComponentStyle('tabs', style)}
                isMobileViewport={isMobileViewport}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="card" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4">Card</AccordionTrigger>
          <AccordionContent className="px-0 pt-2 pb-3 border-b">
            <div className="px-4">
              <ComponentStyleEditor
                componentType="card"
                style={globalStyle?.components?.card}
                onUpdate={(style) => updateComponentStyle('card', style)}
                isMobileViewport={isMobileViewport}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="table" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4">Table</AccordionTrigger>
          <AccordionContent className="px-0 pt-2 pb-3 border-b">
            <div className="px-4">
              <ComponentStyleEditor
                componentType="table"
                style={globalStyle?.components?.table}
                onUpdate={(style) => updateComponentStyle('table', style)}
                isMobileViewport={isMobileViewport}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="modal" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4">Modal</AccordionTrigger>
          <AccordionContent className="px-0 pt-2 pb-3 border-b">
            <div className="px-4">
              <ComponentStyleEditor
                componentType="modal"
                style={globalStyle?.components?.modal}
                onUpdate={(style) => updateComponentStyle('modal', style)}
                isMobileViewport={isMobileViewport}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tooltip" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4">Tooltip</AccordionTrigger>
          <AccordionContent className="px-0 pt-2 pb-3 border-b">
            <div className="px-4">
              <ComponentStyleEditor
                componentType="tooltip"
                style={globalStyle?.components?.tooltip}
                onUpdate={(style) => updateComponentStyle('tooltip', style)}
                isMobileViewport={isMobileViewport}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      </div>
    </div>
  )
}

