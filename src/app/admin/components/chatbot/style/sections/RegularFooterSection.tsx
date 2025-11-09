'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import * as Icons from 'lucide-react'
import { useEffect } from 'react'
import type { Chatbot } from '../../types'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { MultiSideInput } from '../components/MultiSideInput'
import { SectionGroup } from '../components/SectionGroup'

interface RegularFooterSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function RegularFooterSection({ formData, setFormData }: RegularFooterSectionProps) {
  // Migrate sendButtonPaddingX/Y to individual sides if needed
  useEffect(() => {
    if ((formData.sendButtonPaddingX || formData.sendButtonPaddingY) && 
        !formData.sendButtonPaddingTop && !formData.sendButtonPaddingRight && 
        !formData.sendButtonPaddingBottom && !formData.sendButtonPaddingLeft) {
      const y = formData.sendButtonPaddingY || '8px'
      const x = formData.sendButtonPaddingX || '8px'
      setFormData((prev) => ({
        ...prev,
        sendButtonPaddingTop: y,
        sendButtonPaddingRight: x,
        sendButtonPaddingBottom: y,
        sendButtonPaddingLeft: x,
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Migrate sendButtonRounded to border radius if needed
  useEffect(() => {
    if (formData.sendButtonRounded && !formData.sendButtonBorderRadius && 
        !formData.sendButtonBorderRadiusTopLeft && !formData.sendButtonBorderRadiusTopRight &&
        !formData.sendButtonBorderRadiusBottomRight && !formData.sendButtonBorderRadiusBottomLeft) {
      setFormData((prev) => ({
        ...prev,
        sendButtonBorderRadius: '9999px', // Fully rounded
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  return (
    <AccordionItem value="footer" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Footer/Input Area
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <SectionGroup title="Background & Padding" isFirst>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Footer Background Color</Label>
              <ColorInput
                value={formData.footerBgColor || formData.messageBoxColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, footerBgColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
            <MultiSideInput
              formData={formData}
              setFormData={setFormData}
              label="Footer Padding"
              baseKey="footerPadding"
              defaultValue="16px"
              type="sides"
            />
          </div>
        </SectionGroup>

        <SectionGroup title="Footer Borders">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Footer Border Color</Label>
              <ColorInput
                value={formData.footerBorderColor || formData.borderColor || '#e5e7eb'}
                onChange={(color) => setFormData({ ...formData, footerBorderColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#e5e7eb"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
            <MultiSideInput
              formData={formData}
              setFormData={setFormData}
              label="Footer Border Width"
              baseKey="footerBorderWidth"
              defaultValue={formData.borderWidth || '1px'}
              type="sides"
            />
            <MultiSideInput
              formData={formData}
              setFormData={setFormData}
              label="Footer Border Radius"
              baseKey="footerBorderRadius"
              defaultValue="0px"
              type="corners"
            />
          </div>
        </SectionGroup>

        <SectionGroup title="Input Field Styling">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Input Background Color</Label>
              <ColorInput
                value={formData.footerInputBgColor || formData.messageBoxColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, footerInputBgColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Input Font Color</Label>
              <ColorInput
                value={formData.footerInputFontColor || formData.fontColor || '#000000'}
                onChange={(color) => setFormData({ ...formData, footerInputFontColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#000000"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Input Border Color</Label>
              <ColorInput
                value={formData.footerInputBorderColor || formData.borderColor || '#e5e7eb'}
                onChange={(color) => setFormData({ ...formData, footerInputBorderColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#e5e7eb"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
            <MultiSideInput
              formData={formData}
              setFormData={setFormData}
              label="Input Border Width"
              baseKey="footerInputBorderWidth"
              defaultValue={formData.borderWidth || '1px'}
              type="sides"
            />
            <MultiSideInput
              formData={formData}
              setFormData={setFormData}
              label="Input Border Radius"
              baseKey="footerInputBorderRadius"
              defaultValue={formData.borderRadius || '8px'}
              type="corners"
            />
          </div>
        </SectionGroup>

        <SectionGroup title="Send Button Styling">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Send Button Icon</Label>
              <Select
                value={formData.sendButtonIcon || 'Send'}
                onValueChange={(v) => setFormData({ ...formData, sendButtonIcon: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {['Send', 'ArrowRight', 'PaperPlane', 'Zap', 'Check', 'ArrowUp', 'ChevronRight'].map((iconName) => {
                    const IconComponent = (Icons as any)[iconName] || Icons.Send
                    return (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{iconName}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Send Button Background Color</Label>
              <ColorInput
                value={formData.sendButtonBgColor || formData.primaryColor || '#3b82f6'}
                onChange={(color) => setFormData({ ...formData, sendButtonBgColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#3b82f6"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Send Button Icon Color</Label>
              <ColorInput
                value={formData.sendButtonIconColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, sendButtonIconColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Send Button Width</Label>
              <Input
                type="text"
                value={formData.sendButtonWidth || ''}
                onChange={(e) => setFormData({ ...formData, sendButtonWidth: e.target.value })}
                placeholder="40px (default: matches height)"
              />
              <p className="text-xs text-muted-foreground">Width of send button (defaults to match height for square)</p>
            </div>
            <div className="space-y-2">
              <Label>Send Button Height</Label>
              <Input
                type="text"
                value={formData.sendButtonHeight || ''}
                onChange={(e) => setFormData({ ...formData, sendButtonHeight: e.target.value })}
                placeholder="40px (default: matches input height)"
              />
              <p className="text-xs text-muted-foreground">Height of send button (defaults to input field height: 40px)</p>
            </div>
            <div className="space-y-2">
              <Label>Send Button Position</Label>
              <Select
                value={formData.sendButtonPosition || 'outside'}
                onValueChange={(v: 'inside' | 'outside') => setFormData({ ...formData, sendButtonPosition: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outside">Outside Input</SelectItem>
                  <SelectItem value="inside">Inside Input</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Position relative to input field</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MultiSideInput
              formData={formData}
              setFormData={setFormData}
              label="Send Button Border Radius"
              baseKey="sendButtonBorderRadius"
              defaultValue={
                formData.sendButtonRounded 
                  ? '9999px' // Fully rounded
                  : formData.sendButtonBorderRadius || '8px'
              }
              type="corners"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Send Button Shadow Color</Label>
              <ColorInput
                value={formData.sendButtonShadowColor || '#000000'}
                onChange={(color) => setFormData({ ...formData, sendButtonShadowColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#000000"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Send Button Shadow Blur</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.sendButtonShadowBlur || '0px')}
                  onChange={(e) => setFormData({ ...formData, sendButtonShadowBlur: ensurePx(e.target.value) })}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <MultiSideInput
              formData={formData}
              setFormData={setFormData}
              label="Send Button Padding"
              baseKey="sendButtonPadding"
              defaultValue="8px"
              type="sides"
            />
          </div>
        </SectionGroup>

        <SectionGroup title="File Upload Layout">
          <div className="space-y-2">
            <Label>Button Order</Label>
            <Select
              value={formData.fileUploadLayout || 'attach-first'}
              onValueChange={(v: 'attach-first' | 'input-first') => setFormData({ ...formData, fileUploadLayout: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attach-first">[Attach] [Input] [Send]</SelectItem>
                <SelectItem value="input-first">[Input] [Attach] [Send]</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the order of attach button, input field, and send button
            </p>
          </div>
        </SectionGroup>
      </AccordionContent>
    </AccordionItem>
  )
}

