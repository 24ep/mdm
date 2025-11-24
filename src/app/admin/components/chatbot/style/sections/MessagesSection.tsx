'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import type { Chatbot } from '../../types'
import { extractNumericValue, ensurePx } from '../styleUtils'
import { MultiSideInput } from '../components/MultiSideInput'
import { PaddingInput } from '../components/PaddingInput'
import { SectionGroup } from '../components/SectionGroup'
import * as Icons from 'lucide-react'

interface MessagesSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function MessagesSection({ formData, setFormData }: MessagesSectionProps) {
  return (
    <>
      {/* Bot Messages Accordion */}
      <AccordionItem value="bot-messages" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
          Bot Messages
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
          <SectionGroup title="Bot Message Styling" isFirst>
          <div className="space-y-4">
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Bot Message Font Color</Label>
                <ColorInput
                  value={formData.botMessageFontColor || formData.fontColor || '#000000'}
                  onChange={(color) => setFormData({ ...formData, botMessageFontColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#000000"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>Bot Message Font Family</Label>
                <Input
                  value={formData.botMessageFontFamily || formData.fontFamily || 'Inter'}
                  onChange={(e) => setFormData({ ...formData, botMessageFontFamily: e.target.value })}
                  placeholder="Inter"
                />
              </div>
              <div className="space-y-2">
                <Label>Bot Message Font Size</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue(formData.botMessageFontSize || formData.fontSize || '14px')}
                    onChange={(e) => setFormData({ ...formData, botMessageFontSize: ensurePx(e.target.value) })}
                    placeholder="14"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <PaddingInput
                formData={formData}
                setFormData={setFormData}
                label="Bot Message Padding"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Bot Bubble Border Color</Label>
                <ColorInput
                  value={formData.botBubbleBorderColor || formData.bubbleBorderColor || formData.borderColor || '#e5e7eb'}
                  onChange={(color) => setFormData({ ...formData, botBubbleBorderColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#e5e7eb"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label="Bot Bubble Border Width"
                baseKey="botBubbleBorderWidth"
                defaultValue={formData.bubbleBorderWidth || formData.borderWidth || '1px'}
                type="sides"
              />
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label="Bot Bubble Border Radius"
                baseKey="botBubbleBorderRadius"
                defaultValue={formData.bubbleBorderRadius || formData.borderRadius || '8px'}
                type="corners"
              />
            </div>

            <div className="space-y-2">
              <Label>Bot Avatar Type</Label>
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
                  <Label>Bot Avatar Icon</Label>
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
                    <Label>Bot Icon Color</Label>
                    <ColorInput
                      value={formData.avatarIconColor || '#ffffff'}
                      onChange={(color) => setFormData({ ...formData, avatarIconColor: color })}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#ffffff"
                      inputClassName="h-8 text-xs pl-7"
                    />
                    <p className="text-xs text-muted-foreground">Color of the icon inside the avatar</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Bot Avatar Background Color</Label>
                    <ColorInput
                      value={formData.avatarBackgroundColor || '#3b82f6'}
                      onChange={(color) => setFormData({ ...formData, avatarBackgroundColor: color })}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#3b82f6"
                      inputClassName="h-8 text-xs pl-7"
                    />
                    <p className="text-xs text-muted-foreground">Background color of the avatar circle (when icon type is selected)</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>Upload Bot Avatar Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = (ev) => {
                      const url = ev.target?.result as string
                      setFormData({ ...formData, avatarImageUrl: url })
                    }
                    reader.readAsDataURL(file)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Upload an image file for the bot avatar
                </p>
              </div>
            )}
          </div>
        </SectionGroup>

        {/* Typing Indicator & Thinking Message */}
        <SectionGroup title="Typing Indicator & Thinking">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Typing Indicator Style</Label>
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

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Thinking Message</Label>
                <p className="text-xs text-muted-foreground">
                  Display "Thinking..." text like OpenAI (shown next to typing indicator)
                </p>
              </div>
              <Switch
                checked={(formData as any).showThinkingMessage ?? false}
                onCheckedChange={(checked) => setFormData({ ...formData, showThinkingMessage: checked } as any)}
              />
            </div>
            
            {(formData as any).showThinkingMessage && (
              <div className="space-y-2">
                <Label>Thinking Message Text</Label>
                <Input
                  value={(formData as any).thinkingMessageText || 'Thinking...'}
                  onChange={(e) => setFormData({ ...formData, thinkingMessageText: e.target.value } as any)}
                  placeholder="Thinking..."
                />
                <p className="text-xs text-muted-foreground">
                  Custom text to display while the assistant is thinking
                </p>
              </div>
            )}
          </div>
        </SectionGroup>

        {/* Shared Settings */}
        <SectionGroup title="Display Options">
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
                    onValueChange={(v: string) => setFormData({ ...formData, messageNamePosition: v as 'top-of-message' | 'top-of-avatar' | 'right-of-avatar' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-of-message">Top of Message</SelectItem>
                      <SelectItem value="top-of-avatar">Top of Avatar</SelectItem>
                      <SelectItem value="right-of-avatar">Right of Avatar</SelectItem>
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

            {formData.showMessageAvatar !== false && (
              <div className="space-y-2">
                <Label>Message Avatar Position</Label>
                <Select
                  value={formData.messageAvatarPosition || 'top-of-message'}
                  onValueChange={(v: string) => setFormData({ ...formData, messageAvatarPosition: v as 'top-of-message' | 'left-of-message' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-of-message">Top of Message</SelectItem>
                    <SelectItem value="left-of-message">Left of Message</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose where to display the bot message avatar
                </p>
              </div>
            )}
          </div>
        </SectionGroup>
        </AccordionContent>
      </AccordionItem>

      {/* User Messages Accordion */}
      <AccordionItem value="user-messages" className="border-b px-4">
        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
          User Messages
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-6">
          <SectionGroup title="User Message Styling" isFirst>
          <div className="space-y-4">
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>User Message Font Color</Label>
                <ColorInput
                  value={formData.userMessageFontColor || '#ffffff'}
                  onChange={(color) => setFormData({ ...formData, userMessageFontColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#ffffff"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>User Message Font Family</Label>
                <Input
                  value={formData.userMessageFontFamily || formData.fontFamily || 'Inter'}
                  onChange={(e) => setFormData({ ...formData, userMessageFontFamily: e.target.value })}
                  placeholder="Inter"
                />
              </div>
              <div className="space-y-2">
                <Label>User Message Font Size</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={extractNumericValue(formData.userMessageFontSize || formData.fontSize || '14px')}
                    onChange={(e) => setFormData({ ...formData, userMessageFontSize: ensurePx(e.target.value) })}
                    placeholder="14"
                    className="pr-8"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'hsl(var(--secondary))' }}>px</span>
                </div>
              </div>
            </div>

            <MultiSideInput
              formData={formData}
              setFormData={setFormData}
              label="User Message Padding"
              baseKey="userBubblePadding"
              defaultValue={formData.bubblePadding || '12px'}
              type="sides"
            />

            <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>User Bubble Border Color</Label>
                <ColorInput
                  value={formData.userBubbleBorderColor || formData.bubbleBorderColor || formData.borderColor || '#e5e7eb'}
                  onChange={(color) => setFormData({ ...formData, userBubbleBorderColor: color })}
                  allowImageVideo={false}
                  className="relative"
                  placeholder="#e5e7eb"
                  inputClassName="h-7 text-xs pl-7 w-full"
                />
              </div>
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label="User Bubble Border Width"
                baseKey="userBubbleBorderWidth"
                defaultValue={formData.bubbleBorderWidth || formData.borderWidth || '1px'}
                type="sides"
              />
              <MultiSideInput
                formData={formData}
                setFormData={setFormData}
                label="User Bubble Border Radius"
                baseKey="userBubbleBorderRadius"
                defaultValue={formData.bubbleBorderRadius || formData.borderRadius || '8px'}
                type="corners"
              />
            </div>

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
                        <Label>User Avatar Background Color</Label>
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
                    <Label>Upload User Avatar Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          const url = ev.target?.result as string
                          setFormData({ ...formData, userAvatarImageUrl: url })
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload an image file for the user avatar
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </SectionGroup>
      </AccordionContent>
    </AccordionItem>
    </>
  )
}
