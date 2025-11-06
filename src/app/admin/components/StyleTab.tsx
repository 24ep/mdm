'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useMemo, useState } from 'react'
import { ColorPickerPopover } from '@/components/studio/layout-config/ColorPickerPopover'
import * as Icons from 'lucide-react'

interface ChatbotVersion {
  id: string
  version: string
  createdAt: Date
  createdBy: string
  isPublished: boolean
  changes?: string
}

interface Chatbot {
  id: string
  name: string
  website: string
  description?: string
  apiEndpoint: string
  apiAuthType: 'none' | 'bearer' | 'api_key' | 'custom'
  apiAuthValue: string
  logo?: string
  primaryColor: string
  fontFamily: string
  fontSize: string
  fontColor: string
  borderColor: string
  borderWidth: string
  borderRadius: string
  // Message bubble borders
  bubbleBorderColor?: string
  bubbleBorderWidth?: string
  bubbleBorderRadius?: string
  messageBoxColor: string
  shadowColor: string
  shadowBlur: string
  conversationOpener: string
  followUpQuestions: string[]
  enableFileUpload: boolean
  showCitations: boolean
  deploymentType: 'popover' | 'fullpage' | 'popup-center'
  embedCode?: string
  widgetAvatarStyle: 'circle' | 'square' | 'circle-with-label'
  widgetPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center' | 'top-center'
  widgetSize: string
  widgetBackgroundColor: string
  widgetBorderColor: string
  widgetBorderWidth: string
  widgetBorderRadius: string
  widgetShadowColor: string
  widgetShadowBlur: string
  widgetLabelText?: string
  widgetLabelColor?: string
  widgetAnimation: 'none' | 'fade' | 'slide' | 'bounce'
  widgetAutoShow: boolean
  widgetAutoShowDelay: number
  widgetOffsetX: string
  widgetOffsetY: string
  widgetZIndex: number
  showNotificationBadge: boolean
  notificationBadgeColor: string
  chatWindowWidth: string
  chatWindowHeight: string
  // Chat window border (frame)
  chatWindowBorderColor?: string
  chatWindowBorderWidth?: string
  chatWindowBorderRadius?: string
  typingIndicatorStyle?: 'spinner' | 'dots' | 'pulse' | 'bounce'
  typingIndicatorColor?: string
  headerTitle?: string
  headerDescription?: string
  headerLogo?: string
  headerBgColor?: string
  headerFontColor?: string
  headerFontFamily?: string
  headerShowAvatar?: boolean
  headerBorderEnabled?: boolean
  headerBorderColor?: string
  headerPaddingX?: string
  headerPaddingY?: string
  avatarType?: 'icon' | 'image'
  avatarIcon?: string
  avatarIconColor?: string
  avatarBackgroundColor?: string
  avatarImageUrl?: string
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  versions: ChatbotVersion[]
  currentVersion: string
}

