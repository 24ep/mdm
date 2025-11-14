'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import type { Chatbot } from '../../types'
import { SectionGroup } from '../components/SectionGroup'

interface StartScreenPromptsSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function StartScreenPromptsSection({ formData, setFormData }: StartScreenPromptsSectionProps) {
  return (
    <AccordionItem value="startScreenPrompts" className="border-b px-4">
      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
        Start Screen Prompts
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-6">
        <SectionGroup title="Layout" isFirst>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Style Type</Label>
              <Select
                value={(formData as any).startScreenPromptsStyle || 'card'}
                onValueChange={(value: string) => setFormData({ ...formData, startScreenPromptsStyle: value as 'list' | 'card' } as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Position</Label>
              <Select
                value={(formData as any).startScreenPromptsPosition || 'center'}
                onValueChange={(value: string) => setFormData({ ...formData, startScreenPromptsPosition: value as 'center' | 'bottom' | 'list' } as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Icon Display</Label>
              <Select
                value={(formData as any).startScreenPromptsIconDisplay || 'suffix'}
                onValueChange={(value: string) => setFormData({ ...formData, startScreenPromptsIconDisplay: value as 'suffix' | 'show-all' | 'none' } as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suffix">Suffix (after text)</SelectItem>
                  <SelectItem value="show-all">Show All Icons</SelectItem>
                  <SelectItem value="none">No Icons</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionGroup>

        <SectionGroup title="Colors">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Background Color</Label>
              <ColorInput
                value={(formData as any).startScreenPromptsBackgroundColor || '#f3f4f6'}
                onChange={(color) => setFormData({ ...formData, startScreenPromptsBackgroundColor: color } as any)}
                allowImageVideo={false}
                className="relative"
                placeholder="#f3f4f6"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Font Color</Label>
              <ColorInput
                value={(formData as any).startScreenPromptsFontColor || '#000000'}
                onChange={(color) => setFormData({ ...formData, startScreenPromptsFontColor: color } as any)}
                allowImageVideo={false}
                className="relative"
                placeholder="#000000"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
          </div>
        </SectionGroup>

        <SectionGroup title="Typography">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Input
                type="text"
                value={(formData as any).startScreenPromptsFontFamily || 'Inter'}
                onChange={(e) => setFormData({ ...formData, startScreenPromptsFontFamily: e.target.value } as any)}
                placeholder="Inter"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Font Size</Label>
              <Input
                type="text"
                value={(formData as any).startScreenPromptsFontSize || '14px'}
                onChange={(e) => setFormData({ ...formData, startScreenPromptsFontSize: e.target.value } as any)}
                placeholder="14px"
              />
            </div>
          </div>
        </SectionGroup>

        <SectionGroup title="Spacing">
          <div className="space-y-2">
            <Label>Padding</Label>
            <Input
              type="text"
              value={(formData as any).startScreenPromptsPadding || '12px'}
              onChange={(e) => setFormData({ ...formData, startScreenPromptsPadding: e.target.value } as any)}
              placeholder="12px"
            />
            <p className="text-xs text-muted-foreground">Padding for prompt buttons (e.g., "12px" or "8px 16px")</p>
          </div>
        </SectionGroup>

        <SectionGroup title="Borders">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Border Color</Label>
              <ColorInput
                value={(formData as any).startScreenPromptsBorderColor || '#e5e7eb'}
                onChange={(color) => setFormData({ ...formData, startScreenPromptsBorderColor: color } as any)}
                allowImageVideo={false}
                className="relative"
                placeholder="#e5e7eb"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Border Width</Label>
              <Input
                type="text"
                value={(formData as any).startScreenPromptsBorderWidth || '1px'}
                onChange={(e) => setFormData({ ...formData, startScreenPromptsBorderWidth: e.target.value } as any)}
                placeholder="1px"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Border Radius</Label>
              <Input
                type="text"
                value={(formData as any).startScreenPromptsBorderRadius || '8px'}
                onChange={(e) => setFormData({ ...formData, startScreenPromptsBorderRadius: e.target.value } as any)}
                placeholder="8px"
              />
            </div>
          </div>
        </SectionGroup>
      </AccordionContent>
    </AccordionItem>
  )
}

