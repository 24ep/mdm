'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Eye, Palette, Square, Sun, Tag, Settings } from 'lucide-react'

import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import type { Chatbot } from '../../types'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { AccordionSectionWrapper, AccordionSectionGroup } from '../components/AccordionSectionGroup'
import { MultiSideInput } from '../components/MultiSideInput'

interface WidgetButtonSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function WidgetButtonSection({ formData, setFormData }: WidgetButtonSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Widget Button</h3>
      </div>
      <AccordionSectionWrapper defaultValue="appearance">
        <AccordionSectionGroup id="appearance" title="Appearance" icon={Eye} defaultOpen>
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4 mt-4">
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
              <p className="text-xs text-muted-foreground">Position of chat window relative to widget button</p>
            </div>
            <div className="space-y-2">
              <Label>Widget-Popover Margin</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).widgetPopoverMargin)}
                  onChange={(e) => setFormData({ ...formData, widgetPopoverMargin: ensurePx(e.target.value) } as any)}
                  placeholder="10"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
              </div>
              <p className="text-xs text-muted-foreground">Spacing between widget button and popover window</p>
            </div>
          </div>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="size-colors" title="Size & Colors" icon={Palette}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Widget Size</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.widgetSize)}
                  onChange={(e) => setFormData({ ...formData, widgetSize: ensurePx(e.target.value) })}
                  placeholder="60"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Widget Background</Label>
              <ColorInput
                value={formData.widgetBackgroundColor || '#3b82f6'}
                onChange={(color) => setFormData({ ...formData, widgetBackgroundColor: color })}
                allowImageVideo={true}
                className="relative"
                placeholder="#3b82f6"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
              <p className="text-xs text-muted-foreground">
                Background color or image for the widget button
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
                  value={(formData as any).widgetBackgroundBlur ?? 0}
                  onChange={(e) => setFormData({ ...formData, widgetBackgroundBlur: parseInt(e.target.value) || 0 } as any)}
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
                  value={(formData as any).widgetBackgroundOpacity ?? 100}
                  onChange={(e) => setFormData({ ...formData, widgetBackgroundOpacity: parseInt(e.target.value) || 100 } as any)}
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
              <Label>Widget Border Color</Label>
              <ColorInput
                value={formData.widgetBorderColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, widgetBorderColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
            <MultiSideInput
              formData={formData}
              setFormData={setFormData}
              label="Widget Border Width"
              baseKey="widgetBorderWidth"
              defaultValue="2px"
              type="sides"
            />
            <MultiSideInput
              formData={formData}
              setFormData={setFormData}
              label="Widget Border Radius"
              baseKey="widgetBorderRadius"
              defaultValue="50px"
              type="corners"
            />
          </div>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="shadow" title="Shadow" icon={Sun}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Widget Shadow Color</Label>
              <ColorInput
                value={formData.widgetShadowColor || '#000000'}
                onChange={(color) => setFormData({ ...formData, widgetShadowColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#000000"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Widget Shadow Blur</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.widgetShadowBlur)}
                  onChange={(e) => setFormData({ ...formData, widgetShadowBlur: ensurePx(e.target.value) })}
                  placeholder="8"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Shadow Offset X</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).widgetShadowX || '0px')}
                  onChange={(e) => setFormData({ ...formData, widgetShadowX: ensurePx(e.target.value) } as any)}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
              </div>
              <p className="text-xs text-muted-foreground">Horizontal shadow offset</p>
            </div>
            <div className="space-y-2">
              <Label>Shadow Offset Y</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).widgetShadowY || '0px')}
                  onChange={(e) => setFormData({ ...formData, widgetShadowY: ensurePx(e.target.value) } as any)}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
              </div>
              <p className="text-xs text-muted-foreground">Vertical shadow offset</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Shadow Spread</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).widgetShadowSpread || '0px')}
                  onChange={(e) => setFormData({ ...formData, widgetShadowSpread: ensurePx(e.target.value) } as any)}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
              </div>
              <p className="text-xs text-muted-foreground">Shadow spread radius (positive values expand, negative values contract)</p>
            </div>
          </div>
        </AccordionSectionGroup>

        {formData.widgetAvatarStyle === 'circle-with-label' && (
          <AccordionSectionGroup id="label" title="Label" icon={Tag}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Widget Label Text</Label>
                <Input
                  value={formData.widgetLabelText}
                  onChange={(e) => setFormData({ ...formData, widgetLabelText: e.target.value })}
                  placeholder="Chat"
                />
              </div>
              <div className="space-y-2">
                <Label>Widget Label Color</Label>
                <ColorInput
                  value={formData.widgetLabelColor || '#ffffff'}
                  onChange={(color) => setFormData({ ...formData, widgetLabelColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#ffffff"
                  inputClassName="h-8 text-xs pl-7"
                />
              </div>
            </div>
          </AccordionSectionGroup>
        )}

        <AccordionSectionGroup id="behavior" title="Widget Behavior" icon={Settings}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Entrance Animation</Label>
              <Select
                value={formData.widgetAnimation || 'fade'}
                onValueChange={(v: any) => setFormData({ ...formData, widgetAnimation: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="fade">Fade</SelectItem>
                  <SelectItem value="slide">Slide</SelectItem>
                  <SelectItem value="bounce">Bounce</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Z-Index</Label>
              <Input
                type="number"
                value={formData.widgetZIndex || 9999}
                onChange={(e) => setFormData({ ...formData, widgetZIndex: parseInt(e.target.value) || 9999 })}
                placeholder="9999"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <Label>Auto Show Widget</Label>
              <p className="text-xs text-muted-foreground">Show widget automatically on page load</p>
            </div>
            <Switch
              checked={formData.widgetAutoShow !== undefined ? formData.widgetAutoShow : true}
              onCheckedChange={(checked) => setFormData({ ...formData, widgetAutoShow: checked })}
            />
          </div>

          {formData.widgetAutoShow && (
            <div className="space-y-2 mb-4">
              <Label>Auto Show Delay (seconds)</Label>
              <Input
                type="number"
                value={formData.widgetAutoShowDelay || 0}
                onChange={(e) => setFormData({ ...formData, widgetAutoShowDelay: parseInt(e.target.value) || 0 })}
                placeholder="0"
                min={0}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Horizontal Offset</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.widgetOffsetX)}
                  onChange={(e) => setFormData({ ...formData, widgetOffsetX: ensurePx(e.target.value) })}
                  placeholder="20"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vertical Offset</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.widgetOffsetY)}
                  onChange={(e) => setFormData({ ...formData, widgetOffsetY: ensurePx(e.target.value) })}
                  placeholder="20"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <Label>Show Notification Badge</Label>
              <p className="text-xs text-muted-foreground">Display unread message count badge</p>
            </div>
            <Switch
              checked={formData.showNotificationBadge || false}
              onCheckedChange={(checked) => setFormData({ ...formData, showNotificationBadge: checked })}
            />
          </div>

          {formData.showNotificationBadge && (
            <div className="space-y-2 mb-4">
              <Label>Notification Badge Color</Label>
              <div className="relative">
                <ColorInput
                  value={formData.notificationBadgeColor || '#ef4444'}
                  onChange={(color) => setFormData({ ...formData, notificationBadgeColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#ef4444"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>
            </div>
          )}
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
