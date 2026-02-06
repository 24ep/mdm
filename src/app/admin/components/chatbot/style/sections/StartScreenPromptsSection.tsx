'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import type { Chatbot } from '../../types'
import { SectionGroup } from '../components/SectionGroup'
import { FormRow, FormSection } from '../components/FormRow'

interface StartScreenPromptsSectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function StartScreenPromptsSection({ formData, setFormData }: StartScreenPromptsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Start Screen Prompts</h3>
      </div>
      <div className="pt-2">
        <SectionGroup title="Layout" isFirst>
          <FormSection>
            <FormRow label="Style Type" description="Display style for prompts">
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
            </FormRow>
            <FormRow label="Position" description="Position of prompts">
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
            </FormRow>
            <FormRow label="Icon Display" description="How icons are shown">
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
            </FormRow>
          </FormSection>
        </SectionGroup>

        <SectionGroup title="Colors">
          <FormSection>
            <FormRow label="Background Color" description="Background of prompt buttons">
              <ColorInput
                value={(formData as any).startScreenPromptsBackgroundColor || '#f3f4f6'}
                onChange={(color) => setFormData({ ...formData, startScreenPromptsBackgroundColor: color } as any)}
                allowImageVideo={false}
                className="relative"
                placeholder="#f3f4f6"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Font Color" description="Text color of prompts">
              <ColorInput
                value={(formData as any).startScreenPromptsFontColor || '#000000'}
                onChange={(color) => setFormData({ ...formData, startScreenPromptsFontColor: color } as any)}
                allowImageVideo={false}
                className="relative"
                placeholder="#000000"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
          </FormSection>
        </SectionGroup>

        <SectionGroup title="Typography">
          <FormSection>
            <FormRow label="Font Family" description="Font for prompt text">
              <Input
                type="text"
                value={(formData as any).startScreenPromptsFontFamily || 'Inter'}
                onChange={(e) => setFormData({ ...formData, startScreenPromptsFontFamily: e.target.value } as any)}
                placeholder="Inter"
              />
            </FormRow>
            <FormRow label="Font Size" description="Size of prompt text">
              <Input
                type="text"
                value={(formData as any).startScreenPromptsFontSize || '14px'}
                onChange={(e) => setFormData({ ...formData, startScreenPromptsFontSize: e.target.value } as any)}
                placeholder="14px"
              />
            </FormRow>
          </FormSection>
        </SectionGroup>

        <SectionGroup title="Spacing">
          <FormSection>
            <FormRow label="Padding" description="Padding for prompt buttons (e.g., 12px or 8px 16px)">
              <Input
                type="text"
                value={(formData as any).startScreenPromptsPadding || '12px'}
                onChange={(e) => setFormData({ ...formData, startScreenPromptsPadding: e.target.value } as any)}
                placeholder="12px"
              />
            </FormRow>
          </FormSection>
        </SectionGroup>

        <SectionGroup title="Borders">
          <FormSection>
            <FormRow label="Border Color" description="Color of prompt borders">
              <ColorInput
                value={(formData as any).startScreenPromptsBorderColor || '#e5e7eb'}
                onChange={(color) => setFormData({ ...formData, startScreenPromptsBorderColor: color } as any)}
                allowImageVideo={false}
                className="relative"
                placeholder="#e5e7eb"
                inputClassName="h-7 text-xs pl-7 w-full"
              />
            </FormRow>
            <FormRow label="Border Width" description="Width of prompt borders">
              <Input
                type="text"
                value={(formData as any).startScreenPromptsBorderWidth || '1px'}
                onChange={(e) => setFormData({ ...formData, startScreenPromptsBorderWidth: e.target.value } as any)}
                placeholder="1px"
              />
            </FormRow>
            <FormRow label="Border Radius" description="Roundness of prompt corners">
              <Input
                type="text"
                value={(formData as any).startScreenPromptsBorderRadius || '8px'}
                onChange={(e) => setFormData({ ...formData, startScreenPromptsBorderRadius: e.target.value } as any)}
                placeholder="8px"
              />
            </FormRow>
          </FormSection>
        </SectionGroup>
      </div>
    </div>
  )
}

