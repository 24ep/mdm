'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useMemo, useState } from 'react'
import * as Icons from 'lucide-react'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'

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
  bubblePadding?: string
  // Message background colors
  userMessageBackgroundColor?: string
  botMessageBackgroundColor?: string
  // Message display options
  showMessageName?: boolean
  messageName?: string
  messageNamePosition?: 'top-of-message' | 'top-of-avatar'
  showMessageAvatar?: boolean
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
  // Chat window shadow
  chatWindowShadowColor?: string
  chatWindowShadowBlur?: string
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
  // Footer/Input Area
  footerBgColor?: string
  footerBorderColor?: string
  footerBorderWidth?: string
  footerBorderRadius?: string
  footerPaddingX?: string
  footerPaddingY?: string
  footerInputBgColor?: string
  footerInputBorderColor?: string
  footerInputBorderWidth?: string
  footerInputBorderRadius?: string
  footerInputFontColor?: string
  // Send Button
  sendButtonIcon?: string
  sendButtonRounded?: boolean
  sendButtonBgColor?: string
  sendButtonIconColor?: string
  sendButtonShadowColor?: string
  sendButtonShadowBlur?: string
  // File Upload Layout
  fileUploadLayout?: 'attach-first' | 'input-first'
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
  const [accordionValue, setAccordionValue] = useState<string>('chat-window')
  
  // Extract hex color from value (for color input which only accepts hex)
  const extractHexColor = (value: string | undefined): string => {
    if (!value) return '#000000'
    // If it's already a hex color, return it
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
      return value
    }
    // If it's a gradient or other format, try to extract first hex color
    const hexMatch = value.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/i)
    return hexMatch ? hexMatch[0] : '#000000'
  }
  
  // Extract numeric value from string (removes px, %, etc.)
  const extractNumericValue = (value: string | undefined): string => {
    if (!value) return ''
    const v = String(value).trim()
    if (v === '') return ''
    // Extract number part
    const match = v.match(/^-?\d+(\.\d+)?/)
    return match ? match[0] : ''
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
    <Accordion type="single" collapsible value={accordionValue} onValueChange={setAccordionValue} className="space-y-0">
      {/* Chat Window */}
      <AccordionItem value="chat-window" className="border-b px-4">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
          Chat Window
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-6">
        {/* Window Size */}
        <div className="mb-4">
          <h4 className="text-md font-semibold mb-4">Size</h4>
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
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
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
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </div>
          </div>
        </div>

        {/* Background & Colors */}
        <div className="border-t pt-4 mb-4">
          <h4 className="text-md font-semibold mb-4">Background & Colors</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Background Color</Label>
              <ColorInput
                value={formData.messageBoxColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, messageBoxColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
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
        </div>

        {/* Borders */}
        <div className="border-t pt-4 mb-4">
          <h4 className="text-md font-semibold mb-4">Borders</h4>
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
            <div className="space-y-2">
              <Label>Border Width</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.chatWindowBorderWidth || formData.borderWidth)}
                  onChange={(e) => setFormData({ ...formData, chatWindowBorderWidth: ensurePx(e.target.value) })}
                  placeholder="1"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Border Radius</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.chatWindowBorderRadius || formData.borderRadius)}
                  onChange={(e) => setFormData({ ...formData, chatWindowBorderRadius: ensurePx(e.target.value) })}
                  placeholder="8"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shadow */}
        <div className="border-t pt-4">
          <h4 className="text-md font-semibold mb-4">Shadow</h4>
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
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </div>
          </div>
        </div>
        </AccordionContent>
      </AccordionItem>

      {/* Widget Button */}
      <AccordionItem value="widget" className="border-b px-4">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
          Widget Button
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
            <div className="relative">
              <Input
                type="number"
                value={extractNumericValue(formData.widgetSize)}
                onChange={(e) => setFormData({ ...formData, widgetSize: ensurePx(e.target.value) })}
                placeholder="60"
                className="pr-8"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Widget Background Color</Label>
            <ColorInput
              value={formData.widgetBackgroundColor || '#3b82f6'}
              onChange={(color) => setFormData({ ...formData, widgetBackgroundColor: color })}
              allowImageVideo={false}
              className="relative"
              placeholder="#3b82f6"
              inputClassName="h-7 text-xs pl-7 w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
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
          <div className="space-y-2">
            <Label>Widget Border Width</Label>
            <div className="relative">
              <Input
                type="number"
                value={extractNumericValue(formData.widgetBorderWidth)}
                onChange={(e) => setFormData({ ...formData, widgetBorderWidth: ensurePx(e.target.value) })}
                placeholder="2"
                className="pr-8"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Widget Border Radius</Label>
            {formData.widgetBorderRadius && formData.widgetBorderRadius.includes('%') ? (
              <Input
                value={formData.widgetBorderRadius}
                onChange={(e) => setFormData({ ...formData, widgetBorderRadius: e.target.value })}
                placeholder="50%"
              />
            ) : (
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.widgetBorderRadius)}
                  onChange={(e) => setFormData({ ...formData, widgetBorderRadius: ensurePx(e.target.value) })}
                  placeholder="50"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
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
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
            </div>
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
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={extractHexColor(formData.widgetLabelColor || '#ffffff')}
                  onChange={(e) => setFormData({ ...formData, widgetLabelColor: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.widgetLabelColor || '#ffffff'}
                  onChange={(e) => setFormData({ ...formData, widgetLabelColor: e.target.value })}
                  placeholder="#ffffff"
                />
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
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.widgetOffsetX)}
                  onChange={(e) => setFormData({ ...formData, widgetOffsetX: ensurePx(e.target.value) })}
                  placeholder="20"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
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
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
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
                <ColorInput
                  value={formData.typingIndicatorColor || '#6b7280'}
                  onChange={(color) => setFormData({ ...formData, typingIndicatorColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#6b7280"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        </AccordionContent>
      </AccordionItem>

      {/* Messages */}
      <AccordionItem value="messages" className="border-b px-4">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
          Messages
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-6">
        {/* Message Background Colors */}
        <div className="mb-4">
          <h4 className="text-md font-semibold mb-4">Message Background Colors</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>User Message Background</Label>
              <ColorInput
                value={formData.userMessageBackgroundColor || formData.primaryColor || '#3b82f6'}
                onChange={(color) => setFormData({ ...formData, userMessageBackgroundColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#3b82f6"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Bot Message Background</Label>
              <ColorInput
                value={formData.botMessageBackgroundColor || '#f3f4f6'}
                onChange={(color) => setFormData({ ...formData, botMessageBackgroundColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#f3f4f6"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
          </div>
        </div>

        {/* Message Display Options */}
        <div className="border-t pt-4 mb-4">
          <h4 className="text-md font-semibold mb-4">Message Display Options</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Message Name</Label>
                <p className="text-xs text-muted-foreground">Display name above messages</p>
              </div>
              <Switch
                checked={formData.showMessageName !== undefined ? formData.showMessageName : false}
                onCheckedChange={(checked) => setFormData({ ...formData, showMessageName: checked })}
              />
            </div>

            {formData.showMessageName && (
              <>
                <div className="space-y-2">
                  <Label>Message Name</Label>
                  <Input
                    value={formData.messageName || ''}
                    onChange={(e) => setFormData({ ...formData, messageName: e.target.value })}
                    placeholder="Leave empty to use chatbot name"
                  />
                  <p className="text-xs text-muted-foreground">
                    If empty, will use chatbot name or header title
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Message Name Position</Label>
                  <Select
                    value={formData.messageNamePosition || 'top-of-message'}
                    onValueChange={(v: 'top-of-message' | 'top-of-avatar') => setFormData({ ...formData, messageNamePosition: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-of-message">Top of Message</SelectItem>
                      <SelectItem value="top-of-avatar">Top of Avatar</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose where to display the message name
                  </p>
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Message Avatar</Label>
                <p className="text-xs text-muted-foreground">Display avatar before messages</p>
              </div>
              <Switch
                checked={formData.showMessageAvatar !== undefined ? formData.showMessageAvatar : true}
                onCheckedChange={(checked) => setFormData({ ...formData, showMessageAvatar: checked })}
              />
            </div>
          </div>
        </div>

        {/* Bubble Borders */}
        <div className="border-t pt-4">
          <h4 className="text-md font-semibold mb-4">Bubble Borders</h4>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Bubble Border Color</Label>
              <div className="relative">
                <ColorInput
                  value={formData.bubbleBorderColor || formData.borderColor || '#e5e7eb'}
                  onChange={(color) => setFormData({ ...formData, bubbleBorderColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#e5e7eb"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bubble Border Width</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.bubbleBorderWidth || formData.borderWidth)}
                  onChange={(e) => setFormData({ ...formData, bubbleBorderWidth: ensurePx(e.target.value) })}
                  placeholder="1"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bubble Border Radius</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.bubbleBorderRadius || formData.borderRadius)}
                  onChange={(e) => setFormData({ ...formData, bubbleBorderRadius: ensurePx(e.target.value) })}
                  placeholder="8"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bubble Padding</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.bubblePadding || '12px')}
                  onChange={(e) => setFormData({ ...formData, bubblePadding: ensurePx(e.target.value) })}
                  placeholder="12"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </div>
          </div>
        </div>
        </AccordionContent>
      </AccordionItem>

      {/* Header */}
      <AccordionItem value="header" className="border-b px-4">
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
              className="bg-transparent border-none shadow-none focus-visible:ring-0"
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
              <ColorInput
                value={formData.headerBgColor || '#3b82f6'}
                onChange={(color) => setFormData({ ...formData, headerBgColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#3b82f6"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Header Font Color</Label>
            <div className="relative">
              <ColorInput
                value={formData.headerFontColor || '#ffffff'}
                onChange={(color) => setFormData({ ...formData, headerFontColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#ffffff"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
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
              <ColorInput
                value={formData.headerBorderColor || '#e5e7eb'}
                onChange={(color) => setFormData({ ...formData, headerBorderColor: color })}
                allowImageVideo={false}
                className="relative"
                placeholder="#e5e7eb"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Header Padding X</Label>
            <div className="relative">
              <Input
                type="number"
                value={extractNumericValue(formData.headerPaddingX || '16px')}
                onChange={(e) => setFormData({ ...formData, headerPaddingX: ensurePx(e.target.value) })}
                placeholder="16"
                className="pr-8"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Header Padding Y</Label>
            <div className="relative">
              <Input
                type="number"
                value={extractNumericValue(formData.headerPaddingY || '16px')}
                onChange={(e) => setFormData({ ...formData, headerPaddingY: ensurePx(e.target.value) })}
                placeholder="16"
                className="pr-8"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
            </div>
          </div>
        </div>
        </AccordionContent>
      </AccordionItem>

      {/* Footer/Input Area */}
      <AccordionItem value="footer" className="border-b px-4">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
          Footer/Input Area
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-6">
        {/* Footer Background & Padding */}
        <div className="mb-4">
          <h4 className="text-md font-semibold mb-4">Footer Background & Padding</h4>
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
            <div className="space-y-2">
              <Label>Footer Padding X</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.footerPaddingX || '16px')}
                  onChange={(e) => setFormData({ ...formData, footerPaddingX: ensurePx(e.target.value) })}
                  placeholder="16"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Footer Padding Y</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.footerPaddingY || '16px')}
                  onChange={(e) => setFormData({ ...formData, footerPaddingY: ensurePx(e.target.value) })}
                  placeholder="16"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Borders */}
        <div className="border-t pt-4 mb-4">
          <h4 className="text-md font-semibold mb-4">Footer Borders</h4>
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
            <div className="space-y-2">
              <Label>Footer Border Width</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.footerBorderWidth || formData.borderWidth)}
                  onChange={(e) => setFormData({ ...formData, footerBorderWidth: ensurePx(e.target.value) })}
                  placeholder="1"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Footer Border Radius</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.footerBorderRadius || '0px')}
                  onChange={(e) => setFormData({ ...formData, footerBorderRadius: ensurePx(e.target.value) })}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </div>
          </div>
        </div>

        {/* Input Field Styling */}
        <div className="border-t pt-4">
          <h4 className="text-md font-semibold mb-4">Input Field Styling</h4>
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
            <div className="space-y-2">
              <Label>Input Border Width</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.footerInputBorderWidth || formData.borderWidth)}
                  onChange={(e) => setFormData({ ...formData, footerInputBorderWidth: ensurePx(e.target.value) })}
                  placeholder="1"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Input Border Radius</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={extractNumericValue(formData.footerInputBorderRadius || formData.borderRadius)}
                  onChange={(e) => setFormData({ ...formData, footerInputBorderRadius: ensurePx(e.target.value) })}
                  placeholder="8"
                  className="pr-8"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
              </div>
            </div>
          </div>
        </div>

        {/* Send Button Styling */}
        <div className="border-t pt-4 mb-4">
          <h4 className="text-md font-semibold mb-4">Send Button Styling</h4>
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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Rounded Button</Label>
                <p className="text-xs text-muted-foreground">Make send button fully rounded</p>
              </div>
              <Switch
                checked={formData.sendButtonRounded !== undefined ? formData.sendButtonRounded : false}
                onCheckedChange={(checked) => setFormData({ ...formData, sendButtonRounded: checked })}
              />
            </div>
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
        </div>

        {/* File Upload Layout */}
        <div className="border-t pt-4">
          <h4 className="text-md font-semibold mb-4">File Upload Layout</h4>
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
        </div>
        </AccordionContent>
      </AccordionItem>

      {/* Avatar */}
      <AccordionItem value="avatar" className="border-b px-4">
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
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={extractHexColor(formData.avatarIconColor || '#ffffff')}
                      onChange={(e) => setFormData({ ...formData, avatarIconColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.avatarIconColor || '#ffffff'}
                      onChange={(e) => setFormData({ ...formData, avatarIconColor: e.target.value })}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={extractHexColor(formData.avatarBackgroundColor || '#3b82f6')}
                      onChange={(e) => setFormData({ ...formData, avatarBackgroundColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.avatarBackgroundColor || '#3b82f6'}
                      onChange={(e) => setFormData({ ...formData, avatarBackgroundColor: e.target.value })}
                      placeholder="#3b82f6"
                    />
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


