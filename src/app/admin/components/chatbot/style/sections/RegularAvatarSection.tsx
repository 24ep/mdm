'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import * as Icons from 'lucide-react'
import { ChevronsUpDown } from 'lucide-react'
import type { Chatbot } from '../../types'
import { FormRow, FormSection } from '../components/FormRow'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { IconPicker } from '@/components/ui/icon-picker'


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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-8 text-xs">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const iconName = formData.avatarIcon || 'Bot'
                          const Icon = (Icons as any)[iconName] || Icons.Bot
                          return <Icon className="h-4 w-4" />
                        })()}
                        <span>{formData.avatarIcon || 'Bot'}</span>
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-4" align="start">
                    <IconPicker
                      value={formData.avatarIcon || 'Bot'}
                      onChange={(v) => setFormData({ ...formData, avatarIcon: v })}
                    />
                  </PopoverContent>
                </Popover>
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
            <FormRow label="Avatar Image" description="Custom avatar image shadow">
              <div className="space-y-2">
                <Input
                  value={formData.avatarImageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, avatarImageUrl: e.target.value })}
                  placeholder="https://example.com/avatar.png"
                />
                <div className="grid gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    className="h-9 py-1.5"
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
                </div>
                {formData.avatarImageUrl && (
                  <div className="mt-2 flex justify-center">
                    <img
                      src={formData.avatarImageUrl}
                      alt="Avatar preview"
                      className="h-16 w-16 object-cover border rounded-full bg-white shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </FormRow>


          )}
        </FormSection>
      </AccordionContent>
    </AccordionItem>
  )
}

