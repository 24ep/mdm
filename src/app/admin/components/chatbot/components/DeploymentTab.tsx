'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy } from 'lucide-react'
import { Chatbot } from '../types'
import toast from 'react-hot-toast'

interface DeploymentTabProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
  selectedChatbot: Chatbot | null
  onGenerateEmbedCode: (chatbot: Chatbot) => string
}

export function DeploymentTab({
  formData,
  setFormData,
  selectedChatbot,
  onGenerateEmbedCode,
}: DeploymentTabProps) {
  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Deployment Type</Label>
        <Select
          value={formData.deploymentType}
          onValueChange={(v: any) => setFormData({ ...formData, deploymentType: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popover">Popover Chat (Facebook Messenger style)</SelectItem>
            <SelectItem value="popup-center">Popup Center Dialog Modal</SelectItem>
            <SelectItem value="fullpage">Full Page (New Link)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Embed Code</Label>
        <div className="flex gap-2">
          <Textarea
            readOnly
            rows={8}
            className="bg-muted border-0 resize-none font-mono text-xs"
            value={(() => {
              const chatbotId = selectedChatbot?.id || 'new-chatbot-id'
              const chatbot = { ...formData, id: chatbotId, deploymentType: formData.deploymentType || 'popover' } as Chatbot
              return onGenerateEmbedCode(chatbot)
            })()}
          />
          <Button
            variant="outline"
            onClick={() => {
              const chatbotId = selectedChatbot?.id || 'new-chatbot-id'
              const chatbot = { ...formData, id: chatbotId, deploymentType: formData.deploymentType || 'popover' } as Chatbot
              const code = onGenerateEmbedCode(chatbot)
              navigator.clipboard.writeText(code)
              toast.success('Embed code copied to clipboard')
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Copy this code and paste it into your website HTML to embed the chatbot.
        </p>
      </div>
    </div>
  )
}

