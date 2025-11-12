'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Link, 
  Plus, 
  Edit, 
  Trash2, 
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Zap,
  Globe,
  Database,
  Server,
  Key,
  Shield,
  Activity,
  Play,
  Pause,
  Eye,
  EyeOff,
  Bot
} from 'lucide-react'
import toast from 'react-hot-toast'
import { APIConfiguration } from '@/app/admin/components/APIConfiguration'
import { APIClient } from './APIClient'
import { IntegrationList } from './IntegrationList'
import { Integration, OAuthProvider, WebhookIntegration } from '../types'

export function IntegrationHub() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [oauthProviders, setOAuthProviders] = useState<OAuthProvider[]>([])
  const [webhooks, setWebhooks] = useState<WebhookIntegration[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateIntegration, setShowCreateIntegration] = useState(false)
  const [showOAuthSetup, setShowOAuthSetup] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<OAuthProvider | null>(null)

  const [newIntegration, setNewIntegration] = useState({
    name: '',
    type: 'oauth' as const,
    provider: '',
    config: {}
  })

  const [oauthConfig, setOAuthConfig] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: [] as string[]
  })

  useEffect(() => {
    loadIntegrations()
    loadOAuthProviders()
    loadWebhooks()
  }, [])

  const loadIntegrations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/integrations')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations.map((integration: any) => ({
          ...integration,
          createdAt: new Date(integration.createdAt),
          updatedAt: new Date(integration.updatedAt),
          lastSync: integration.lastSync ? new Date(integration.lastSync) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading integrations:', error)
    } finally {
      setIsLoading(false)
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

  const createIntegration = async () => {
    try {
      const response = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIntegration)
      })

      if (response.ok) {
        toast.success('Integration created successfully')
        setShowCreateIntegration(false)
        setNewIntegration({
          name: '',
          type: 'oauth',
          provider: '',
          config: {}
        })
        loadIntegrations()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create integration')
      }
    } catch (error) {
      console.error('Error creating integration:', error)
      toast.error('Failed to create integration')
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
        loadIntegrations()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to setup OAuth integration')
      }
    } catch (error) {
      console.error('Error setting up OAuth:', error)
      toast.error('Failed to setup OAuth integration')
    }
  }

  const toggleIntegration = async (integrationId: string, isEnabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/integrations/${integrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled })
      })

      if (response.ok) {
        toast.success(`Integration ${isEnabled ? 'enabled' : 'disabled'}`)
        loadIntegrations()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update integration')
      }
    } catch (error) {
      console.error('Error updating integration:', error)
      toast.error('Failed to update integration')
    }
  }

  const deleteIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return

    try {
      const response = await fetch(`/api/admin/integrations/${integrationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Integration deleted successfully')
        loadIntegrations()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete integration')
      }
    } catch (error) {
      console.error('Error deleting integration:', error)
      toast.error('Failed to delete integration')
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'oauth':
        return <Key className="h-4 w-4" />
      case 'webhook':
        return <Globe className="h-4 w-4" />
      case 'api':
        return <Database className="h-4 w-4" />
      case 'database':
        return <Server className="h-4 w-4" />
      case 'sso':
        return <Shield className="h-4 w-4" />
      default:
        return <Link className="h-4 w-4" />
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
          <Button variant="outline" size="sm" onClick={loadIntegrations} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="w-full">
      <Tabs defaultValue="api-client">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="api-client">API Client</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="oauth">OAuth Providers</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="ai-config">AI Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="api-client" className="space-y-6">
          <APIClient />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <IntegrationList />
        </TabsContent>

        <TabsContent value="oauth" className="space-y-6">
          <h3 className="text-lg font-semibold">OAuth Providers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {oauthProviders.map(provider => (
              <Card key={provider.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{getProviderIcon(provider.name)}</span>
                    {provider.name}
                  </CardTitle>
                  <CardDescription>{provider.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant={provider.isSupported ? 'default' : 'secondary'}>
                      {provider.isSupported ? 'Supported' : 'Not Supported'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
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
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <h3 className="text-lg font-semibold">Webhook Integrations</h3>
          <div className="space-y-4">
            {webhooks.map(webhook => (
              <Card key={webhook.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{webhook.name}</h4>
                      <p className="text-sm text-muted-foreground">{webhook.url}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                          {webhook.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {webhook.successCount} success, {webhook.failureCount} failures
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={webhook.isActive} />
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai-config" className="space-y-6">
          <APIConfiguration />
        </TabsContent>
      </Tabs>
      </div>

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
