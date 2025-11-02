'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ComponentStyle, GlobalStyleConfig } from './types'

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
        <div className="relative">
          <Input
            type="color"
            value={style?.backgroundColor || '#ffffff'}
            onChange={(e) => updateStyle('backgroundColor', e.target.value)}
            className={`absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 border-0 cursor-pointer rounded-none`}
            style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none' }}
          />
          <Input
            type="text"
            value={style?.backgroundColor || '#ffffff'}
            onChange={(e) => updateStyle('backgroundColor', e.target.value)}
            className={`${isMobileViewport ? 'h-8' : 'h-7'} text-xs pl-7`}
            placeholder="#ffffff"
          />
        </div>
      </div>

      {/* Text Color */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Text Color</Label>
        <div className="relative">
          <Input
            type="color"
            value={style?.textColor || '#000000'}
            onChange={(e) => updateStyle('textColor', e.target.value)}
            className={`absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 border-0 cursor-pointer rounded-none`}
            style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none' }}
          />
          <Input
            type="text"
            value={style?.textColor || '#000000'}
            onChange={(e) => updateStyle('textColor', e.target.value)}
            className={`${isMobileViewport ? 'h-8' : 'h-7'} text-xs pl-7`}
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Border */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Border Width</Label>
          <Input
            type="number"
            value={style?.borderWidth ?? 1}
            onChange={(e) => updateStyle('borderWidth', parseInt(e.target.value) || 0)}
            className={`${isMobileViewport ? 'h-8' : 'h-7'} text-xs`}
            placeholder="1"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Border Radius</Label>
          <Input
            type="number"
            value={style?.borderRadius ?? 4}
            onChange={(e) => updateStyle('borderRadius', parseInt(e.target.value) || 0)}
            className={`${isMobileViewport ? 'h-8' : 'h-7'} text-xs`}
            placeholder="4"
          />
        </div>
      </div>

      {/* Border Color */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Border Color</Label>
        <div className="relative">
          <Input
            type="color"
            value={style?.borderColor || '#e5e7eb'}
            onChange={(e) => updateStyle('borderColor', e.target.value)}
            className={`absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 border-0 cursor-pointer rounded-none`}
            style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none' }}
          />
          <Input
            type="text"
            value={style?.borderColor || '#e5e7eb'}
            onChange={(e) => updateStyle('borderColor', e.target.value)}
            className={`${isMobileViewport ? 'h-8' : 'h-7'} text-xs pl-7`}
            placeholder="#e5e7eb"
          />
        </div>
      </div>

      {/* Spacing */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Padding</Label>
          <Input
            type="number"
            value={style?.padding ?? 8}
            onChange={(e) => updateStyle('padding', parseInt(e.target.value) || 0)}
            className={`${isMobileViewport ? 'h-8' : 'h-7'} text-xs`}
            placeholder="8"
          />
        </div>
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
      
      <Accordion type="multiple" defaultValue={['input', 'button']} className="w-full">
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
  )
}

