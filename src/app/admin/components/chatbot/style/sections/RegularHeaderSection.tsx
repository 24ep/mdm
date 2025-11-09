'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import * as Icons from 'lucide-react'
import type { Chatbot } from '../../types'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { MultiSideInput } from '../components/MultiSideInput'
import { SectionGroup } from '../components/SectionGroup'

interface RegularHeaderSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function RegularHeaderSection({ formData, setFormData }: RegularHeaderSectionProps) {
  return (
    <AccordionItem value="header" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Header
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <SectionGroup title="Content" isFirst>
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
        </SectionGroup>

        <SectionGroup title="Logo & Font">
          <div className="grid grid-cols-2 gap-4">
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
              <p className="text-xs text-muted-foreground">
                Logo shown in the chat page header (not embed)
              </p>
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
        </SectionGroup>

        <SectionGroup title="Colors">
          <div className="grid grid-cols-2 gap-4">
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
        </SectionGroup>

        <SectionGroup title="Options">
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label>Show Clear Session Button</Label>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Show clear conversation button in header</span>
                <Switch checked={(formData as any).headerShowClearSession !== false} onCheckedChange={(checked) => setFormData({ ...formData, headerShowClearSession: checked } as any)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Show Close Button</Label>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Show close button in header</span>
                <Switch checked={(formData as any).headerShowCloseButton !== false} onCheckedChange={(checked) => setFormData({ ...formData, headerShowCloseButton: checked } as any)} />
              </div>
            </div>
          </div>
        </SectionGroup>

        {formData.headerShowAvatar !== false && (
          <SectionGroup title="Header Avatar">
            <p className="text-xs text-muted-foreground mb-4">
              Configure the avatar shown in the header (separate from message avatars)
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Header Avatar Type</Label>
                <Select
                  value={formData.headerAvatarType || formData.avatarType || 'icon'}
                  onValueChange={(v: any) => setFormData({ ...formData, headerAvatarType: v })}
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

              {formData.headerAvatarType === 'icon' || (!formData.headerAvatarType && (formData.avatarType || 'icon') === 'icon') ? (
                <>
                  <div className="space-y-2">
                    <Label>Header Avatar Icon</Label>
                    <Select
                      value={formData.headerAvatarIcon || formData.avatarIcon || 'Bot'}
                      onValueChange={(v) => setFormData({ ...formData, headerAvatarIcon: v })}
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
                      <Label>Header Icon Color</Label>
                      <ColorInput
                        value={formData.headerAvatarIconColor || formData.avatarIconColor || '#ffffff'}
                        onChange={(color) => setFormData({ ...formData, headerAvatarIconColor: color })}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#ffffff"
                        inputClassName="h-8 text-xs pl-7"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Header Background Color</Label>
                      <ColorInput
                        value={formData.headerAvatarBackgroundColor || formData.avatarBackgroundColor || '#3b82f6'}
                        onChange={(color) => setFormData({ ...formData, headerAvatarBackgroundColor: color })}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#3b82f6"
                        inputClassName="h-8 text-xs pl-7"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label>Upload Header Avatar Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        const url = ev.target?.result as string
                        setFormData({ ...formData, headerAvatarImageUrl: url })
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload an image file for the header avatar
                  </p>
                </div>
              )}
            </div>
          </SectionGroup>
        )}

        <SectionGroup title="Borders & Padding">
          <div className="grid grid-cols-3 gap-4">
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
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label="Header Padding"
                baseKey="headerPadding"
                defaultValue="16px"
                type="sides"
              />
            </div>
          </div>
        </SectionGroup>
      </AccordionContent>
    </AccordionItem>
  )
}

