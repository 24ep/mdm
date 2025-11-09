'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import * as Icons from 'lucide-react'
import type { Chatbot } from '../../types'
import { SectionGroup } from '../components/SectionGroup'

interface RegularAvatarSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function RegularAvatarSection({ formData, setFormData }: RegularAvatarSectionProps) {
  return (
    <AccordionItem value="avatar" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Avatar
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <SectionGroup title="Avatar Configuration" isFirst>
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
                    <ColorInput
                      value={formData.avatarIconColor || '#ffffff'}
                      onChange={(color) => setFormData({ ...formData, avatarIconColor: color })}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#ffffff"
                      inputClassName="h-8 text-xs pl-7"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <ColorInput
                      value={formData.avatarBackgroundColor || '#3b82f6'}
                      onChange={(color) => setFormData({ ...formData, avatarBackgroundColor: color })}
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
                <Label>Image URL</Label>
                <Input
                  value={formData.avatarImageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, avatarImageUrl: e.target.value })}
                  placeholder="https://example.com/avatar.png"
                />
              </div>
            )}
          </div>
        </SectionGroup>
      </AccordionContent>
    </AccordionItem>
  )
}

