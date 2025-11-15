'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Link, 
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  Globe,
  Key,
  Eye,
  EyeOff,
  Bot
} from 'lucide-react'
import toast from 'react-hot-toast'
import { OAuthProvider, WebhookIntegration } from '../types'
import { IntegrationConfig, INTEGRATIONS } from './IntegrationList'

export function IntegrationHub() {
  const [platformIntegrations, setPlatformIntegrations] = useState<IntegrationConfig[]>([])
  const [oauthProviders, setOAuthProviders] = useState<OAuthProvider[]>([])
  const [webhooks, setWebhooks] = useState<WebhookIntegration[]>([])
  const [aiProviders, setAiProviders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showOAuthSetup, setShowOAuthSetup] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<OAuthProvider | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPlatformIntegration, setSelectedPlatformIntegration] = useState<IntegrationConfig | null>(null)
  const [selectedAIProvider, setSelectedAIProvider] = useState<any | null>(null)
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookIntegration | null>(null)
  const [showPlatformConfigDialog, setShowPlatformConfigDialog] = useState(false)
  const [showAIConfigDialog, setShowAIConfigDialog] = useState(false)
  const [showWebhookConfigDialog, setShowWebhookConfigDialog] = useState(false)
  const [platformConfigForm, setPlatformConfigForm] = useState<Record<string, any>>({})
  const [aiConfigForm, setAiConfigForm] = useState<Record<string, any>>({})
  const [webhookConfigForm, setWebhookConfigForm] = useState({ name: '', url: '', events: [] as string[], secret: '' })
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [showApiKey, setShowApiKey] = useState(false)

  const [oauthConfig, setOAuthConfig] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: [] as string[]
  })

  useEffect(() => {
    loadPlatformIntegrations()
    loadOAuthProviders()
    loadWebhooks()
    loadAIProviders()
  }, [])

  const loadPlatformIntegrations = async () => {
    try {
      const response = await fetch('/api/admin/integrations/list')
      if (response.ok) {
        const data = await response.json()
        const merged = INTEGRATIONS.map(integration => {
          const saved = data.integrations?.find((i: any) => 
            i.name?.toLowerCase() === integration.name.toLowerCase() || 
            i.type?.toLowerCase() === integration.type.toLowerCase()
          )
          return {
            id: saved?.id || `default-${integration.type}`,
            ...integration,
            isConfigured: !!saved,
            status: saved?.status || 'inactive',
            config: saved?.config || {}
          }
        })
        setPlatformIntegrations(merged)
      } else {
        const defaultIntegrations = INTEGRATIONS.map(integration => ({
          id: `default-${integration.type}`,
          ...integration,
          isConfigured: false,
          status: 'inactive' as const,
          config: {}
        }))
        setPlatformIntegrations(defaultIntegrations)
      }
    } catch (error) {
      console.error('Error loading platform integrations:', error)
      const defaultIntegrations = INTEGRATIONS.map(integration => ({
        id: `default-${integration.type}`,
        ...integration,
        isConfigured: false,
        status: 'inactive' as const,
        config: {}
      }))
      setPlatformIntegrations(defaultIntegrations)
    }
  }

  const loadAIProviders = async () => {
    try {
      const response = await fetch('/api/admin/ai-providers')
      if (response.ok) {
        const data = await response.json()
        setAiProviders(data.providers || [])
      }
    } catch (error) {
      console.error('Error loading AI providers:', error)
      setAiProviders([])
    }
  }

  const loadOAuthProviders = async () => {
    try {
      const response = await fetch('/api/admin/oauth-providers')
      if (response.ok) {
        const data = await response.json()
        setOAuthProviders(data.providers)
      }
    } catch (error) {
      console.error('Error loading OAuth providers:', error)
    }
  }

  const loadWebhooks = async () => {
    try {
      const response = await fetch('/api/admin/webhook-integrations')
      if (response.ok) {
        const data = await response.json()
        setWebhooks(data.webhooks.map((webhook: any) => ({
          ...webhook,
          lastTriggered: webhook.lastTriggered ? new Date(webhook.lastTriggered) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading webhooks:', error)
    }
  }

  const setupOAuth = async () => {
    if (!selectedProvider) return

    try {
      const response = await fetch(`/api/admin/oauth-providers/${selectedProvider.id}/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oauthConfig)
      })

      if (response.ok) {
        toast.success('OAuth integration configured successfully')
        setShowOAuthSetup(false)
        setOAuthConfig({
          clientId: '',
          clientSecret: '',
          redirectUri: '',
          scopes: []
        })
        loadPlatformIntegrations()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to setup OAuth integration')
      }
    } catch (error) {
      console.error('Error setting up OAuth:', error)
      toast.error('Failed to setup OAuth integration')
    }
  }

  const testIntegration = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/admin/integrations/${integrationId}/test`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Integration test successful')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Integration test failed')
      }
    } catch (error) {
      console.error('Error testing integration:', error)
      toast.error('Integration test failed')
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return '🔍'
      case 'microsoft':
        return '🏢'
      case 'github':
        return '🐙'
      case 'slack':
        return '💬'
      case 'discord':
        return '🎮'
      case 'twitter':
        return '🐦'
      case 'facebook':
        return '📘'
      case 'linkedin':
        return '💼'
      default:
        return '🔗'
    }
  }

  const getConfigFields = (type: string) => {
    switch (type.toLowerCase()) {
      case 'openmetadata':
      case 'metadata':
        return [
          { key: 'apiUrl', label: 'API URL', type: 'text', required: true },
          { key: 'apiKey', label: 'API Key', type: 'password', required: true },
          { key: 'authType', label: 'Auth Type', type: 'select', options: ['apiKey', 'basic', 'bearer'], required: true }
        ]
      case 'sso':
        return [
          { key: 'provider', label: 'Provider', type: 'select', options: ['SAML', 'OAuth2', 'OpenID Connect'], required: true },
          { key: 'entityId', label: 'Entity ID', type: 'text', required: true },
          { key: 'ssoUrl', label: 'SSO URL', type: 'text', required: true },
          { key: 'certificate', label: 'Certificate', type: 'textarea', required: false }
        ]
      case 'servicedesk':
        return [
          { key: 'baseUrl', label: 'Base URL', type: 'text', required: true },
          { key: 'apiKey', label: 'API Key', type: 'password', required: true },
          { key: 'technicianKey', label: 'Technician Key', type: 'password', required: false }
        ]
      case 'powerbi':
        return [
          { key: 'clientId', label: 'Client ID', type: 'text', required: true },
          { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
          { key: 'tenantId', label: 'Tenant ID', type: 'text', required: true },
          { key: 'workspaceId', label: 'Workspace ID', type: 'text', required: false }
        ]
      case 'looker':
        return [
          { key: 'apiUrl', label: 'API URL', type: 'text', required: true },
          { key: 'clientId', label: 'Client ID', type: 'text', required: true },
          { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true }
        ]
      case 'grafana':
        return [
          { key: 'apiUrl', label: 'API URL', type: 'text', required: true },
          { key: 'apiKey', label: 'API Key', type: 'password', required: true },
          { key: 'orgId', label: 'Organization ID', type: 'text', required: false }
        ]
      case 'vault':
        return [
          { key: 'vaultUrl', label: 'Vault URL', type: 'text', required: true },
          { key: 'token', label: 'Token', type: 'password', required: true },
          { key: 'mountPath', label: 'Mount Path', type: 'text', required: false }
        ]
      case 'launchpad':
        return [
          { key: 'apiUrl', label: 'API URL', type: 'text', required: true },
          { key: 'apiKey', label: 'API Key', type: 'password', required: true },
          { key: 'environment', label: 'Environment', type: 'select', options: ['development', 'staging', 'production'], required: true }
        ]
      case 'api':
      case 'sdk':
        return [
          { key: 'endpoint', label: 'Endpoint URL', type: 'text', required: true },
          { key: 'apiKey', label: 'API Key', type: 'password', required: false },
          { key: 'authType', label: 'Auth Type', type: 'select', options: ['none', 'apiKey', 'bearer', 'basic'], required: true },
          { key: 'customHeaders', label: 'Custom Headers (JSON)', type: 'textarea', required: false }
        ]
      default:
        return [
          { key: 'url', label: 'URL', type: 'text', required: true },
          { key: 'apiKey', label: 'API Key', type: 'password', required: false }
        ]
    }
  }

  const handlePlatformConfigure = (integration: IntegrationConfig) => {
    setSelectedPlatformIntegration(integration)
    setPlatformConfigForm(integration.config || {})
    setShowPlatformConfigDialog(true)
  }

  const handleSavePlatformConfig = async () => {
    if (!selectedPlatformIntegration) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/integrations/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedPlatformIntegration.name,
          type: selectedPlatformIntegration.type,
          config: platformConfigForm
        })
      })

      if (response.ok) {
        toast.success(`${selectedPlatformIntegration.name} configuration saved successfully`)
        setShowPlatformConfigDialog(false)
        loadPlatformIntegrations()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
      toast.error('Failed to save configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAIConfigure = (provider: any) => {
    setSelectedAIProvider(provider)
    setAiConfigForm({
      apiKey: provider.apiKey || '',
      baseUrl: provider.baseUrl || ''
    })
    setShowAIConfigDialog(true)
  }

  const handleSaveAIConfig = async () => {
    if (!selectedAIProvider) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/ai-providers/${selectedAIProvider.id}/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiConfigForm)
      })

      if (response.ok) {
        toast.success(`${selectedAIProvider.name} configured successfully`)
        setShowAIConfigDialog(false)
        loadAIProviders()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to configure provider')
      }
    } catch (error) {
      console.error('Error configuring provider:', error)
      toast.error('Failed to configure provider')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWebhookConfigure = (webhook: WebhookIntegration) => {
    setSelectedWebhook(webhook)
    setWebhookConfigForm({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events || [],
      secret: webhook.secret || ''
    })
    setShowWebhookConfigDialog(true)
  }

  const handleSaveWebhookConfig = async () => {
    if (!selectedWebhook) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/webhook-integrations/${selectedWebhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookConfigForm)
      })

      if (response.ok) {
        toast.success(`Webhook ${webhookConfigForm.name} updated successfully`)
        setShowWebhookConfigDialog(false)
        loadWebhooks()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update webhook')
      }
    } catch (error) {
      console.error('Error updating webhook:', error)
      toast.error('Failed to update webhook')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Link className="h-6 w-6" />
            Integration Hub
          </h2>
          <p className="text-muted-foreground">
            Connect with third-party services, OAuth providers, and external APIs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            loadPlatformIntegrations()
            loadOAuthProviders()
            loadWebhooks()
            loadAIProviders()
          }} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Vertical Category Tabs */}
        <div className="w-56 flex-shrink-0 border-r border-border pr-4">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList orientation="vertical" className="flex flex-col h-auto w-full bg-transparent p-0 space-y-1">
              <TabsTrigger 
                value="all" 
                className="w-full justify-start px-3 py-2 rounded-md hover:bg-accent transition-colors [&.text-foreground]:bg-accent [&.text-foreground]:border-r-2 [&.text-foreground]:border-r-primary [&.text-foreground]:border-b-0"
              >
                <Link className="h-4 w-4 mr-2" />
                All
              </TabsTrigger>
              <TabsTrigger 
                value="integrations" 
                className="w-full justify-start px-3 py-2 rounded-md hover:bg-accent transition-colors [&.text-foreground]:bg-accent [&.text-foreground]:border-r-2 [&.text-foreground]:border-r-primary [&.text-foreground]:border-b-0"
              >
                <Link className="h-4 w-4 mr-2" />
                Integrations
              </TabsTrigger>
              <TabsTrigger 
                value="oauth" 
                className="w-full justify-start px-3 py-2 rounded-md hover:bg-accent transition-colors [&.text-foreground]:bg-accent [&.text-foreground]:border-r-2 [&.text-foreground]:border-r-primary [&.text-foreground]:border-b-0"
              >
                <Key className="h-4 w-4 mr-2" />
                OAuth Providers
              </TabsTrigger>
              <TabsTrigger 
                value="webhooks" 
                className="w-full justify-start px-3 py-2 rounded-md hover:bg-accent transition-colors [&.text-foreground]:bg-accent [&.text-foreground]:border-r-2 [&.text-foreground]:border-r-primary [&.text-foreground]:border-b-0"
              >
                <Globe className="h-4 w-4 mr-2" />
                Webhooks
              </TabsTrigger>
              <TabsTrigger 
                value="ai-config" 
                className="w-full justify-start px-3 py-2 rounded-md hover:bg-accent transition-colors [&.text-foreground]:bg-accent [&.text-foreground]:border-r-2 [&.text-foreground]:border-r-primary [&.text-foreground]:border-b-0"
              >
                <Bot className="h-4 w-4 mr-2" />
                AI Configuration
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-8">
          {/* Integrations Section */}
          {(selectedCategory === 'all' || selectedCategory === 'integrations') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Platform Integrations
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platformIntegrations.map(integration => {
                  const Icon = integration.icon
                  return (
                    <Card 
                      key={integration.id} 
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            {integration.name}
                          </CardTitle>
                          {integration.status === 'active' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {integration.status === 'inactive' && <XCircle className="h-4 w-4 text-gray-500" />}
                          {integration.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                        <CardDescription>
                          {integration.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge className={
                            integration.status === 'active' ? 'bg-green-100 text-green-800' :
                            integration.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {integration.status}
                          </Badge>
                          <Badge variant={integration.isConfigured ? 'default' : 'secondary'}>
                            {integration.isConfigured ? 'Configured' : 'Not Configured'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePlatformConfigure(integration)
                            }}
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Configure
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            disabled={!integration.isConfigured}
                            onClick={(e) => {
                              e.stopPropagation()
                              testIntegration(integration.id)
                            }}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* OAuth Providers Section */}
          {(selectedCategory === 'all' || selectedCategory === 'oauth') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  OAuth Providers
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {oauthProviders.length > 0 ? (
                  oauthProviders.map(provider => (
                    <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-2xl">{getProviderIcon(provider.name)}</span>
                            {provider.name}
                          </CardTitle>
                          {provider.isSupported && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {!provider.isSupported && <XCircle className="h-4 w-4 text-gray-500" />}
                        </div>
                        <CardDescription>{provider.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant={provider.isSupported ? 'default' : 'secondary'}>
                            {provider.isSupported ? 'Supported' : 'Not Supported'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedProvider(provider)
                              setShowOAuthSetup(true)
                            }}
                            disabled={!provider.isSupported}
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Setup
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="col-span-full">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No OAuth providers available
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Webhooks Section */}
          {(selectedCategory === 'all' || selectedCategory === 'webhooks') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Webhook Integrations
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {webhooks.length > 0 ? (
                  webhooks.map(webhook => (
                    <Card key={webhook.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            {webhook.name}
                          </CardTitle>
                          {webhook.isActive && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {!webhook.isActive && <XCircle className="h-4 w-4 text-gray-500" />}
                        </div>
                        <CardDescription className="truncate">
                          {webhook.url}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                            {webhook.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {webhook.successCount} ✓ / {webhook.failureCount} ✗
                          </div>
                        </div>
                        {webhook.events && webhook.events.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {webhook.events.slice(0, 3).map((event, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                            {webhook.events.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{webhook.events.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={webhook.isActive} 
                            className="flex-1"
                            onCheckedChange={(checked) => {
                              // Handle webhook toggle
                              toast.info(`Webhook ${checked ? 'enabled' : 'disabled'}`)
                            }}
                          />
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleWebhookConfigure(webhook)
                            }}
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Configure
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="col-span-full">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No webhooks configured
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* AI Configuration Section */}
          {(selectedCategory === 'all' || selectedCategory === 'ai-config') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Providers
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiProviders.length > 0 ? (
                  aiProviders.map(provider => (
                    <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-2xl">{provider.icon}</span>
                            {provider.name}
                          </CardTitle>
                          {provider.status === 'active' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {provider.status === 'inactive' && <XCircle className="h-4 w-4 text-muted-foreground" />}
                          {provider.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                        <CardDescription>{provider.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge className={
                            provider.status === 'active' ? 'bg-green-100 text-green-800' :
                            provider.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-muted text-foreground'
                          }>
                            {provider.status}
                          </Badge>
                          <Badge variant={provider.isConfigured ? 'default' : 'secondary'}>
                            {provider.isConfigured ? 'Configured' : 'Not Configured'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAIConfigure(provider)
                            }}
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            {provider.isConfigured ? 'Edit' : 'Configure'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            disabled={!provider.isConfigured}
                            onClick={(e) => {
                              e.stopPropagation()
                              toast.info(`Testing ${provider.name}...`)
                            }}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="col-span-full">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No AI providers configured
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Platform Integration Configuration Dialog */}
      {selectedPlatformIntegration && (
        <Dialog open={showPlatformConfigDialog} onOpenChange={setShowPlatformConfigDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configure {selectedPlatformIntegration.name}</DialogTitle>
              <DialogDescription>
                {selectedPlatformIntegration.description}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                {getConfigFields(selectedPlatformIntegration.type).map(field => (
                  <div key={field.key}>
                    <Label htmlFor={field.key}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {field.type === 'password' ? (
                      <div className="relative">
                        <Input
                          id={field.key}
                          type={showPassword[field.key] ? 'text' : 'password'}
                          value={platformConfigForm[field.key] || ''}
                          onChange={(e) => setPlatformConfigForm({ ...platformConfigForm, [field.key]: e.target.value })}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword({ ...showPassword, [field.key]: !showPassword[field.key] })}
                        >
                          {showPassword[field.key] ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    ) : field.type === 'textarea' ? (
                      <Textarea
                        id={field.key}
                        value={platformConfigForm[field.key] || ''}
                        onChange={(e) => setPlatformConfigForm({ ...platformConfigForm, [field.key]: e.target.value })}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        rows={4}
                      />
                    ) : field.type === 'select' ? (
                      <Select
                        value={platformConfigForm[field.key] || ''}
                        onValueChange={(value) => setPlatformConfigForm({ ...platformConfigForm, [field.key]: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={field.key}
                        type="text"
                        value={platformConfigForm[field.key] || ''}
                        onChange={(e) => setPlatformConfigForm({ ...platformConfigForm, [field.key]: e.target.value })}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPlatformConfigDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSavePlatformConfig} 
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* AI Provider Configuration Dialog */}
      {selectedAIProvider && (
        <Dialog open={showAIConfigDialog} onOpenChange={setShowAIConfigDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-xl">{selectedAIProvider.icon}</span>
                Configure {selectedAIProvider.name}
              </DialogTitle>
              <DialogDescription>
                Set up API credentials and configuration for {selectedAIProvider.name}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-96">
              <div className="space-y-4 pr-4">
                <div>
                  <Label htmlFor="ai-api-key">API Key</Label>
                  <div className="relative mt-1">
                    <Input
                      id="ai-api-key"
                      type={showApiKey ? 'text' : 'password'}
                      value={aiConfigForm.apiKey || ''}
                      onChange={(e) => setAiConfigForm({ ...aiConfigForm, apiKey: e.target.value })}
                      placeholder="Enter API key"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="ai-base-url">Base URL (Optional)</Label>
                  <Input
                    id="ai-base-url"
                    type="url"
                    value={aiConfigForm.baseUrl || ''}
                    onChange={(e) => setAiConfigForm({ ...aiConfigForm, baseUrl: e.target.value })}
                    placeholder="https://api.example.com/v1"
                    className="mt-1"
                  />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAIConfigDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAIConfig} 
                disabled={!aiConfigForm.apiKey || isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Webhook Configuration Dialog */}
      {selectedWebhook && (
        <Dialog open={showWebhookConfigDialog} onOpenChange={setShowWebhookConfigDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configure Webhook</DialogTitle>
              <DialogDescription>
                Update webhook settings and configuration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="webhook-name">Name</Label>
                <Input
                  id="webhook-name"
                  value={webhookConfigForm.name}
                  onChange={(e) => setWebhookConfigForm({ ...webhookConfigForm, name: e.target.value })}
                  placeholder="Enter webhook name"
                />
              </div>
              <div>
                <Label htmlFor="webhook-url">URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  value={webhookConfigForm.url}
                  onChange={(e) => setWebhookConfigForm({ ...webhookConfigForm, url: e.target.value })}
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div>
                <Label htmlFor="webhook-secret">Secret (Optional)</Label>
                <Input
                  id="webhook-secret"
                  type="password"
                  value={webhookConfigForm.secret}
                  onChange={(e) => setWebhookConfigForm({ ...webhookConfigForm, secret: e.target.value })}
                  placeholder="Webhook secret for verification"
                />
              </div>
              <div>
                <Label>Events</Label>
                <div className="space-y-2 mt-2">
                  {['create', 'update', 'delete', 'publish', 'unpublish'].map(event => (
                    <div key={event} className="flex items-center space-x-2">
                      <Switch
                        checked={webhookConfigForm.events.includes(event)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setWebhookConfigForm({
                              ...webhookConfigForm,
                              events: [...webhookConfigForm.events, event]
                            })
                          } else {
                            setWebhookConfigForm({
                              ...webhookConfigForm,
                              events: webhookConfigForm.events.filter(e => e !== event)
                            })
                          }
                        }}
                      />
                      <Label className="capitalize">{event}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWebhookConfigDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveWebhookConfig} 
                disabled={!webhookConfigForm.name || !webhookConfigForm.url || isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* OAuth Setup Dialog */}
      {selectedProvider && (
        <Dialog open={showOAuthSetup} onOpenChange={setShowOAuthSetup}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Setup {selectedProvider.name} OAuth</DialogTitle>
              <DialogDescription>
                Configure OAuth integration with {selectedProvider.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="client-id">Client ID</Label>
                <Input
                  id="client-id"
                  value={oauthConfig.clientId}
                  onChange={(e) => setOAuthConfig({ ...oauthConfig, clientId: e.target.value })}
                  placeholder="Enter client ID"
                />
              </div>
              <div>
                <Label htmlFor="client-secret">Client Secret</Label>
                <Input
                  id="client-secret"
                  type="password"
                  value={oauthConfig.clientSecret}
                  onChange={(e) => setOAuthConfig({ ...oauthConfig, clientSecret: e.target.value })}
                  placeholder="Enter client secret"
                />
              </div>
              <div>
                <Label htmlFor="redirect-uri">Redirect URI</Label>
                <Input
                  id="redirect-uri"
                  value={oauthConfig.redirectUri}
                  onChange={(e) => setOAuthConfig({ ...oauthConfig, redirectUri: e.target.value })}
                  placeholder="https://yourdomain.com/auth/callback"
                />
              </div>
              <div>
                <Label>Scopes</Label>
                <div className="space-y-2 mt-2">
                  {['read', 'write', 'admin'].map(scope => (
                    <div key={scope} className="flex items-center space-x-2">
                      <Switch
                        id={scope}
                        checked={oauthConfig.scopes.includes(scope)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setOAuthConfig({
                              ...oauthConfig,
                              scopes: [...oauthConfig.scopes, scope]
                            })
                          } else {
                            setOAuthConfig({
                              ...oauthConfig,
                              scopes: oauthConfig.scopes.filter(s => s !== scope)
                            })
                          }
                        }}
                      />
                      <Label htmlFor={scope} className="capitalize">{scope}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOAuthSetup(false)}>
                Cancel
              </Button>
              <Button onClick={setupOAuth} disabled={!oauthConfig.clientId || !oauthConfig.clientSecret}>
                Setup OAuth
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
