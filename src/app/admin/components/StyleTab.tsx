'use client'

import type { Chatbot } from './chatbot/types'
import { ChatKitStyleConfig } from './chatbot/style/ChatKitStyleConfig'
import { RegularStyleConfig } from './chatbot/style/RegularStyleConfig'

export function StyleTab({
  formData,
  setFormData,
}: {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}) {
  const engineType = (formData as any).engineType || 'custom'

  // If ChatKit engine, show ChatKit theme/style config
  if (engineType === 'chatkit') {
    return <ChatKitStyleConfig formData={formData} setFormData={setFormData} />
  }

  // Otherwise (including openai-agent-sdk), show regular style config
  return <RegularStyleConfig formData={formData} setFormData={setFormData} />
}

export default StyleTab
