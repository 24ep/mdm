'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { SectionProps } from './types'

export function WidgetSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="widget" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Widget Button
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Configure the widget button that appears when using popover or popup-center deployment types.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Avatar Style</Label>
              <Select
                value={formData.widgetAvatarStyle || 'circle'}
                onValueChange={(v: any) => setFormData({ ...formData, widgetAvatarStyle: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle">Circle</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="circle-with-label">Circle with Label</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Widget Position</Label>
              <Select
                value={formData.widgetPosition || 'bottom-right'}
                onValueChange={(v: any) => setFormData({ ...formData, widgetPosition: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="bottom-center">Bottom Center</SelectItem>
                  <SelectItem value="top-center">Top Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Widget Offset X</Label>
              <Input
                type="text"
                value={formData.widgetOffsetX || '20px'}
                onChange={(e) => setFormData({ ...formData, widgetOffsetX: e.target.value })}
                placeholder="20px"
              />
            </div>
            <div className="space-y-2">
              <Label>Widget Offset Y</Label>
              <Input
                type="text"
                value={formData.widgetOffsetY || '20px'}
                onChange={(e) => setFormData({ ...formData, widgetOffsetY: e.target.value })}
                placeholder="20px"
              />
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

