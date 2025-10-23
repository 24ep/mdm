'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  Settings,
  Webhook,
  Zap,
  Database,
  Mail,
  Slack,
  Github,
  Google,
  Microsoft,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity
} from 'lucide-react'
import { useSpacePermissions } from '@/hooks/use-space-permissions'

interface Integration {
  id: string
  name: string
  description: string
  type: 'webhook' | 'api' | 'oauth' | 'database'
  status: 'active' | 'inactive' | 'error'
  config: Record<string, any>
  lastSync?: Date
  isSystem: boolean
  created_at: Date
  updated_at: Date
}

interface WebhookEndpoint {
  id: string
  name: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers: Record<string, string>
  authentication: {
    type: 'none' | 'bearer' | 'basic' | 'api_key'
    config: Record<string, any>
  }
  triggers: string[]
  enabled: boolean
  created_at: Date
}

interface ThirdPartyIntegration {
  id: string
  name: string
  description: string
  provider: 'slack' | 'github' | 'google' | 'microsoft' | 'salesforce' | 'hubspot'
  status: 'connected' | 'disconnected' | 'error'
  config: Record<string, any>
  permissions: string[]
  lastSync?: Date
}

const INTEGRATION_TYPES = [
  {
    type: 'webhook',
    name: 'Webhook',
    description: 'Send data to external endpoints',
    icon: <Webhook className="h-5 w-5" />,
    color: 'bg-blue-500'
  },
  {
    type: 'api',
    name: 'API Integration',
    description: 'Connect to external APIs',
    icon: <Zap className="h-5 w-5" />,
    color: 'bg-green-500'
  },
  {
    type: 'oauth',
    name: 'OAuth Integration',
    description: 'Authenticate with OAuth providers',
    icon: <Activity className="h-5 w-5" />,
    color: 'bg-purple-500'
  },
  {
    type: 'database',
    name: 'Database Sync',
    description: 'Sync with external databases',
    icon: <Database className="h-5 w-5" />,
    color: 'bg-orange-500'
  }
]

const THIRD_PARTY_PROVIDERS = [
  {
    provider: 'slack',
    name: 'Slack',
    description: 'Send notifications to Slack channels',
    icon: <Slack className="h-5 w-5" />,
    color: 'bg-purple-500'
  },
  {
    provider: 'github',
    name: 'GitHub',
    description: 'Sync with GitHub repositories',
    icon: <Github className="h-5 w-5" />,
    color: 'bg-gray-500'
  },
  {
    provider: 'google',
    name: 'Google Workspace',
    description: 'Integrate with Google services',
    icon: <Google className="h-5 w-5" />,
    color: 'bg-blue-500'
  },
  {
    provider: 'microsoft',
    name: 'Microsoft 365',
    description: 'Connect to Microsoft services',
    icon: <Microsoft className="h-5 w-5" />,
    color: 'bg-orange-500'
  }
]

interface IntegrationHubProps {
  spaceId: string
}

