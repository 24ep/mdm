'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import * as Icons from 'lucide-react'
import type { Chatbot } from '../../types'
import { FormRow, FormSection } from '../components/FormRow'

interface UserAvatarSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function UserAvatarSection({ formData, setFormData }: UserAvatarSectionProps) {
  return (
    <AccordionItem value="user-avatar" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        User Avatar
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <FormSection>
          <FormRow label="Show User Avatar" description="Display avatar for user messages">
            <Switch
              checked={formData.showUserAvatar !== undefined ? formData.showUserAvatar : (formData.showMessageAvatar !== undefined ? formData.showMessageAvatar : true)}
              onCheckedChange={(checked) => setFormData({ ...formData, showUserAvatar: checked })}
            />
          </FormRow>

          {formData.showUserAvatar !== false && (
            <>
              <FormRow label="Avatar Type" description="Icon or custom image">
                <Select
                  value={formData.userAvatarType || 'icon'}
                  onValueChange={(v: any) => setFormData({ ...formData, userAvatarType: v })}
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

              {formData.userAvatarType === 'icon' ? (
                <>
                  <FormRow label="User Icon" description="Select icon for user avatar">
                    <Select
                      value={formData.userAvatarIcon || 'User'}
                      onValueChange={(v) => setFormData({ ...formData, userAvatarIcon: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {['User', 'Users', 'UserCircle', 'UserCheck', 'UserPlus', 'Smile', 'Heart', 'Star', 'Zap', 'MessageSquare', 'Bot', 'HelpCircle', 'Lightbulb', 'Rocket', 'Target'].map((iconName) => {
                          const IconComponent = (Icons as any)[iconName] || Icons.User
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
                  <FormRow label="Icon Color" description="User avatar icon color">
                    <ColorInput
                      value={formData.userAvatarIconColor || '#6b7280'}
                      onChange={(color) => setFormData({ ...formData, userAvatarIconColor: color })}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#6b7280"
                      inputClassName="h-8 text-xs pl-7"
                    />
                  </FormRow>
                  <FormRow label="Background Color" description="Avatar background color">
                    <ColorInput
                      value={formData.userAvatarBackgroundColor || '#e5e7eb'}
                      onChange={(color) => setFormData({ ...formData, userAvatarBackgroundColor: color })}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#e5e7eb"
                      inputClassName="h-8 text-xs pl-7"
                    />
                  </FormRow>
                </>
              ) : (
                <FormRow label="Image URL" description="Custom avatar image URL">
                  <Input
                    value={formData.userAvatarImageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, userAvatarImageUrl: e.target.value })}
                    placeholder="https://example.com/user-avatar.png"
                  />
                </FormRow>
              )}
            </>
          )}
        </FormSection>
      </AccordionContent>
    </AccordionItem>
  )
}

