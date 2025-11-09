'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { Chatbot } from '../types'
import toast from 'react-hot-toast'
import { OpenAIAgentSDKConfig } from './OpenAIAgentSDKConfig'

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

interface EngineConfigProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function EngineConfig({ formData, setFormData }: EngineConfigProps) {
  const [availableModels, setAvailableModels] = useState<AIModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [availableEngines, setAvailableEngines] = useState<Array<{ id: string; name: string; description?: string }>>([])
  const [isLoadingEngines, setIsLoadingEngines] = useState(false)
  const [isFetchingWorkflowConfig, setIsFetchingWorkflowConfig] = useState(false)

  const engineType = formData.engineType || 'custom'

  useEffect(() => {
    if (engineType === 'openai') {
      loadAIModels()
    }
  }, [engineType])

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
      const response = await fetch('/api/admin/agentbuilder/engines')
      if (response.ok) {
        const data = await response.json()
        setAvailableEngines(data.engines || [])
      } else {
        setAvailableEngines([])
      }
    } catch (error) {
      console.error('Error loading AgentBuilder engines:', error)
      setAvailableEngines([])
    } finally {
      setIsLoadingEngines(false)
    }
  }

  return (
    <div className="space-y-4 pt-4">
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
          value={formData.description || ''}
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
              selectedModelId: undefined,
              selectedEngineId: undefined,
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
        <OpenAIAgentSDKConfig
          formData={formData}
          setFormData={setFormData}
          isFetchingWorkflowConfig={isFetchingWorkflowConfig}
          setIsFetchingWorkflowConfig={setIsFetchingWorkflowConfig}
        />
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
    </div>
  )
}

