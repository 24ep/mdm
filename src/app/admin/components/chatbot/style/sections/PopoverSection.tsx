'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Move, Maximize, Layers, Sun, Settings } from 'lucide-react'
import { extractNumericValue, ensurePx } from '../styleUtils'
import type { SectionProps } from './types'

export function PopoverSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="popover" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Popover Container
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Configure the popover container settings for popover deployment type.
          </p>

          <Accordion type="single" collapsible>
            <AccordionItem value="position-spacing" className="border-b">
              <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
                <div className="flex items-center gap-2">
                  <Move className="h-4 w-4" />
                  Position & Spacing
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4 pt-2 pb-4">
                  <div className="space-y-2">
                    <Label>Popover Position</Label>
                    <Select
                      value={formData.popoverPosition || 'left'}
                      onValueChange={(v: any) => setFormData({ ...formData, popoverPosition: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left of Widget</SelectItem>
                        <SelectItem value="top">Top of Widget</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Position of chat window relative to widget button
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Widget-Popover Margin</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={extractNumericValue((formData as any).widgetPopoverMargin || '10px')}
                        onChange={(e) => setFormData({ ...formData, widgetPopoverMargin: ensurePx(e.target.value) } as any)}
                        placeholder="10"
                        className="pr-8"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Spacing between widget button and popover window
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="container-size" className="border-b">
              <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
                <div className="flex items-center gap-2">
                  <Maximize className="h-4 w-4" />
                  Container Size
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4 pt-2 pb-4">
                  <div className="space-y-2">
                    <Label>Width</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={extractNumericValue(formData.chatWindowWidth || '380px')}
                        onChange={(e) => setFormData({ ...formData, chatWindowWidth: ensurePx(e.target.value) })}
                        placeholder="380"
                        className="pr-8"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Width of the popover chat window
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Height</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={extractNumericValue(formData.chatWindowHeight || '600px')}
                        onChange={(e) => setFormData({ ...formData, chatWindowHeight: ensurePx(e.target.value) })}
                        placeholder="600"
                        className="pr-8"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Height of the popover chat window
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="z-index" className="border-b">
              <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Z-Index
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-4 pt-2 pb-4">
                  <div className="space-y-2">
                    <Label>Z-Index</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={(formData as any).widgetZIndex ?? 9999}
                        onChange={(e) => setFormData({ ...formData, widgetZIndex: parseInt(e.target.value) || 9999 } as any)}
                        placeholder="9999"
                        className="pr-8"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Stacking order of the popover container (higher values appear on top)
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="shadow" className="border-b">
              <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Shadow
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4 pt-2 pb-4">
                  <div className="space-y-2">
                    <Label>Shadow Color</Label>
                    <ColorInput
                      value={formData.chatWindowShadowColor || formData.shadowColor || '#000000'}
                      onChange={(color) => setFormData({ ...formData, chatWindowShadowColor: color })}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#000000"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Color of the popover container shadow
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Shadow Blur</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={extractNumericValue(formData.chatWindowShadowBlur || formData.shadowBlur || '4px')}
                        onChange={(e) => setFormData({ ...formData, chatWindowShadowBlur: ensurePx(e.target.value) })}
                        placeholder="4"
                        className="pr-8"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Blur radius of the popover container shadow
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="chatkit-specific" className="border-b-0">
              <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  ChatKit Specific
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-2 pb-4">
                  <div className="p-3 bg-muted rounded text-sm text-muted-foreground">
                    <p className="text-xs">
                      ChatKit popover container uses the ChatKit theme settings for styling.
                      Configure theme colors, typography, and other visual properties in the ChatKit Theme section.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

