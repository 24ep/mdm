'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Settings, Palette, Layout, Rocket, Copy, X, Loader2 } from 'lucide-react'
import { StyleTab } from '../StyleTab'
import { Chatbot } from './types'
import toast from 'react-hot-toast'

interface AIModel {
  id: string
  name: string
  provider: string
  type: string
  description?: string
  maxTokens: number
  costPerToken: number
  isAvailable: boolean
  capabilities?: string[]
}

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
  const [availableModels, setAvailableModels] = useState<AIModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [availableEngines, setAvailableEngines] = useState<Array<{ id: string; name: string; description?: string }>>([])
  const [isLoadingEngines, setIsLoadingEngines] = useState(false)

  const engineType = formData.engineType || 'custom'

  // Load AI models when OpenAI is selected
  useEffect(() => {
    if (engineType === 'openai') {
      loadAIModels()
    }
  }, [engineType])

  // Load AgentBuilder engines when AgentBuilder is selected
  useEffect(() => {
    if (engineType === 'agentbuilder') {
      loadAgentBuilderEngines()
    }
  }, [engineType])

  const loadAIModels = async () => {
    setIsLoadingModels(true)
    try {
      const response = await fetch('/api/admin/ai-models')
      if (response.ok) {
        const data = await response.json()
        // Filter for OpenAI models
        const openaiModels = (data.models || []).filter((model: AIModel) => 
          model.provider === 'openai' && model.isAvailable
        )
        setAvailableModels(openaiModels)
      } else {
        toast.error('Failed to load AI models')
      }
    } catch (error) {
      console.error('Error loading AI models:', error)
      toast.error('Failed to load AI models')
    } finally {
      setIsLoadingModels(false)
    }
  }

  const loadAgentBuilderEngines = async () => {
    setIsLoadingEngines(true)
    try {
      // TODO: Replace with actual AgentBuilder engines API endpoint
      // For now, using a placeholder - you'll need to implement the actual endpoint
      const response = await fetch('/api/admin/agentbuilder/engines')
      if (response.ok) {
        const data = await response.json()
        setAvailableEngines(data.engines || [])
      } else {
        // If endpoint doesn't exist yet, use empty array
        setAvailableEngines([])
      }
    } catch (error) {
      console.error('Error loading AgentBuilder engines:', error)
      // If endpoint doesn't exist, just set empty array
      setAvailableEngines([])
    } finally {
      setIsLoadingEngines(false)
    }
  }

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
          <Label>Engine Type *</Label>
          <Select
            value={engineType}
            onValueChange={(v: 'custom' | 'agentbuilder' | 'openai' | 'chatkit' | 'dify' | 'openai-agent-sdk') => {
              setFormData({ 
                ...formData, 
                engineType: v,
                // Reset selections when switching engine types
                selectedModelId: undefined,
                selectedEngineId: undefined,
                // Clear API endpoint if switching to managed engines
                apiEndpoint: v === 'custom' ? formData.apiEndpoint : ''
              })
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom API Endpoint</SelectItem>
              <SelectItem value="agentbuilder">AgentBuilder Engine</SelectItem>
              <SelectItem value="openai">OpenAI Platform</SelectItem>
              <SelectItem value="chatkit">OpenAI ChatKit</SelectItem>
              <SelectItem value="openai-agent-sdk">OpenAI Agent SDK</SelectItem>
              <SelectItem value="dify">Dify v2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {engineType === 'openai' && (
          <div className="space-y-2">
            <Label>OpenAI Model *</Label>
            <Select
              value={formData.selectedModelId || ''}
              onValueChange={(v) => setFormData({ ...formData, selectedModelId: v })}
              disabled={isLoadingModels}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select OpenAI model"} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingModels ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading models...
                  </div>
                ) : availableModels.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No OpenAI models available. Please configure OpenAI in API Configuration.
                  </div>
                ) : (
                  availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        {model.description && (
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select an OpenAI model to use for this chatbot. Make sure OpenAI is configured in API Configuration.
            </p>
          </div>
        )}

        {engineType === 'agentbuilder' && (
          <div className="space-y-2">
            <Label>AgentBuilder Engine *</Label>
            <Select
              value={formData.selectedEngineId || ''}
              onValueChange={(v) => setFormData({ ...formData, selectedEngineId: v })}
              disabled={isLoadingEngines}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingEngines ? "Loading engines..." : "Select AgentBuilder engine"} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingEngines ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading engines...
                  </div>
                ) : availableEngines.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No AgentBuilder engines available.
                  </div>
                ) : (
                  availableEngines.map((engine) => (
                    <SelectItem key={engine.id} value={engine.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{engine.name}</span>
                        {engine.description && (
                          <span className="text-xs text-muted-foreground">{engine.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select an AgentBuilder engine to use for this chatbot.
            </p>
          </div>
        )}

        {engineType === 'chatkit' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Agent Builder Agent ID *</Label>
              <Input
                value={formData.chatkitAgentId || ''}
                onChange={(e) => setFormData({ ...formData, chatkitAgentId: e.target.value })}
                placeholder="agent_abc123..."
              />
              <p className="text-xs text-muted-foreground">
                Enter your Agent Builder agent ID. This connects ChatKit to your agent.
              </p>
            </div>

            <div className="space-y-2">
              <Label>OpenAI API Key *</Label>
              <Input
                type="password"
                value={formData.chatkitApiKey || ''}
                onChange={(e) => setFormData({ ...formData, chatkitApiKey: e.target.value } as any)}
                placeholder="sk-..."
              />
              <p className="text-xs text-muted-foreground">
                Your OpenAI API key for ChatKit authentication. You can also configure it globally in <strong>Admin → API Configuration</strong>.
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Configure theme and style in the Style tab.
            </p>
          </div>
        )}

        {engineType === 'openai-agent-sdk' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Agent/Workflow ID *</Label>
              <Input
                value={formData.openaiAgentSdkAgentId || ''}
                onChange={(e) => setFormData({ ...formData, openaiAgentSdkAgentId: e.target.value } as any)}
                placeholder="asst_abc123... or wf_abc123..."
              />
              <p className="text-xs text-muted-foreground">
                Enter your OpenAI Assistant ID (<code className="bg-muted px-1 rounded">asst_</code>) or Workflow ID (<code className="bg-muted px-1 rounded">wf_</code>). 
                Workflows use the OpenAI Agents SDK, while Assistants use the Assistants API.
              </p>
            </div>

            <div className="space-y-2">
              <Label>OpenAI API Key *</Label>
              <Input
                type="password"
                value={formData.openaiAgentSdkApiKey || ''}
                onChange={(e) => setFormData({ ...formData, openaiAgentSdkApiKey: e.target.value } as any)}
                placeholder="sk-..."
              />
              <p className="text-xs text-muted-foreground">
                Your OpenAI API key for Agent SDK authentication. You can also configure it globally in <strong>Admin → API Configuration</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Model (Optional)</Label>
              <Input
                value={formData.openaiAgentSdkModel || ''}
                onChange={(e) => setFormData({ ...formData, openaiAgentSdkModel: e.target.value } as any)}
                placeholder="gpt-4o, gpt-5, etc."
              />
              <p className="text-xs text-muted-foreground">
                Model to use for the agent. If not specified, defaults to gpt-4o. For workflows, this may be overridden by the workflow configuration.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Agent Instructions (Optional)</Label>
              <Textarea
                value={formData.openaiAgentSdkInstructions || ''}
                onChange={(e) => setFormData({ ...formData, openaiAgentSdkInstructions: e.target.value } as any)}
                placeholder="You are a helpful assistant..."
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                Instructions for the agent. If not specified, uses default instructions. For workflows, this may be overridden by the workflow configuration.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Reasoning Effort (Optional)</Label>
              <Select
                value={formData.openaiAgentSdkReasoningEffort || 'default'}
                onValueChange={(value) => setFormData({ ...formData, openaiAgentSdkReasoningEffort: value === 'default' ? undefined : value as 'low' | 'medium' | 'high' } as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Reasoning effort for gpt-5 models. Controls how much the model reasons before responding.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Store Reasoning Traces</Label>
                <p className="text-xs text-muted-foreground">Whether to store reasoning traces for analysis</p>
              </div>
              <Switch
                checked={formData.openaiAgentSdkStore || false}
                onCheckedChange={(checked) => setFormData({ ...formData, openaiAgentSdkStore: checked } as any)}
              />
            </div>

            <div className="space-y-2">
              <Label>Vector Store ID (Optional)</Label>
              <Input
                value={formData.openaiAgentSdkVectorStoreId || ''}
                onChange={(e) => setFormData({ ...formData, openaiAgentSdkVectorStoreId: e.target.value } as any)}
                placeholder="vs_abc123..."
              />
              <p className="text-xs text-muted-foreground">
                Vector store ID for file search tool. If provided, enables file search capability for the agent.
              </p>
            </div>
          </div>
        )}

        {engineType === 'dify' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Dify API Base URL *</Label>
              <Input
                value={formData.difyOptions?.apiBaseUrl || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  difyOptions: {
                    ...formData.difyOptions,
                    apiBaseUrl: e.target.value
                  }
                } as any)}
                placeholder="http://ncc-dify.qsncc.com"
              />
              <p className="text-xs text-muted-foreground">
                Base URL of your Dify instance (e.g., http://ncc-dify.qsncc.com)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Dify API Key *</Label>
              <Input
                type="password"
                value={formData.difyApiKey || ''}
                onChange={(e) => setFormData({ ...formData, difyApiKey: e.target.value } as any)}
                placeholder="app-AAAAAAAAAAAAAAAAAAa"
              />
              <p className="text-xs text-muted-foreground">
                Your Dify API key. Found in your Dify app settings.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Response Mode</Label>
                <Select
                  value={formData.difyOptions?.responseMode || 'streaming'}
                  onValueChange={(v: 'streaming' | 'blocking') => setFormData({
                    ...formData,
                    difyOptions: {
                      ...formData.difyOptions,
                      responseMode: v
                    }
                  } as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="streaming">Streaming</SelectItem>
                    <SelectItem value="blocking">Blocking</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose streaming for real-time responses or blocking for complete responses
                </p>
              </div>

              <div className="space-y-2">
                <Label>User Identifier (optional)</Label>
                <Input
                  value={formData.difyOptions?.user || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    difyOptions: {
                      ...formData.difyOptions,
                      user: e.target.value
                    }
                  } as any)}
                  placeholder="abc-123"
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier for the user (for conversation tracking)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Input Variables (optional)</Label>
              <Textarea
                value={JSON.stringify(formData.difyOptions?.inputs || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    setFormData({
                      ...formData,
                      difyOptions: {
                        ...formData.difyOptions,
                        inputs: parsed
                      }
                    } as any)
                  } catch (err) {
                    // Invalid JSON, don't update
                  }
                }}
                placeholder='{"variable1": "value1", "variable2": "value2"}'
                rows={4}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                JSON object with input variables for your Dify workflow/app. Leave empty object {} if not needed.
              </p>
            </div>
          </div>
        )}

        {engineType === 'custom' && (
          <>
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
          </>
        )}
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
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Voice Agent</Label>
              <p className="text-xs text-muted-foreground">Allow users to interact via voice input and hear responses</p>
            </div>
            <Switch
              checked={formData.enableVoiceAgent || false}
              onCheckedChange={(checked) => setFormData({ ...formData, enableVoiceAgent: checked })}
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

