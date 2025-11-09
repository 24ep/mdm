'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import * as Icons from 'lucide-react'
import type { Chatbot } from '../../types'
import { SectionGroup } from '../components/SectionGroup'

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
        <SectionGroup title="User Avatar Configuration" isFirst>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show User Avatar</Label>
                <p className="text-xs text-muted-foreground">Display avatar for user messages</p>
              </div>
              <Switch
                checked={formData.showUserAvatar !== undefined ? formData.showUserAvatar : (formData.showMessageAvatar !== undefined ? formData.showMessageAvatar : true)}
                onCheckedChange={(checked) => setFormData({ ...formData, showUserAvatar: checked })}
              />
            </div>

            {formData.showUserAvatar !== false && (
              <>
                <div className="space-y-2">
                  <Label>User Avatar Type</Label>
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
                </div>

                {formData.userAvatarType === 'icon' ? (
                  <>
                    <div className="space-y-2">
                      <Label>User Icon</Label>
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>User Icon Color</Label>
                        <ColorInput
                          value={formData.userAvatarIconColor || '#6b7280'}
                          onChange={(color) => setFormData({ ...formData, userAvatarIconColor: color })}
                          allowImageVideo={false}
                          className="relative"
                          placeholder="#6b7280"
                          inputClassName="h-8 text-xs pl-7"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>User Background Color</Label>
                        <ColorInput
                          value={formData.userAvatarBackgroundColor || '#e5e7eb'}
                          onChange={(color) => setFormData({ ...formData, userAvatarBackgroundColor: color })}
                          allowImageVideo={false}
                          className="relative"
                          placeholder="#e5e7eb"
                          inputClassName="h-8 text-xs pl-7"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label>User Avatar Image URL</Label>
                    <Input
                      value={formData.userAvatarImageUrl || ''}
                      onChange={(e) => setFormData({ ...formData, userAvatarImageUrl: e.target.value })}
                      placeholder="https://example.com/user-avatar.png"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </SectionGroup>
      </AccordionContent>
    </AccordionItem>
  )
}

