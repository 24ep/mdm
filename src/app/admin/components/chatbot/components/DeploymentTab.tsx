'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

import { Switch } from '@/components/ui/switch'
import { Copy, Globe, Info, Smartphone, Check } from 'lucide-react'
import * as Icons from 'lucide-react'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { Chatbot, ChatbotVersion } from '../types'
import { VersionDrawer } from './VersionDrawer'
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
  
  // Handle restoring a version
  const handleRestoreVersion = (version: ChatbotVersion) => {
    // The version's config should be merged back into formData
    // For now, we restore the version string - the actual config restoration
    // would need the full version config from the API
    setFormData(prev => ({
      ...prev,
      currentVersion: version.version,
      isPublished: version.isPublished
    }))
  }

  const versions = selectedChatbot?.versions || formData.versions || []
  const currentVersion = formData.currentVersion || selectedChatbot?.currentVersion

  return (
    <div className="space-y-4 pt-4">
      {/* Version Status Bar */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Current Version:</span>
          <Badge variant="outline" className="font-mono">
            v{currentVersion || '1.0.0'}
          </Badge>
          {formData.isPublished ? (
            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
              <Check className="h-3 w-3 mr-1" />
              Published
            </Badge>
          ) : (
            <Badge variant="secondary">Draft</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Publish/Unpublish Button */}
          <Button
            variant={formData.isPublished ? "outline" : "default"}
            size="sm"
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                isPublished: !prev.isPublished
              }))
              toast.success(formData.isPublished ? 'Chatbot unpublished' : 'Chatbot published')
            }}
            className={formData.isPublished ? "" : "bg-green-600 hover:bg-green-700"}
          >
            {formData.isPublished ? (
              <>
                <Icons.EyeOff className="h-4 w-4 mr-1.5" />
                Unpublish
              </>
            ) : (
              <>
                <Icons.Send className="h-4 w-4 mr-1.5" />
                Publish
              </>
            )}
          </Button>
          <VersionDrawer
            versions={versions}
            currentVersion={currentVersion}
            onRestore={handleRestoreVersion}
            chatbot={formData}
          />
        </div>
      </div>

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
            onClick={async () => {
              const chatbotId = selectedChatbot?.id || 'new-chatbot-id'
              const chatbot = {
                ...formData,
                id: chatbotId,
                deploymentType: formData.deploymentType || 'popover',
                customEmbedDomain: formData.customEmbedDomain
              } as Chatbot
              const code = onGenerateEmbedCode(chatbot)
              const { copyToClipboard } = await import('@/lib/clipboard')
              const success = await copyToClipboard(code)
              if (success) {
                toast.success('Embed code copied to clipboard')
              } else {
                toast.error('Failed to copy to clipboard')
              }
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