export function StyleTab({
  formData,
  setFormData,
}: {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}) {
  useMemo(() => {}, [formData])
  const [accordionValue, setAccordionValue] = useState<string>('brand')
  const getSwatchStyle = (color: string | undefined): React.CSSProperties => {
    const value = color || 'transparent'
    const isGradient = typeof value === 'string' && value.includes('gradient')
    return isGradient
      ? { backgroundImage: value as string, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 2 }
      : { backgroundColor: value as string, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 2 }
  }
  const ensurePx = (value: string): string => {
    if (value == null) return ''
    const v = String(value).trim()
    if (v === '') return ''
    if (/px|%|rem|em|vh|vw$/i.test(v)) return v
    if (/^-?\d+(\.\d+)?$/.test(v)) return `${v}px`
    return v
  }
  return (
    <Accordion type="single" collapsible value={accordionValue} onValueChange={setAccordionValue} className="space-y-2">
      {/* Brand & Typography */}
      <AccordionItem value="brand" className="border rounded-lg px-4">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
          Brand & Typography
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="relative">
              <ColorPickerPopover value={formData.primaryColor || '#3b82f6'} onChange={(v) => setFormData({ ...formData, primaryColor: v })} allowImageVideo={false}>
                <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.primaryColor || '#3b82f6')} onClick={(e) => e.stopPropagation()} />
              </ColorPickerPopover>
              <Input type="text" value={formData.primaryColor} onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })} className="pl-7" placeholder="#3b82f6 or css gradient" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Font Color</Label>
            <div className="relative">
              <ColorPickerPopover value={formData.fontColor || '#000000'} onChange={(v) => setFormData({ ...formData, fontColor: v })} allowImageVideo={false}>
                <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.fontColor || '#000000')} onClick={(e) => e.stopPropagation()} />
              </ColorPickerPopover>
              <Input type="text" value={formData.fontColor} onChange={(e) => setFormData({ ...formData, fontColor: e.target.value })} className="pl-7" placeholder="#000000 or css gradient" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Font Family</Label>
            <Select
              value={formData.fontFamily}
              onValueChange={(v) => setFormData({ ...formData, fontFamily: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Open Sans">Open Sans</SelectItem>
                <SelectItem value="Lato">Lato</SelectItem>
                <SelectItem value="Montserrat">Montserrat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Font Size</Label>
            <Input
              value={formData.fontSize}
              onChange={(e) => setFormData({ ...formData, fontSize: ensurePx(e.target.value) })}
              placeholder="14px"
            />
          </div>
        </div>
        </AccordionContent>
      </AccordionItem>

      {/* Surfaces & Borders */}
      <AccordionItem value="surfaces" className="border rounded-lg px-4">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
          Surfaces & Borders
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Border Color</Label>
            <div className="relative">
              <ColorPickerPopover value={formData.borderColor || '#e5e7eb'} onChange={(v) => setFormData({ ...formData, borderColor: v })} allowImageVideo={false}>
                <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.borderColor || '#e5e7eb')} onClick={(e) => e.stopPropagation()} />
              </ColorPickerPopover>
              <Input type="text" value={formData.borderColor} onChange={(e) => setFormData({ ...formData, borderColor: e.target.value })} className="pl-7" placeholder="#e5e7eb or css gradient" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Border Width</Label>
            <Input
              value={formData.borderWidth}
              onChange={(e) => setFormData({ ...formData, borderWidth: ensurePx(e.target.value) })}
              placeholder="1px"
            />
          </div>
          <div className="space-y-2">
            <Label>Border Radius</Label>
            <Input
              value={formData.borderRadius}
              onChange={(e) => setFormData({ ...formData, borderRadius: ensurePx(e.target.value) })}
              placeholder="8px"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Message Box Color</Label>
            <div className="relative">
              <ColorPickerPopover value={formData.messageBoxColor || '#ffffff'} onChange={(v) => setFormData({ ...formData, messageBoxColor: v })} allowImageVideo={false}>
                <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.messageBoxColor || '#ffffff')} onClick={(e) => e.stopPropagation()} />
              </ColorPickerPopover>
              <Input type="text" value={formData.messageBoxColor} onChange={(e) => setFormData({ ...formData, messageBoxColor: e.target.value })} className="pl-7" placeholder="#ffffff or css gradient" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Shadow Color</Label>
            <div className="relative">
              <ColorPickerPopover value={formData.shadowColor || '#000000'} onChange={(v) => setFormData({ ...formData, shadowColor: v })} allowImageVideo={false}>
                <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.shadowColor || '#000000')} onClick={(e) => e.stopPropagation()} />
              </ColorPickerPopover>
              <Input type="text" value={formData.shadowColor} onChange={(e) => setFormData({ ...formData, shadowColor: e.target.value })} className="pl-7" placeholder="#000000 or css gradient" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Shadow Blur</Label>
            <Input
              value={formData.shadowBlur}
              onChange={(e) => setFormData({ ...formData, shadowBlur: ensurePx(e.target.value) })}
              placeholder="4px"
            />
          </div>
        </div>

        {/* Message Bubble Border */}
        <div className="border-t pt-4 mt-4">
          <h4 className="text-md font-semibold mb-4">Message Bubble Border</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Bubble Border Color</Label>
              <div className="relative">
                <ColorPickerPopover value={formData.bubbleBorderColor || formData.borderColor || '#e5e7eb'} onChange={(v) => setFormData({ ...formData, bubbleBorderColor: v })} allowImageVideo={false}>
                  <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.bubbleBorderColor || formData.borderColor || '#e5e7eb')} onClick={(e) => e.stopPropagation()} />
                </ColorPickerPopover>
                <Input type="text" value={formData.bubbleBorderColor} onChange={(e) => setFormData({ ...formData, bubbleBorderColor: e.target.value })} className="pl-7" placeholder="#e5e7eb or css gradient" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bubble Border Width</Label>
              <Input
                value={formData.bubbleBorderWidth || formData.borderWidth}
                onChange={(e) => setFormData({ ...formData, bubbleBorderWidth: ensurePx(e.target.value) })}
                placeholder="1px"
              />
            </div>
            <div className="space-y-2">
              <Label>Bubble Border Radius</Label>
              <Input
                value={formData.bubbleBorderRadius || formData.borderRadius}
                onChange={(e) => setFormData({ ...formData, bubbleBorderRadius: ensurePx(e.target.value) })}
                placeholder="8px"
              />
            </div>
          </div>
        </div>
        </AccordionContent>
      </AccordionItem>

      {/* Widget Styling (Popover) */}
      <AccordionItem value="widget" className="border rounded-lg px-4">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
          Widget Styling (Popover)
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-6">

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
            <Label>Widget Size</Label>
            <Input
              value={formData.widgetSize}
              onChange={(e) => setFormData({ ...formData, widgetSize: ensurePx(e.target.value) })}
              placeholder="60px"
            />
          </div>
          <div className="space-y-2">
            <Label>Widget Background Color</Label>
            <div className="relative">
              <ColorPickerPopover value={formData.widgetBackgroundColor || '#3b82f6'} onChange={(v) => setFormData({ ...formData, widgetBackgroundColor: v })} allowImageVideo={false}>
                <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.widgetBackgroundColor || '#3b82f6')} onClick={(e) => e.stopPropagation()} />
              </ColorPickerPopover>
              <Input type="text" value={formData.widgetBackgroundColor} onChange={(e) => setFormData({ ...formData, widgetBackgroundColor: e.target.value })} className="pl-7" placeholder="#3b82f6 or css gradient" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Widget Border Color</Label>
            <div className="relative">
              <ColorPickerPopover value={formData.widgetBorderColor || '#ffffff'} onChange={(v) => setFormData({ ...formData, widgetBorderColor: v })} allowImageVideo={false}>
                <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.widgetBorderColor || '#ffffff')} onClick={(e) => e.stopPropagation()} />
              </ColorPickerPopover>
              <Input type="text" value={formData.widgetBorderColor} onChange={(e) => setFormData({ ...formData, widgetBorderColor: e.target.value })} className="pl-7" placeholder="#ffffff or css gradient" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Widget Border Width</Label>
            <Input
              value={formData.widgetBorderWidth}
              onChange={(e) => setFormData({ ...formData, widgetBorderWidth: ensurePx(e.target.value) })}
              placeholder="2px"
            />
          </div>
          <div className="space-y-2">
            <Label>Widget Border Radius</Label>
            <Input
              value={formData.widgetBorderRadius}
              onChange={(e) => setFormData({ ...formData, widgetBorderRadius: ensurePx(e.target.value) })}
              placeholder="50%"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Widget Shadow Color</Label>
            <div className="relative">
              <ColorPickerPopover value={formData.widgetShadowColor || '#000000'} onChange={(v) => setFormData({ ...formData, widgetShadowColor: v })} allowImageVideo={false}>
                <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.widgetShadowColor || '#000000')} onClick={(e) => e.stopPropagation()} />
              </ColorPickerPopover>
              <Input type="text" value={formData.widgetShadowColor} onChange={(e) => setFormData({ ...formData, widgetShadowColor: e.target.value })} className="pl-7" placeholder="#000000 or css gradient" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Widget Shadow Blur</Label>
            <Input
              value={formData.widgetShadowBlur}
              onChange={(e) => setFormData({ ...formData, widgetShadowBlur: ensurePx(e.target.value) })}
              placeholder="8px"
            />
          </div>
        </div>

        {formData.widgetAvatarStyle === 'circle-with-label' && (
          <div className="grid grid-cols-2 gap-4 mb-4">
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
              <div className="relative">
                <ColorPickerPopover value={formData.widgetLabelColor || '#ffffff'} onChange={(v) => setFormData({ ...formData, widgetLabelColor: v })} allowImageVideo={false}>
                  <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.widgetLabelColor || '#ffffff')} onClick={(e) => e.stopPropagation()} />
                </ColorPickerPopover>
                <Input value={formData.widgetLabelColor} onChange={(e) => setFormData({ ...formData, widgetLabelColor: e.target.value })} className="pl-7" placeholder="#ffffff or css gradient" />
              </div>
            </div>
          </div>
        )}

        {/* Widget Behavior */}
        <div className="border-t pt-4 mt-4">
          <h4 className="text-md font-semibold mb-4">Widget Behavior</h4>

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
              <Input
                value={formData.widgetOffsetX}
                onChange={(e) => setFormData({ ...formData, widgetOffsetX: ensurePx(e.target.value) })}
                placeholder="20px"
              />
            </div>
            <div className="space-y-2">
              <Label>Vertical Offset</Label>
              <Input
                value={formData.widgetOffsetY}
                onChange={(e) => setFormData({ ...formData, widgetOffsetY: ensurePx(e.target.value) })}
                placeholder="20px"
              />
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
                <ColorPickerPopover value={formData.notificationBadgeColor || '#ef4444'} onChange={(v) => setFormData({ ...formData, notificationBadgeColor: v })} allowImageVideo={false}>
                  <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.notificationBadgeColor || '#ef4444')} onClick={(e) => e.stopPropagation()} />
                </ColorPickerPopover>
                <Input value={formData.notificationBadgeColor} onChange={(e) => setFormData({ ...formData, notificationBadgeColor: e.target.value })} className="pl-7" placeholder="#ef4444 or css gradient" />
              </div>
            </div>
          )}

          {/* Typing Indicator */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Typing Indicator</Label>
              <Select
                value={formData.typingIndicatorStyle || 'spinner'}
                onValueChange={(v: any) => setFormData({ ...formData, typingIndicatorStyle: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spinner">Spinner</SelectItem>
                  <SelectItem value="dots">Dots</SelectItem>
                  <SelectItem value="pulse">Pulse</SelectItem>
                  <SelectItem value="bounce">Bounce</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Typing Indicator Color</Label>
              <div className="relative">
                <ColorPickerPopover value={formData.typingIndicatorColor || '#6b7280'} onChange={(v) => setFormData({ ...formData, typingIndicatorColor: v })} allowImageVideo={false}>
                  <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.typingIndicatorColor || '#6b7280')} onClick={(e) => e.stopPropagation()} />
                </ColorPickerPopover>
                <Input type="text" value={formData.typingIndicatorColor} onChange={(e) => setFormData({ ...formData, typingIndicatorColor: e.target.value })} className="pl-7" placeholder="#6b7280 or css gradient" />
              </div>
            </div>
          </div>
        </div>

        {/* Chat Window Size */}
        <div className="border-t pt-4 mt-4">
          <h4 className="text-md font-semibold mb-4">Chat Window Size</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Window Width</Label>
              <Input
                value={formData.chatWindowWidth}
                onChange={(e) => setFormData({ ...formData, chatWindowWidth: ensurePx(e.target.value) })}
                placeholder="380px"
              />
            </div>
            <div className="space-y-2">
              <Label>Window Height</Label>
              <Input
                value={formData.chatWindowHeight}
                onChange={(e) => setFormData({ ...formData, chatWindowHeight: ensurePx(e.target.value) })}
                placeholder="600px"
              />
            </div>
          </div>

          {/* Chat Window Border */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Window Border Color</Label>
              <div className="relative">
                <ColorPickerPopover value={formData.chatWindowBorderColor || formData.borderColor || '#e5e7eb'} onChange={(v) => setFormData({ ...formData, chatWindowBorderColor: v })} allowImageVideo={false}>
                  <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.chatWindowBorderColor || formData.borderColor || '#e5e7eb')} onClick={(e) => e.stopPropagation()} />
                </ColorPickerPopover>
                <Input type="text" value={formData.chatWindowBorderColor} onChange={(e) => setFormData({ ...formData, chatWindowBorderColor: e.target.value })} className="pl-7" placeholder="#e5e7eb or css gradient" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Window Border Width</Label>
              <Input
                value={formData.chatWindowBorderWidth || formData.borderWidth}
                onChange={(e) => setFormData({ ...formData, chatWindowBorderWidth: ensurePx(e.target.value) })}
                placeholder="1px"
              />
            </div>
            <div className="space-y-2">
              <Label>Window Border Radius</Label>
              <Input
                value={formData.chatWindowBorderRadius || formData.borderRadius}
                onChange={(e) => setFormData({ ...formData, chatWindowBorderRadius: ensurePx(e.target.value) })}
                placeholder="8px"
              />
            </div>
          </div>
        </div>
        </AccordionContent>
      </AccordionItem>

      {/* Header */}
      <AccordionItem value="header" className="border rounded-lg px-4">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
          Header
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Header Title</Label>
            <Input
              value={formData.headerTitle || ''}
              onChange={(e) => setFormData({ ...formData, headerTitle: e.target.value })}
              placeholder="Assistant name or title"
            />
          </div>
          <div className="space-y-2">
            <Label>Header Description</Label>
            <Input
              value={formData.headerDescription || ''}
              onChange={(e) => setFormData({ ...formData, headerDescription: e.target.value })}
              placeholder="Short tagline or description"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Header Logo URL</Label>
            <Input
              value={formData.headerLogo || ''}
              onChange={(e) => setFormData({ ...formData, headerLogo: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div className="space-y-2">
            <Label>Upload Header Logo</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = (ev) => {
                  const url = ev.target?.result as string
                  setFormData({ ...formData, headerLogo: url })
                }
                reader.readAsDataURL(file)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Header Font Family</Label>
            <Select
              value={formData.headerFontFamily || formData.fontFamily || 'Inter'}
              onValueChange={(v) => setFormData({ ...formData, headerFontFamily: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Open Sans">Open Sans</SelectItem>
                <SelectItem value="Lato">Lato</SelectItem>
                <SelectItem value="Montserrat">Montserrat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Header Background</Label>
            <div className="relative">
              <ColorPickerPopover value={formData.headerBgColor || '#3b82f6'} onChange={(v) => setFormData({ ...formData, headerBgColor: v })} allowImageVideo={false}>
                <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.headerBgColor || '#3b82f6')} onClick={(e) => e.stopPropagation()} />
              </ColorPickerPopover>
              <Input type="text" value={formData.headerBgColor} onChange={(e) => setFormData({ ...formData, headerBgColor: e.target.value })} className="pl-7" placeholder="#3b82f6 or css gradient" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Header Font Color</Label>
            <div className="relative">
              <ColorPickerPopover value={formData.headerFontColor || '#ffffff'} onChange={(v) => setFormData({ ...formData, headerFontColor: v })} allowImageVideo={false}>
                <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.headerFontColor || '#ffffff')} onClick={(e) => e.stopPropagation()} />
              </ColorPickerPopover>
              <Input type="text" value={formData.headerFontColor} onChange={(e) => setFormData({ ...formData, headerFontColor: e.target.value })} className="pl-7" placeholder="#ffffff or css gradient" />
            </div>
          </div>
        </div>

        {/* Header Options */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Show Header Avatar/Icon</Label>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Toggle avatar on header</span>
              <Switch checked={formData.headerShowAvatar !== false} onCheckedChange={(checked) => setFormData({ ...formData, headerShowAvatar: checked })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Show Header Border</Label>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Toggle bottom border</span>
              <Switch checked={formData.headerBorderEnabled !== false} onCheckedChange={(checked) => setFormData({ ...formData, headerBorderEnabled: checked })} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Header Border Color</Label>
            <div className="relative">
              <ColorPickerPopover value={formData.headerBorderColor || '#e5e7eb'} onChange={(v) => setFormData({ ...formData, headerBorderColor: v })} allowImageVideo={false}>
                <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.headerBorderColor || '#e5e7eb')} onClick={(e) => e.stopPropagation()} />
              </ColorPickerPopover>
              <Input type="text" value={formData.headerBorderColor} onChange={(e) => setFormData({ ...formData, headerBorderColor: e.target.value })} className="pl-7" placeholder="#e5e7eb or css gradient" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Header Padding X</Label>
            <Input value={formData.headerPaddingX || '16px'} onChange={(e) => setFormData({ ...formData, headerPaddingX: ensurePx(e.target.value) })} placeholder="16px" />
          </div>
          <div className="space-y-2">
            <Label>Header Padding Y</Label>
            <Input value={formData.headerPaddingY || '16px'} onChange={(e) => setFormData({ ...formData, headerPaddingY: ensurePx(e.target.value) })} placeholder="16px" />
          </div>
        </div>
        </AccordionContent>
      </AccordionItem>

      {/* Avatar */}
      <AccordionItem value="avatar" className="border rounded-lg px-4">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
          Avatar
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Avatar Type</Label>
            <Select
              value={formData.avatarType || 'icon'}
              onValueChange={(v: any) => setFormData({ ...formData, avatarType: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="icon">Icon</SelectItem>
                <SelectItem value="image">Upload Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.avatarType === 'icon' ? (
            <>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select
                  value={formData.avatarIcon || 'Bot'}
                  onValueChange={(v) => setFormData({ ...formData, avatarIcon: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {['Bot', 'MessageSquare', 'Sparkles', 'Brain', 'Zap', 'Star', 'Heart', 'Smile', 'User', 'Users', 'HelpCircle', 'Lightbulb', 'Rocket', 'Target', 'TrendingUp'].map((iconName) => {
                      const IconComponent = (Icons as any)[iconName] || Icons.Bot
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon Color</Label>
                  <div className="relative">
                    <ColorPickerPopover value={formData.avatarIconColor || '#ffffff'} onChange={(v) => setFormData({ ...formData, avatarIconColor: v })} allowImageVideo={false}>
                      <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.avatarIconColor || '#ffffff')} onClick={(e) => e.stopPropagation()} />
                    </ColorPickerPopover>
                    <Input type="text" value={formData.avatarIconColor} onChange={(e) => setFormData({ ...formData, avatarIconColor: e.target.value })} className="pl-7" placeholder="#ffffff or css gradient" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="relative">
                    <ColorPickerPopover value={formData.avatarBackgroundColor || '#3b82f6'} onChange={(v) => setFormData({ ...formData, avatarBackgroundColor: v })} allowImageVideo={false}>
                      <button type="button" className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer rounded-none z-10" style={getSwatchStyle(formData.avatarBackgroundColor || '#3b82f6')} onClick={(e) => e.stopPropagation()} />
                    </ColorPickerPopover>
                    <Input type="text" value={formData.avatarBackgroundColor} onChange={(e) => setFormData({ ...formData, avatarBackgroundColor: e.target.value })} className="pl-7" placeholder="#3b82f6 or css gradient" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={formData.avatarImageUrl || ''}
                onChange={(e) => setFormData({ ...formData, avatarImageUrl: e.target.value })}
                placeholder="https://example.com/avatar.png"
              />
            </div>
          )}
        </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default StyleTab


