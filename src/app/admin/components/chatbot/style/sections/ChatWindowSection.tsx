'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Maximize2, Palette, Square, Sun, Move, Layers } from 'lucide-react'

import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import type { Chatbot } from '../../types'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { MultiSideInput } from '../components/MultiSideInput'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'

interface ChatWindowSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function ChatWindowSection({ formData, setFormData }: ChatWindowSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Chat Window</h3>
      </div>
      <AccordionSectionWrapper defaultValue="size">
        <AccordionSectionGroup id="size" title="Size" icon={Maximize2} defaultOpen>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.chatWindowWidth)}
                  onChange={(e) => setFormData({ ...formData, chatWindowWidth: ensurePx(e.target.value) })}
                  placeholder="380"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Height</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.chatWindowHeight)}
                  onChange={(e) => setFormData({ ...formData, chatWindowHeight: ensurePx(e.target.value) })}
                  placeholder="600"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
              </div>
            </div>
          </div>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="background" title="Background & Colors" icon={Palette}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Background</Label>
              <ColorInput
                value={formData.messageBoxColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, messageBoxColor: color })}
                allowImageVideo={true}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
              <p className="text-xs text-muted-foreground">
                Background color or image for the chat window
              </p>
            </div>
            <div className="space-y-2">
              <Label>Upload Embed Header Logo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    const url = ev.target?.result as string
                    setFormData({ ...formData, logo: url })
                  }
                  reader.readAsDataURL(file)
                }}
              />
              <p className="text-xs text-muted-foreground">
                Logo shown in the embed/popover chat window header
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Background Blur (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={(formData as any).chatWindowBackgroundBlur ?? 0}
                  onChange={(e) => setFormData({ ...formData, chatWindowBackgroundBlur: parseInt(e.target.value) || 0 } as any)}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">Glassmorphism blur effect (0-100%)</p>
            </div>
            <div className="space-y-2">
              <Label>Background Opacity (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={(formData as any).chatWindowBackgroundOpacity ?? 100}
                  onChange={(e) => setFormData({ ...formData, chatWindowBackgroundOpacity: parseInt(e.target.value) || 100 } as any)}
                  placeholder="100"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">Background transparency (0-100%)</p>
            </div>
          </div>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="borders" title="Borders" icon={Square}>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Border Color</Label>
              <ColorInput
                value={formData.chatWindowBorderColor || formData.borderColor || '#e5e7eb'}
                onChange={(color) => setFormData({ ...formData, chatWindowBorderColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#e5e7eb"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
            <MultiSideInput
              formData={formData}
              setFormData={setFormData}
              label="Border Width"
              baseKey="chatWindowBorderWidth"
              defaultValue={formData.borderWidth || '1px'}
              type="sides"
            />
            <MultiSideInput
              formData={formData}
              setFormData={setFormData}
              label="Border Radius"
              baseKey="chatWindowBorderRadius"
              defaultValue={formData.borderRadius || '8px'}
              type="corners"
            />
          </div>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="shadow" title="Shadow" icon={Sun}>
          <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="space-y-2">
              <Label>Shadow Blur</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.chatWindowShadowBlur || formData.shadowBlur)}
                  onChange={(e) => setFormData({ ...formData, chatWindowShadowBlur: ensurePx(e.target.value) })}
                  placeholder="4"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
              </div>
            </div>
          </div>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="padding" title="Padding" icon={Move}>
          <div className="grid grid-cols-1 gap-4">
            <MultiSideInput
              formData={formData}
              setFormData={setFormData}
              label="Chat Window Padding"
              baseKey="chatWindowPadding"
              defaultValue="0px"
              type="sides"
            />
          </div>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="overlay" title="Overlay (When Chat is Open)" icon={Layers}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Overlay</Label>
                <p className="text-xs text-muted-foreground">
                  Show an overlay behind the chat window and widget when chat is open
                </p>
              </div>
              <Switch
                checked={(formData as any).overlayEnabled ?? false}
                onCheckedChange={(checked) => setFormData({ ...formData, overlayEnabled: checked } as any)}
              />
            </div>

            {(formData as any).overlayEnabled && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>Overlay Color</Label>
                  <ColorInput
                    value={(formData as any).overlayColor || '#000000'}
                    onChange={(color) => setFormData({ ...formData, overlayColor: color } as any)}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="#000000"
                    inputClassName="h-7 text-xs pl-7 w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Overlay Opacity (%)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={(formData as any).overlayOpacity ?? 50}
                      onChange={(e) => setFormData({ ...formData, overlayOpacity: parseInt(e.target.value) || 50 } as any)}
                      placeholder="50"
                      className="pr-8"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Overlay transparency (0-100%)</p>
                </div>
                <div className="space-y-2">
                  <Label>Overlay Blur (%)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={(formData as any).overlayBlur ?? 0}
                      onChange={(e) => setFormData({ ...formData, overlayBlur: parseInt(e.target.value) || 0 } as any)}
                      placeholder="0"
                      className="pr-8"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Glassmorphism blur effect (0-100%)</p>
                </div>
              </div>
            )}
          </div>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
