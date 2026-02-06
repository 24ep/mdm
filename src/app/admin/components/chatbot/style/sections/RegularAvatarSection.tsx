'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import * as Icons from 'lucide-react'
import type { Chatbot } from '../../types'
import { FormRow, FormSection } from '../components/FormRow'

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
        <FormSection>
          <FormRow label="Avatar Type" description="Icon or custom image">
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
          </FormRow>

          {formData.avatarType === 'icon' ? (
            <>
              <FormRow label="Icon" description="Select bot avatar icon">
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
              </FormRow>
              <FormRow label="Icon Color" description="Avatar icon color">
                <ColorInput
                  value={formData.avatarIconColor || '#ffffff'}
                  onChange={(color) => setFormData({ ...formData, avatarIconColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#ffffff"
                  inputClassName="h-8 text-xs pl-7"
                />
              </FormRow>
              <FormRow label="Background Color" description="Avatar background color">
                <ColorInput
                  value={formData.avatarBackgroundColor || '#3b82f6'}
                  onChange={(color) => setFormData({ ...formData, avatarBackgroundColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#3b82f6"
                  inputClassName="h-8 text-xs pl-7"
                />
              </FormRow>
            </>
          ) : (
            <FormRow label="Image URL" description="Custom avatar image URL">
              <Input
                value={formData.avatarImageUrl || ''}
                onChange={(e) => setFormData({ ...formData, avatarImageUrl: e.target.value })}
                placeholder="https://example.com/avatar.png"
              />
            </FormRow>
          )}
        </FormSection>
      </AccordionContent>
    </AccordionItem>
  )
}

