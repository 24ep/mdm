'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import type { SectionProps } from './types'
import { extractNumericValue, ensurePx } from '../styleUtils'

export function SendButtonSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  return (
    <AccordionItem value="sendButton" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Send Button
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Configure the appearance of the send button in the chat composer.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Send Button Background Color</Label>
              <ColorInput
                value={(formData as any).sendButtonBgColor || formData.primaryColor || '#3b82f6'}
                onChange={(color) => setFormData({ ...formData, sendButtonBgColor: color } as any)}
                allowImageVideo={false}
                className="relative"
                placeholder="#3b82f6"
                inputClassName="h-8 text-xs pl-7"
              />
            </div>
            <div className="space-y-2">
              <Label>Send Button Icon Color</Label>
              <ColorInput
                value={(formData as any).sendButtonIconColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, sendButtonIconColor: color } as any)}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-8 text-xs pl-7"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={(formData as any).sendButtonRounded || false}
              onCheckedChange={(checked) => setFormData({ ...formData, sendButtonRounded: checked } as any)}
            />
            <Label>Rounded Send Button</Label>
          </div>
          
          {/* Send Button Padding */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-md font-semibold mb-4">Send Button Padding</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Send Button Padding X</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue((formData as any).sendButtonPaddingX || '8px')}
                    onChange={(e) => setFormData({ ...formData, sendButtonPaddingX: ensurePx(e.target.value) } as any)}
                    placeholder="8"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Send Button Padding Y</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue((formData as any).sendButtonPaddingY || '8px')}
                    onChange={(e) => setFormData({ ...formData, sendButtonPaddingY: ensurePx(e.target.value) } as any)}
                    placeholder="8"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

