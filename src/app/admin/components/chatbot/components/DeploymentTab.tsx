'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { Switch } from '@/components/ui/switch'
import { Copy, Globe, Info, Smartphone } from 'lucide-react'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              value: 'popover',
              label: 'Popover Chat',
              description: 'Facebook Messenger style widget',
              icon: Smartphone
            },
            {
              value: 'popup-center',
              label: 'Popup Center',
              description: 'Centered dialog modal',
              icon: Copy
            },
            {
              value: 'fullpage',
              label: 'Full Page',
              description: 'Standalone page link',
              icon: Globe
            }
          ].map((option) => (
            <div
              key={option.value}
              className={`
                relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-muted/50
                ${formData.deploymentType === option.value
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-muted bg-card'}
              `}
              onClick={() => setFormData({ ...formData, deploymentType: option.value as any })}
            >
              <div className="flex flex-col gap-2">
                <option.icon className={`h-6 w-6 ${formData.deploymentType === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="space-y-1">
                  <p className="font-medium leading-none">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Label>Custom Embed Domain (Optional)</Label>
        </div>
        <Input
          type="url"
          placeholder="https://chat.yourdomain.com"
          value={formData.customEmbedDomain || ''}
          onChange={(e) => setFormData({ ...formData, customEmbedDomain: e.target.value })}
        />
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <p>
            Leave empty to use the current domain. Set a custom domain if you want to embed the chat from a different URL
            (e.g., when using a CDN, reverse proxy, or dedicated chat subdomain).
          </p>
        </div>
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
              const chatbot = {
                ...formData,
                id: chatbotId,
                deploymentType: formData.deploymentType || 'popover',
                customEmbedDomain: formData.customEmbedDomain
              } as Chatbot
              return onGenerateEmbedCode(chatbot)
            })()}
          />
          <Button
            variant="outline"
            onClick={() => {
              const chatbotId = selectedChatbot?.id || 'new-chatbot-id'
              const chatbot = {
                ...formData,
                id: chatbotId,
                deploymentType: formData.deploymentType || 'popover',
                customEmbedDomain: formData.customEmbedDomain
              } as Chatbot
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

