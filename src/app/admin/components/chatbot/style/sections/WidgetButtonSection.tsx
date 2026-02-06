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
import { FormRow, FormSection } from '../components/FormRow'

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
          <FormSection>
            <FormRow label="Avatar Style" description="Shape of the widget button">
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
            </FormRow>
            <FormRow label="Widget Position" description="Where the widget appears on screen">
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
            </FormRow>
            <FormRow label="Popover Position" description="Position of chat window relative to widget button">
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
            <FormRow label="Widget-Popover Margin" description="Spacing between widget button and popover window">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).widgetPopoverMargin)}
                  onChange={(e) => setFormData({ ...formData, widgetPopoverMargin: ensurePx(e.target.value) } as any)}
                  placeholder="10"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="size-colors" title="Size & Colors" icon={Palette}>
          <FormSection>
            <FormRow label="Widget Size" description="Size of the widget button">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.widgetSize)}
                  onChange={(e) => setFormData({ ...formData, widgetSize: ensurePx(e.target.value) })}
                  placeholder="60"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Widget Background" description="Background color or image for the widget button">
              <ColorInput
                value={formData.widgetBackgroundColor || '#3b82f6'}
                onChange={(color) => setFormData({ ...formData, widgetBackgroundColor: color })}
                allowImageVideo={true}
                className="relative"
                placeholder="#3b82f6"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Background Blur" description="Glassmorphism blur effect (0-100%)">
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
            </FormRow>
            <FormRow label="Background Opacity" description="Background transparency (0-100%)">
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
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="borders" title="Borders" icon={Square}>
          <FormSection>
            <FormRow label="Border Color" description="Color of the widget border">
              <ColorInput
                value={formData.widgetBorderColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, widgetBorderColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Border Width" description="Width of the widget border">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="widgetBorderWidth"
                defaultValue="2px"
                type="sides"
              />
            </FormRow>
            <FormRow label="Border Radius" description="Roundness of widget corners">
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label=""
                baseKey="widgetBorderRadius"
                defaultValue="50px"
                type="corners"
              />
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        <AccordionSectionGroup id="shadow" title="Shadow" icon={Sun}>
          <FormSection>
            <FormRow label="Shadow Color" description="Color of the widget shadow">
              <ColorInput
                value={formData.widgetShadowColor || '#000000'}
                onChange={(color) => setFormData({ ...formData, widgetShadowColor: color })}
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
                  value={extractNumericValue(formData.widgetShadowBlur)}
                  onChange={(e) => setFormData({ ...formData, widgetShadowBlur: ensurePx(e.target.value) })}
                  placeholder="8"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Shadow Offset X" description="Horizontal shadow offset">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).widgetShadowX || '0px')}
                  onChange={(e) => setFormData({ ...formData, widgetShadowX: ensurePx(e.target.value) } as any)}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Shadow Offset Y" description="Vertical shadow offset">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).widgetShadowY || '0px')}
                  onChange={(e) => setFormData({ ...formData, widgetShadowY: ensurePx(e.target.value) } as any)}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Shadow Spread" description="Shadow spread radius (positive expands, negative contracts)">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue((formData as any).widgetShadowSpread || '0px')}
                  onChange={(e) => setFormData({ ...formData, widgetShadowSpread: ensurePx(e.target.value) } as any)}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
          </FormSection>
        </AccordionSectionGroup>

        {formData.widgetAvatarStyle === 'circle-with-label' && (
          <AccordionSectionGroup id="label" title="Label" icon={Tag}>
            <FormSection>
              <FormRow label="Label Text" description="Text displayed on the widget">
                <Input
                  value={formData.widgetLabelText}
                  onChange={(e) => setFormData({ ...formData, widgetLabelText: e.target.value })}
                  placeholder="Chat"
                />
              </FormRow>
              <FormRow label="Label Color" description="Text color of the label">
                <ColorInput
                  value={formData.widgetLabelColor || '#ffffff'}
                  onChange={(color) => setFormData({ ...formData, widgetLabelColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#ffffff"
                  inputClassName="h-8 text-xs pl-7"
                />
              </FormRow>
              <FormRow label="Show Icon" description="Display icon next to the label text">
                <Switch
                  checked={formData.widgetLabelShowIcon !== false}
                  onCheckedChange={(checked) => setFormData({ ...formData, widgetLabelShowIcon: checked })}
                />
              </FormRow>
              {formData.widgetLabelShowIcon !== false && (
                <FormRow label="Icon Position" description="Position of icon relative to label">
                  <Select
                    value={formData.widgetLabelIconPosition || 'left'}
                    onValueChange={(v: any) => setFormData({ ...formData, widgetLabelIconPosition: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left of Label</SelectItem>
                      <SelectItem value="right">Right of Label</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>
              )}
              <FormRow label="Widget Shape" description="Shape of the label widget">
                <Select
                  value={(formData as any).widgetLabelShape || 'rounded'}
                  onValueChange={(v: any) => {
                    const shapeValues: Record<string, string> = {
                      'rounded': '8px',
                      'pill': '9999px',
                      'circle': '50%',
                      'custom': (formData as any).widgetLabelBorderRadius || '8px'
                    }
                    setFormData({
                      ...formData,
                      widgetLabelShape: v,
                      widgetLabelBorderRadius: shapeValues[v]
                    } as any)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rounded">Rounded</SelectItem>
                    <SelectItem value="pill">Pill (Full Rounded)</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>
              {(formData as any).widgetLabelShape === 'custom' && (
                <FormRow label="Custom Radius" description="Custom border radius value">
                  <div className="relative">
                    <Input
                      type="number"
                      value={extractNumericValue((formData as any).widgetLabelBorderRadius || '8px')}
                      onChange={(e) => setFormData({ ...formData, widgetLabelBorderRadius: ensurePx(e.target.value) } as any)}
                      placeholder="8"
                      className="pr-8"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
                  </div>
                </FormRow>
              )}
            </FormSection>
          </AccordionSectionGroup>
        )}

        <AccordionSectionGroup id="behavior" title="Widget Behavior" icon={Settings}>
          <FormSection>
            <FormRow label="Entrance Animation" description="Animation when widget appears">
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
            </FormRow>
            <FormRow label="Z-Index" description="Stack order of the widget">
              <Input
                type="number"
                value={formData.widgetZIndex || 9999}
                onChange={(e) => setFormData({ ...formData, widgetZIndex: parseInt(e.target.value) || 9999 })}
                placeholder="9999"
              />
            </FormRow>
            <FormRow label="Auto Open Chat" description="Automatically open chat window on page load">
              <Switch
                checked={formData.widgetAutoShow !== undefined ? formData.widgetAutoShow : true}
                onCheckedChange={(checked) => setFormData({ ...formData, widgetAutoShow: checked })}
              />
            </FormRow>
            {formData.widgetAutoShow && (
              <FormRow label="Auto Show Delay" description="Delay in seconds before auto-opening">
                <Input
                  type="number"
                  value={formData.widgetAutoShowDelay || 0}
                  onChange={(e) => setFormData({ ...formData, widgetAutoShowDelay: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min={0}
                />
              </FormRow>
            )}
            <FormRow label="Horizontal Offset" description="Distance from screen edge (X axis)">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.widgetOffsetX)}
                  onChange={(e) => setFormData({ ...formData, widgetOffsetX: ensurePx(e.target.value) })}
                  placeholder="20"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Vertical Offset" description="Distance from screen edge (Y axis)">
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.widgetOffsetY)}
                  onChange={(e) => setFormData({ ...formData, widgetOffsetY: ensurePx(e.target.value) })}
                  placeholder="20"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">px</span>
              </div>
            </FormRow>
            <FormRow label="Notification Badge" description="Display unread message count badge">
              <Switch
                checked={formData.showNotificationBadge || false}
                onCheckedChange={(checked) => setFormData({ ...formData, showNotificationBadge: checked })}
              />
            </FormRow>
            {formData.showNotificationBadge && (
              <FormRow label="Badge Color" description="Color of the notification badge">
                <ColorInput
                  value={formData.notificationBadgeColor || '#ef4444'}
                  onChange={(color) => setFormData({ ...formData, notificationBadgeColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#ef4444"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </FormRow>
            )}
          </FormSection>
        </AccordionSectionGroup>
      </AccordionSectionWrapper>
    </div>
  )
}
