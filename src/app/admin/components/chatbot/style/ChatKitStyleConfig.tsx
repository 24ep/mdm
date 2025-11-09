'use client'

import { useState } from 'react'
import { Accordion } from '@/components/ui/accordion'
import type { Chatbot } from '../types'
import {
  ThemeSection,
  ComposerSection,
  EntitiesSection,
  LocaleSection,
  HeaderSection,
  PopoverSection,
  WidgetSection
} from './sections'
import { ChatKitIntegrationSection } from './sections/ChatKitIntegrationSection'

interface ChatKitStyleConfigProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function ChatKitStyleConfig({ formData, setFormData }: ChatKitStyleConfigProps) {
  const chatkitOptions = (formData as any).chatkitOptions || {}
  const [accordionValue, setAccordionValue] = useState<string>('theme')

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">ChatKit Theme & Style</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Customize the appearance of your ChatKit interface. These settings will override any default ChatKit styling.
          </p>
        </div>

        <Accordion type="single" collapsible value={accordionValue} onValueChange={setAccordionValue} className="space-y-0">
          <ChatKitIntegrationSection formData={formData} setFormData={setFormData} />
          <ThemeSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
          <ComposerSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
          <EntitiesSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
          <LocaleSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
          <HeaderSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
          <PopoverSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
          <WidgetSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
        </Accordion>
      </div>
    </div>
  )
}
