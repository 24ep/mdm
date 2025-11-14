'use client'

import { useState } from 'react'
import { Accordion } from '@/components/ui/accordion'
import type { Chatbot } from '../types'
import { ChatWindowSection } from './sections/ChatWindowSection'
import { WidgetButtonSection } from './sections/WidgetButtonSection'
import { MessagesSection } from './sections/MessagesSection'
import { RegularHeaderSection } from './sections/RegularHeaderSection'
import { RegularFooterSection } from './sections/RegularFooterSection'
import { StartScreenPromptsSection } from './sections/StartScreenPromptsSection'
import { ChatKitIntegrationSection } from './sections/ChatKitIntegrationSection'

interface RegularStyleConfigProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function RegularStyleConfig({ formData, setFormData }: RegularStyleConfigProps) {
  const [accordionValue, setAccordionValue] = useState<string>('chat-window')
  const engineType = (formData as any).engineType || 'custom'
  const isOpenAIAgentSDK = engineType === 'openai-agent-sdk'
  const chatkitOptions = (formData as any).chatkitOptions || {}

  return (
    <div className="space-y-0">
    <Accordion type="single" collapsible value={accordionValue} onValueChange={(value) => setAccordionValue(typeof value === 'string' ? value : value[0] || '')}>
      <ChatWindowSection formData={formData} setFormData={setFormData} />
      <WidgetButtonSection formData={formData} setFormData={setFormData} />
      {!isOpenAIAgentSDK && (
        <ChatKitIntegrationSection formData={formData} setFormData={setFormData} />
      )}
      <RegularHeaderSection formData={formData} setFormData={setFormData} chatkitOptions={chatkitOptions} />
      <MessagesSection formData={formData} setFormData={setFormData} />
      <RegularFooterSection formData={formData} setFormData={setFormData} />
      <StartScreenPromptsSection formData={formData} setFormData={setFormData} />
    </Accordion>
    </div>
  )
}
