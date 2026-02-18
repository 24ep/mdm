'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { IconPicker } from '@/components/ui/icon-picker'
import { ChevronsUpDown } from 'lucide-react'
import * as Icons from 'lucide-react'
import { FormRow, FormSection } from '../components/FormRow'
import { SectionGroup } from '../components/SectionGroup'
import type { SectionProps } from './types'

export function GetStartedSection({ formData, setFormData }: SectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Get Started Screen</h3>
      </div>
      
      <div className="pt-2">
        <SectionGroup title="Configuration" isFirst>
          <FormSection>
            <FormRow label="Enable Screen" description="Show an introductory screen before the chat starts">
              <Switch
                checked={formData.getStartedEnabled || false}
                onCheckedChange={(checked) => setFormData({ ...formData, getStartedEnabled: checked })}
              />
            </FormRow>
          </FormSection>
        </SectionGroup>

        {formData.getStartedEnabled && (
          <>
            <SectionGroup title="Appearance">
              <FormSection>
                <FormRow 
                  label="Icon" 
                  description="Main icon shown on the start screen"
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {(() => {
                          const iconName = formData.getStartedIcon || 'Bot';
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
                        value={formData.getStartedIcon || 'Bot'}
                        onChange={(v) => setFormData({ ...formData, getStartedIcon: v })}
                      />
                    </PopoverContent>
                  </Popover>
                </FormRow>
              </FormSection>
            </SectionGroup>

            <SectionGroup title="Content">
              <FormSection>
                <FormRow 
                  label="Title" 
                  description="Large heading text"
                >
                  <Input
                    value={formData.getStartedTitle || ''}
                    onChange={(e) => setFormData({ ...formData, getStartedTitle: e.target.value })}
                    placeholder="Welcome to Chat"
                  />
                </FormRow>

                <FormRow 
                  label="Subtitle" 
                  description="Smaller text below the title"
                >
                  <Input
                    value={formData.getStartedSubtitle || ''}
                    onChange={(e) => setFormData({ ...formData, getStartedSubtitle: e.target.value })}
                    placeholder="How can we help you?"
                  />
                </FormRow>

                <FormRow 
                  label="Description" 
                  description="Detailed information about the chatbot"
                >
                  <Textarea
                    value={formData.getStartedDescription || ''}
                    onChange={(e) => setFormData({ ...formData, getStartedDescription: e.target.value })}
                    placeholder="Start a conversation with our AI assistant to get instant answers."
                    rows={4}
                  />
                </FormRow>

                <FormRow 
                  label="Button Text" 
                  description="Text for the start conversation button"
                >
                  <Input
                    value={formData.getStartedButtonText || ''}
                    onChange={(e) => setFormData({ ...formData, getStartedButtonText: e.target.value })}
                    placeholder="Get Started"
                  />
                </FormRow>
              </FormSection>
            </SectionGroup>
          </>
        )}
      </div>
    </div>
  )
}
