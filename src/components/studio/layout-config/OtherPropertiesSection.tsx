'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { PlacedWidget } from './widgets'

interface OtherPropertiesSectionProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
}

export function OtherPropertiesSection({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
}: OtherPropertiesSectionProps) {
  const updateProperty = (key: string, value: any) => {
    setPlacedWidgets(prev => prev.map(w => 
      w.id === selectedWidgetId 
        ? { ...w, properties: { ...w.properties, [key]: value } }
        : w
    ))
  }

  return (
    <AccordionItem value="other" className="border-0">
      <AccordionTrigger className="text-xs font-semibold py-2 px-4">Other</AccordionTrigger>
      <AccordionContent className="px-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Visible</Label>
            <Switch
              checked={widget.properties?.visible ?? true}
              onCheckedChange={(checked) => updateProperty('visible', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Tooltip</Label>
            <Input
              value={widget.properties?.tooltip || ''}
              onChange={(e) => updateProperty('tooltip', e.target.value)}
              placeholder="Hover tooltip text"
              className="h-7 text-xs w-32"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">CSS Class</Label>
            <Input
              value={widget.properties?.cssClass || ''}
              onChange={(e) => updateProperty('cssClass', e.target.value)}
              placeholder="custom-class"
              className="h-7 text-xs w-32"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Z-Index</Label>
            <Input
              type="number"
              value={widget.properties?.zIndex || 0}
              onChange={(e) => updateProperty('zIndex', parseInt(e.target.value) || 0)}
              className="h-7 text-xs w-32"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Widget ID</Label>
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              {widget.id}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

