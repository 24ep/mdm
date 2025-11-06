'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Settings, Palette, Layout, Rocket, Copy, X } from 'lucide-react'
import { StyleTab } from '../StyleTab'
import { Chatbot } from './types'
import toast from 'react-hot-toast'

interface ChatbotEditorProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
  selectedChatbot: Chatbot | null
  activeTab: 'engine' | 'style' | 'config' | 'deployment'
  onTabChange: (tab: 'engine' | 'style' | 'config' | 'deployment') => void
  onGenerateEmbedCode: (chatbot: Chatbot) => string
}

export function ChatbotEditor({
  formData,
  setFormData,
  selectedChatbot,
  activeTab,
  onTabChange,
  onGenerateEmbedCode,
}: ChatbotEditorProps) {
  const [newFollowUpQuestion, setNewFollowUpQuestion] = useState('')

  const addFollowUpQuestion = () => {
    if (newFollowUpQuestion.trim()) {
      setFormData({
        ...formData,
        followUpQuestions: [...(formData.followUpQuestions || []), newFollowUpQuestion.trim()]
      })
      setNewFollowUpQuestion('')
    }
  }

  const removeFollowUpQuestion = (index: number) => {
    const updated = [...(formData.followUpQuestions || [])]
    updated.splice(index, 1)
    setFormData({
      ...formData,
      followUpQuestions: updated
    })
  }

  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as any)} className="w-full">
      <TabsList className="w-full flex justify-start gap-2">
        <TabsTrigger value="engine">
          <Settings className="h-4 w-4 mr-2" />
          Engine
        </TabsTrigger>
        <TabsTrigger value="style">
          <Palette className="h-4 w-4 mr-2" />
          Style
        </TabsTrigger>
        <TabsTrigger value="config">
          <Layout className="h-4 w-4 mr-2" />
          Config
        </TabsTrigger>
        <TabsTrigger value="deployment">
          <Rocket className="h-4 w-4 mr-2" />
          Deployment
        </TabsTrigger>
      </TabsList>

      <TabsContent value="engine" className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Chatbot Name"
          />
        </div>

        <div className="space-y-2">
          <Label>Website *</Label>
          <Input
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://example.com"
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description of the chatbot"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>API Endpoint *</Label>
          <Input
            value={formData.apiEndpoint}
            onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
            placeholder="https://api.example.com/chat"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>API Authentication Type</Label>
            <Select
              value={formData.apiAuthType}
              onValueChange={(v: any) => setFormData({ ...formData, apiAuthType: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="custom">Custom Header</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.apiAuthType !== 'none' && (
            <div className="space-y-2">
              <Label>Authentication Value</Label>
              <Input
                type="password"
                value={formData.apiAuthValue}
                onChange={(e) => setFormData({ ...formData, apiAuthValue: e.target.value })}
                placeholder="Enter auth value"
              />
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="style" className="space-y-6 pt-4">
        <StyleTab formData={formData} setFormData={setFormData} />
      </TabsContent>

      <TabsContent value="config" className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Conversation Opener</Label>
          <Textarea
            value={formData.conversationOpener}
            onChange={(e) => setFormData({ ...formData, conversationOpener: e.target.value })}
            placeholder="Hello! How can I help you today?"
            rows={3}
            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
            style={{ borderRadius: '2px' }}
          />
        </div>

        <div className="space-y-2">
          <Label>Follow-up Questions</Label>
          <div className="flex gap-2">
            <Input
              value={newFollowUpQuestion}
              onChange={(e) => setNewFollowUpQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addFollowUpQuestion()}
              placeholder="Enter a follow-up question"
            />
            <Button onClick={addFollowUpQuestion}>Add</Button>
          </div>
          <div className="space-y-2 mt-2">
            {(formData.followUpQuestions || []).map((question, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                <span className="flex-1">{question}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFollowUpQuestion(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable File Upload</Label>
            <Switch
              checked={formData.enableFileUpload}
              onCheckedChange={(checked) => setFormData({ ...formData, enableFileUpload: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Show Citations and Attributions</Label>
            <Switch
              checked={formData.showCitations}
              onCheckedChange={(checked) => setFormData({ ...formData, showCitations: checked })}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="deployment" className="space-y-4 pt-4">
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
      </TabsContent>
    </Tabs>
  )
}