export function IntegrationHub({ spaceId }: IntegrationHubProps) {
  const permissions = useSpacePermissions()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([])
  const [thirdPartyIntegrations, setThirdPartyIntegrations] = useState<ThirdPartyIntegration[]>([])
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newIntegration, setNewIntegration] = useState({
    name: '',
    description: '',
    type: 'webhook' as string,
    config: {}
  })

  const canCreateIntegration = permissions.canCreate
  const canEditIntegration = permissions.canEdit
  const canDeleteIntegration = permissions.canDelete

  const createIntegration = () => {
    if (!newIntegration.name.trim()) return

    const integration: Integration = {
      id: `integration_${Date.now()}`,
      name: newIntegration.name,
      description: newIntegration.description,
      type: newIntegration.type as any,
      status: 'inactive',
      config: newIntegration.config,
      isSystem: false,
      created_at: new Date(),
      updated_at: new Date()
    }

    setIntegrations(prev => [...prev, integration])
    setSelectedIntegration(integration)
    setShowCreateDialog(false)
    setNewIntegration({ name: '', description: '', type: 'webhook', config: {} })
  }

  const updateIntegration = (id: string, updates: Partial<Integration>) => {
    setIntegrations(prev => prev.map(i => 
      i.id === id ? { ...i, ...updates, updated_at: new Date() } : i
    ))
    if (selectedIntegration?.id === id) {
      setSelectedIntegration(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  const deleteIntegration = (id: string) => {
    setIntegrations(prev => prev.filter(i => i.id !== id))
    if (selectedIntegration?.id === id) {
      setSelectedIntegration(null)
    }
  }

  const createWebhook = () => {
    const webhook: WebhookEndpoint = {
      id: `webhook_${Date.now()}`,
      name: 'New Webhook',
      url: '',
      method: 'POST',
      headers: {},
      authentication: {
        type: 'none',
        config: {}
      },
      triggers: [],
      enabled: false,
      created_at: new Date()
    }

    setWebhooks(prev => [...prev, webhook])
  }

  const connectThirdParty = (provider: string) => {
    const integration: ThirdPartyIntegration = {
      id: `third_party_${Date.now()}`,
      name: THIRD_PARTY_PROVIDERS.find(p => p.provider === provider)?.name || provider,
      description: THIRD_PARTY_PROVIDERS.find(p => p.provider === provider)?.description || '',
      provider: provider as any,
      status: 'connected',
      config: {},
      permissions: [],
      lastSync: new Date()
    }

    setThirdPartyIntegrations(prev => [...prev, integration])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'inactive':
      case 'disconnected':
        return 'bg-gray-100 text-gray-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integration Hub</h2>
          <p className="text-muted-foreground">
            Connect your data with external services and APIs
          </p>
        </div>
        {canCreateIntegration && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Integration
          </Button>
        )}
      </div>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="third-party">Third Party</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <Card 
                key={integration.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedIntegration?.id === integration.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedIntegration(integration)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        INTEGRATION_TYPES.find(t => t.type === integration.type)?.color
                      } text-white`}>
                        {INTEGRATION_TYPES.find(t => t.type === integration.type)?.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription>{integration.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(integration.status)}
                      <Badge className={getStatusColor(integration.status)}>
                        {integration.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Type:</span>
                      <span className="capitalize">{integration.type}</span>
                    </div>
                    {integration.lastSync && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Last Sync:</span>
                        <span>{integration.lastSync.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      {canEditIntegration && (
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteIntegration && (
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedIntegration && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {selectedIntegration.name}
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedIntegration.status)}>
                      {selectedIntegration.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>{selectedIntegration.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="config" className="w-full">
                  <TabsList>
                    <TabsTrigger value="config">Configuration</TabsTrigger>
                    <TabsTrigger value="testing">Testing</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                  </TabsList>

                  <TabsContent value="config" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="integration-name">Integration Name</Label>
                        <Input
                          id="integration-name"
                          value={selectedIntegration.name}
                          onChange={(e) => updateIntegration(selectedIntegration.id, { name: e.target.value })}
                          disabled={!canEditIntegration}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="integration-status">Status</Label>
                        <Select
                          value={selectedIntegration.status}
                          onValueChange={(status) => updateIntegration(selectedIntegration.id, { status: status as any })}
                          disabled={!canEditIntegration}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="integration-description">Description</Label>
                      <Textarea
                        id="integration-description"
                        value={selectedIntegration.description}
                        onChange={(e) => updateIntegration(selectedIntegration.id, { description: e.target.value })}
                        disabled={!canEditIntegration}
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="testing" className="space-y-4">
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Integration testing tools will appear here</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="logs" className="space-y-4">
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Integration logs will appear here</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Webhook Endpoints</h3>
              <p className="text-sm text-muted-foreground">
                Configure webhook endpoints to receive data from external services
              </p>
            </div>
            {canCreateIntegration && (
              <Button onClick={createWebhook}>
                <Plus className="h-4 w-4 mr-2" />
                Create Webhook
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Webhook className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{webhook.name}</div>
                        <div className="text-sm text-muted-foreground">{webhook.url || 'No URL configured'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={webhook.enabled ? 'default' : 'secondary'}>
                        {webhook.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Switch
                        checked={webhook.enabled}
                        onCheckedChange={(enabled) => {
                          setWebhooks(prev => prev.map(w => 
                            w.id === webhook.id ? { ...w, enabled } : w
                          ))
                        }}
                      />
                      {canEditIntegration && (
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="third-party" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Third-Party Integrations</h3>
            <p className="text-sm text-muted-foreground">
              Connect with popular services and platforms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {THIRD_PARTY_PROVIDERS.map((provider) => (
              <Card key={provider.provider} className="cursor-pointer hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${provider.color} text-white`}>
                      {provider.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full"
                    onClick={() => connectThirdParty(provider.provider)}
                  >
                    Connect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {thirdPartyIntegrations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Connected Services</h4>
              {thirdPartyIntegrations.map((integration) => (
                <Card key={integration.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(integration.status)}
                        <div>
                          <div className="font-medium">{integration.name}</div>
                          <div className="text-sm text-muted-foreground">{integration.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(integration.status)}>
                          {integration.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Integration logs will appear here</p>
          </div>
        </TabsContent>
      </Tabs>

      {showCreateDialog && (
        <Card className="fixed inset-0 z-50 m-4 max-w-md">
          <CardHeader>
            <CardTitle>Create New Integration</CardTitle>
            <CardDescription>
              Create a new integration with external services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="integration-name">Integration Name</Label>
              <Input
                id="integration-name"
                value={newIntegration.name}
                onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                placeholder="Enter integration name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="integration-description">Description</Label>
              <Textarea
                id="integration-description"
                value={newIntegration.description}
                onChange={(e) => setNewIntegration({ ...newIntegration, description: e.target.value })}
                placeholder="Enter integration description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="integration-type">Integration Type</Label>
              <Select
                value={newIntegration.type}
                onValueChange={(type) => setNewIntegration({ ...newIntegration, type })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTEGRATION_TYPES.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        <div>
                          <div className="font-medium">{type.name}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={createIntegration} disabled={!newIntegration.name.trim()}>
                Create Integration
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
