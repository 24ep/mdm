'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Move, Maximize, Layers, Sun, Settings } from 'lucide-react'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { FormRow, FormSection } from '../components/FormRow'
import type { SectionProps } from './types'

export function PopoverSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  const [openItem, setOpenItem] = useState('position-spacing')

  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configure the popover container settings for popover deployment type.
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        value={openItem}
        onValueChange={(val) => setOpenItem(val as string)}
      >
        <AccordionItem value="position-spacing" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Move className="h-4 w-4" />
              Position & Spacing
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Position" description="Position relative to widget button">
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
              </FormRow>
              <FormRow label="Margin" description="Spacing between widget and popover">
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
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="container-size" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Maximize className="h-4 w-4" />
              Container Size
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Width" description="Width of the popover chat window">
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
              </FormRow>
              <FormRow label="Height" description="Height of the popover chat window">
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
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="container-border" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border border-current rounded-sm" />
              Border
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Border Width" description="Width of the container border">
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue(formData.chatWindowBorderWidth || formData.borderWidth || '1px')}
                    onChange={(e) => setFormData({ ...formData, chatWindowBorderWidth: ensurePx(e.target.value) })}
                    placeholder="1"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </FormRow>
              <FormRow label="Border Radius" description="Roundness of container corners">
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue(formData.chatWindowBorderRadius || formData.borderRadius || '12px')}
                    onChange={(e) => setFormData({ ...formData, chatWindowBorderRadius: ensurePx(e.target.value) })}
                    placeholder="12"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </FormRow>
              <FormRow label="Border Color" description="Color of the container border">
                <ColorInput
                  value={formData.chatWindowBorderColor || formData.borderColor || '#e5e7eb'}
                  onChange={(color) => setFormData({ ...formData, chatWindowBorderColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#e5e7eb"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="z-index" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Z-Index
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Z-Index" description="Stacking order (higher = on top)">
                <div className="relative">
                  <Input
                    type="number"
                    value={(formData as any).widgetZIndex ?? 9999}
                    onChange={(e) => setFormData({ ...formData, widgetZIndex: parseInt(e.target.value) || 9999 } as any)}
                    placeholder="9999"
                  />
                </div>
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="shadow" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Shadow
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FormSection className="pt-2 pb-4">
              <FormRow label="Shadow Color" description="Color of the container shadow">
                <ColorInput
                  value={formData.chatWindowShadowColor || formData.shadowColor || '#000000'}
                  onChange={(color) => setFormData({ ...formData, chatWindowShadowColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#000000"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </FormRow>
              <FormRow label="Shadow Blur" description="Blur radius of the shadow">
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
              </FormRow>
            </FormSection>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="chatkit-specific" className="border-b-0 px-4">
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
  )
}
