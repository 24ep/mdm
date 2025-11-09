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
import { formatDate } from '@/lib/date-formatters'
import { showSuccess, showError, ToastMessages } from '@/lib/toast-utils'
import { 
  Key, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Activity,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Globe,
  Shield,
  Zap,
  Database,
  Server,
  Link
} from 'lucide-react'
import { APIKey, Webhook, APIUsage, RateLimit } from '../types'

export function APIManagement() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [usage, setUsage] = useState<APIUsage[]>([])
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateKey, setShowCreateKey] = useState(false)
  const [showCreateWebhook, setShowCreateWebhook] = useState(false)
  const [showCreateRateLimit, setShowCreateRateLimit] = useState(false)
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null)
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})

  const [newKey, setNewKey] = useState({
    name: '',
    permissions: [] as string[],
    rateLimit: {
      requests: 1000,
      window: 'hour'
    },
    description: '',
    expiresAt: ''
  })

  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: ''
  })

  const [newRateLimit, setNewRateLimit] = useState({
    name: '',
    requests: 1000,
    window: 'hour',
    description: ''
  })

  useEffect(() => {
    loadAPIKeys()
    loadWebhooks()
    loadUsage()
    loadRateLimits()
  }, [])

  const loadAPIKeys = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/api-keys')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.keys.map((key: any) => ({
          ...key,
          createdAt: new Date(key.createdAt),
          lastUsed: key.lastUsed ? new Date(key.lastUsed) : undefined,
          expiresAt: key.expiresAt ? new Date(key.expiresAt) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading API keys:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadWebhooks = async () => {
    try {
      const response = await fetch('/api/admin/webhooks')
      if (response.ok) {
        const data = await response.json()
        setWebhooks(data.webhooks.map((webhook: any) => ({
          ...webhook,
          lastTriggered: webhook.lastTriggered ? new Date(webhook.lastTriggered) : undefined,
          createdAt: new Date(webhook.createdAt)
        })))
      }
    } catch (error) {
      console.error('Error loading webhooks:', error)
    }
  }

  const loadUsage = async () => {
    try {
      const response = await fetch('/api/admin/api-usage')
      if (response.ok) {
        const data = await response.json()
        setUsage(data.usage.map((item: any) => ({
          ...item,
          lastUsed: new Date(item.lastUsed)
        })))
      }
    } catch (error) {
      console.error('Error loading usage:', error)
    }
  }

  const loadRateLimits = async () => {
    try {
      const response = await fetch('/api/admin/rate-limits')
      if (response.ok) {
        const data = await response.json()
        setRateLimits(data.rateLimits)
      }
    } catch (error) {
      console.error('Error loading rate limits:', error)
    }
  }

  const createAPIKey = async () => {
    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey)
      })

      if (response.ok) {
        const data = await response.json()
        showSuccess('API key created successfully')
        setShowCreateKey(false)
        setNewKey({
          name: '',
          permissions: [],
          rateLimit: { requests: 1000, window: 'hour' },
          description: '',
          expiresAt: ''
        })
        loadAPIKeys()
      } else {
        const error = await response.json()
        showError(error.error || 'Failed to create API key')
      }
    } catch (error) {
      console.error('Error creating API key:', error)
      showError('Failed to create API key')
    }
  }

  const createWebhook = async () => {
    try {
      const response = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWebhook)
      })

      if (response.ok) {
        showSuccess('Webhook created successfully')
        setShowCreateWebhook(false)
        setNewWebhook({
          name: '',
          url: '',
          events: [],
          secret: ''
        })
        loadWebhooks()
      } else {
        const error = await response.json()
        showError(error.error || 'Failed to create webhook')
      }
    } catch (error) {
      console.error('Error creating webhook:', error)
      showError('Failed to create webhook')
    }
  }

  const createRateLimit = async () => {
    try {
      const response = await fetch('/api/admin/rate-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRateLimit)
      })

      if (response.ok) {
        showSuccess('Rate limit created successfully')
        setShowCreateRateLimit(false)
        setNewRateLimit({
          name: '',
          requests: 1000,
          window: 'hour',
          description: ''
        })
        loadRateLimits()
      } else {
        const error = await response.json()
        showError(error.error || 'Failed to create rate limit')
      }
    } catch (error) {
      console.error('Error creating rate limit:', error)
      showError('Failed to create rate limit')
    }
  }

  const deleteAPIKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return

    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showSuccess('API key deleted successfully')
        loadAPIKeys()
      } else {
        const error = await response.json()
        showError(error.error || 'Failed to delete API key')
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      showError('Failed to delete API key')
    }
  }

  const deleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return

    try {
      const response = await fetch(`/api/admin/webhooks/${webhookId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showSuccess('Webhook deleted successfully')
        loadWebhooks()
      } else {
        const error = await response.json()
        showError(error.error || 'Failed to delete webhook')
      }
    } catch (error) {
      console.error('Error deleting webhook:', error)
      showError('Failed to delete webhook')
    }
  }

  const toggleAPIKey = async (keyId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        showSuccess(`API key ${isActive ? 'activated' : 'deactivated'}`)
        loadAPIKeys()
      } else {
        const error = await response.json()
        showError(error.error || 'Failed to update API key')
      }
    } catch (error) {
      console.error('Error updating API key:', error)
      showError('Failed to update API key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showSuccess('Copied to clipboard')
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }


  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'read':
        return 'bg-blue-100 text-blue-800'
      case 'write':
        return 'bg-green-100 text-green-800'
      case 'admin':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6" />
            API Management
          </h2>
          <p className="text-muted-foreground">
            Manage API keys, webhooks, rate limits, and usage analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadAPIKeys} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="keys" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="limits">Rate Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">API Keys</h3>
            <Dialog open={showCreateKey} onOpenChange={setShowCreateKey}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Generate a new API key with specific permissions and rate limits
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="key-name">Key Name</Label>
                    <Input
                      id="key-name"
                      value={newKey.name}
                      onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                      placeholder="Enter key name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="key-description">Description</Label>
                    <Textarea
                      id="key-description"
                      value={newKey.description}
                      onChange={(e) => setNewKey({ ...newKey, description: e.target.value })}
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Permissions</Label>
                    <div className="space-y-2">
                      {['read', 'write', 'admin', 'webhook'].map(permission => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Switch
                            id={permission}
                            checked={newKey.permissions.includes(permission)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewKey({
                                  ...newKey,
                                  permissions: [...newKey.permissions, permission]
                                })
                              } else {
                                setNewKey({
                                  ...newKey,
                                  permissions: newKey.permissions.filter(p => p !== permission)
                                })
                              }
                            }}
                          />
                          <Label htmlFor={permission} className="capitalize">{permission}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rate-limit">Rate Limit (requests)</Label>
                      <Input
                        id="rate-limit"
                        type="number"
                        value={newKey.rateLimit.requests}
                        onChange={(e) => setNewKey({
                          ...newKey,
                          rateLimit: { ...newKey.rateLimit, requests: parseInt(e.target.value) }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rate-window">Time Window</Label>
                      <Select value={newKey.rateLimit.window} onValueChange={(value) => setNewKey({
                        ...newKey,
                        rateLimit: { ...newKey.rateLimit, window: value }
                      })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minute">Per Minute</SelectItem>
                          <SelectItem value="hour">Per Hour</SelectItem>
                          <SelectItem value="day">Per Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateKey(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createAPIKey} disabled={!newKey.name}>
                    Create API Key
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apiKeys.map(key => (
              <Card key={key.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{key.name}</CardTitle>
                    {getStatusIcon(key.isActive)}
                  </div>
                  <CardDescription>{key.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Key:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {key.key.substring(0, 8)}...
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(key.key)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {key.permissions.map(permission => (
                      <Badge key={permission} className={getPermissionColor(permission)}>
                        {permission}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <div>Rate Limit: {key.rateLimit.requests}/{key.rateLimit.window}</div>
                    <div>Created: {formatDate(key.createdAt)}</div>
                    {key.lastUsed && (
                      <div>Last Used: {formatDate(key.lastUsed)}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedKey(key)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAPIKey(key.id, !key.isActive)}
                    >
                      {key.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteAPIKey(key.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Webhooks</h3>
            <Dialog open={showCreateWebhook} onOpenChange={setShowCreateWebhook}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Webhook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Webhook</DialogTitle>
                  <DialogDescription>
                    Set up a webhook to receive notifications for specific events
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="webhook-name">Webhook Name</Label>
                    <Input
                      id="webhook-name"
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                      placeholder="Enter webhook name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhook-url">URL</Label>
                    <Input
                      id="webhook-url"
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                      placeholder="https://example.com/webhook"
                    />
                  </div>
                  <div>
                    <Label>Events</Label>
                    <div className="space-y-2">
                      {['user.created', 'user.updated', 'data.created', 'data.updated', 'file.uploaded'].map(event => (
                        <div key={event} className="flex items-center space-x-2">
                          <Switch
                            id={event}
                            checked={newWebhook.events.includes(event)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewWebhook({
                                  ...newWebhook,
                                  events: [...newWebhook.events, event]
                                })
                              } else {
                                setNewWebhook({
                                  ...newWebhook,
                                  events: newWebhook.events.filter(e => e !== event)
                                })
                              }
                            }}
                          />
                          <Label htmlFor={event}>{event}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="webhook-secret">Secret (Optional)</Label>
                    <Input
                      id="webhook-secret"
                      value={newWebhook.secret}
                      onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                      placeholder="Webhook secret for verification"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateWebhook(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createWebhook} disabled={!newWebhook.name || !newWebhook.url}>
                    Create Webhook
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

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
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteWebhook(webhook.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <h3 className="text-lg font-semibold">API Usage Analytics</h3>
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Usage</CardTitle>
              <CardDescription>API endpoint usage statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usage.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{item.method} {item.endpoint}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.requests} requests • {item.avgResponseTime}ms avg • {item.errorRate}% errors
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last used: {formatDate(item.lastUsed)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Rate Limits</h3>
            <Dialog open={showCreateRateLimit} onOpenChange={setShowCreateRateLimit}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rate Limit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Rate Limit</DialogTitle>
                  <DialogDescription>
                    Set up rate limiting rules for API endpoints
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="limit-name">Rate Limit Name</Label>
                    <Input
                      id="limit-name"
                      value={newRateLimit.name}
                      onChange={(e) => setNewRateLimit({ ...newRateLimit, name: e.target.value })}
                      placeholder="Enter rate limit name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="limit-requests">Requests</Label>
                      <Input
                        id="limit-requests"
                        type="number"
                        value={newRateLimit.requests}
                        onChange={(e) => setNewRateLimit({
                          ...newRateLimit,
                          requests: parseInt(e.target.value)
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="limit-window">Time Window</Label>
                      <Select value={newRateLimit.window} onValueChange={(value) => setNewRateLimit({
                        ...newRateLimit,
                        window: value
                      })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minute">Per Minute</SelectItem>
                          <SelectItem value="hour">Per Hour</SelectItem>
                          <SelectItem value="day">Per Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="limit-description">Description</Label>
                    <Textarea
                      id="limit-description"
                      value={newRateLimit.description}
                      onChange={(e) => setNewRateLimit({ ...newRateLimit, description: e.target.value })}
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateRateLimit(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createRateLimit} disabled={!newRateLimit.name}>
                    Create Rate Limit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {rateLimits.map(limit => (
              <Card key={limit.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{limit.name}</h4>
                      <p className="text-sm text-muted-foreground">{limit.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={limit.isActive ? 'default' : 'secondary'}>
                          {limit.requests} requests per {limit.window}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={limit.isActive} />
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
