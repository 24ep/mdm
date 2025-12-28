'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Palette, Bot, Maximize, Square, Sun, Tag, Move, Settings, Bell } from 'lucide-react'
import * as Icons from 'lucide-react'
import type { SectionProps } from './types'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { MultiSideInput } from '../components/MultiSideInput'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { IconPicker } from '@/components/ui/icon-picker'
import { ChevronsUpDown } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

export function WidgetSection({ formData, setFormData, chatkitOptions }: SectionProps) {
  const [openItems, setOpenItems] = useState(['appearance', 'avatar-icon', 'size-colors', 'borders', 'shadow', 'label', 'position'])

  return (
    <div className="py-2 w-full">
      <div className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Configure the widget button that appears when using popover or popup-center deployment types.
        </p>
      </div>

      <Accordion
        type="multiple"
        value={openItems}
        onValueChange={(val) => setOpenItems(val as string[])}
      >
        <AccordionItem value="appearance" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2 pb-4">
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
                    value={(formData as any).popoverPosition || 'left'}
                    onValueChange={(v: any) => setFormData({ ...formData, popoverPosition: v } as any)}
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
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="behavior" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Behavior
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2 pb-4">
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
                  <Label>Auto Open on Desktop</Label>
                  <p className="text-xs text-muted-foreground">Automatically open chat on desktop devices</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.widgetAutoShowDesktop !== undefined ? formData.widgetAutoShowDesktop : (formData.widgetAutoShow !== undefined ? formData.widgetAutoShow : true)}
                    onCheckedChange={(checked) => setFormData({ ...formData, widgetAutoShowDesktop: checked, widgetAutoShow: checked /* Update legacy prop too for now */ })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <Label>Auto Open on Mobile</Label>
                  <p className="text-xs text-muted-foreground">Automatically open chat on mobile devices</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.widgetAutoShowMobile || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, widgetAutoShowMobile: checked })}
                  />
                </div>
              </div>

              {formData.widgetAutoShow && (
                <div className="space-y-2 mb-4">
                  <Label>Auto Open Delay (seconds)</Label>
                  <Input
                    type="number"
                    value={formData.widgetAutoShowDelay || 0}
                    onChange={(e) => setFormData({ ...formData, widgetAutoShowDelay: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min={0}
                  />
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <Label>Show Notification Badge</Label>
                  <p className="text-xs text-muted-foreground">Display unread message count badge</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.showNotificationBadge || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, showNotificationBadge: checked })}
                  />
                </div>
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
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="avatar-icon" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Avatar/Icon
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4 pt-2 pb-4">
              <div className="space-y-2">
                <Label>Avatar Type</Label>
                <Select
                  value={(formData as any).widgetAvatarType || formData.avatarType || 'icon'}
                  onValueChange={(v: any) => setFormData({ ...formData, widgetAvatarType: v } as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="icon">Icon</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(formData as any).widgetAvatarType === 'icon' || (!(formData as any).widgetAvatarType && formData.avatarType !== 'image') ? (
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {(() => {
                          const iconName = (formData as any).widgetAvatarIcon || formData.avatarIcon || 'Bot';
                          const IconComp = (Icons as any)[iconName] || Icons.Bot;
                          return (
                            <div className="flex items-center gap-2">
                              <IconComp className="h-4 w-4" />
                              <span>{iconName}</span>
                            </div>
                          );
                        })()}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-4" align="start">
                      <IconPicker
                        value={(formData as any).widgetAvatarIcon || formData.avatarIcon || 'Bot'}
                        onChange={(v) => setFormData({ ...formData, widgetAvatarIcon: v } as any)}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground mt-2">
                    Click to browse and search available icons
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={(formData as any).widgetAvatarImageUrl || formData.avatarImageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, widgetAvatarImageUrl: e.target.value } as any)}
                    placeholder="https://example.com/avatar.png"
                  />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="size-colors" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Maximize className="h-4 w-4" />
              Size & Colors
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2 pb-4">
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
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="borders" className="border-b px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              Borders
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-3 gap-4 pt-2 pb-4">
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
            <div className="pt-2 pb-4">
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {formData.widgetAvatarStyle === 'circle-with-label' && (
          <AccordionItem value="label" className="border-b px-4">
            <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Label
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-4 pt-2 pb-4">
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
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="position" className="border-b-0 px-4">
          <AccordionTrigger className="hover:no-underline py-4 text-md font-semibold">
            <div className="flex items-center gap-2">
              <Move className="h-4 w-4" />
              Position
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4 pt-2 pb-4">
              <div className="space-y-2">
                <Label>Widget Offset X</Label>
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
                <Label>Widget Offset Y</Label>
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
