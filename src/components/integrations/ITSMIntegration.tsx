'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CheckCircle, 
  Loader, 
  Settings, 
  ExternalLink,
  TestTube,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Map
} from 'lucide-react'
import { showError, showSuccess } from '@/lib/toast-utils'

interface ITSMConfig {
  id?: string
  name?: string
  baseUrl?: string
  provider?: string
  authType?: string
  isActive?: boolean
  isConfigured?: boolean
  customConfig?: any
}

interface ITSMIntegrationProps {
  spaceId: string
}

export function ITSMIntegration({ spaceId }: ITSMIntegrationProps) {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [config, setConfig] = useState<ITSMConfig | null>(null)
  const [formData, setFormData] = useState({
    baseUrl: '',
    provider: 'servicenow',
    authType: 'basic',
    apiKey: '',
    username: '',
    password: '',
    instanceName: '',
    name: 'ITSM Integration'
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [customEndpoints, setCustomEndpoints] = useState({
    createTicket: '',
    updateTicket: '',
    getTicket: '',
    addComment: ''
  })
  const [fieldMappings, setFieldMappings] = useState({
    status: {} as Record<string, string>,
    priority: {} as Record<string, string>
  })
  const [activeTab, setActiveTab] = useState('config')

  useEffect(() => {
    loadConfig()
  }, [spaceId])

  const loadConfig = async () => {
    try {
      const response = await fetch(`/api/integrations/itsm?space_id=${spaceId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setConfig(data.config)
          setFormData(prev => ({
            ...prev,
            baseUrl: data.config.baseUrl || '',
            provider: data.config.provider || 'servicenow',
            authType: data.config.authType || 'basic',
            instanceName: data.config.customConfig?.instanceName || '',
            name: data.config.name || 'ITSM Integration'
          }))
          if (data.config.customConfig?.customEndpoints) {
            setCustomEndpoints(data.config.customConfig.customEndpoints)
          }
          if (data.config.customConfig?.fieldMappings) {
            setFieldMappings(data.config.customConfig.fieldMappings)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load ITSM config:', error)
    }
  }

  const handleTestConnection = async () => {
    if (!formData.baseUrl) {
      showError('Please provide baseUrl to test connection')
      return
    }

    if (formData.provider === 'servicenow' && (!formData.username || !formData.password)) {
      showError('Username and password are required for ServiceNow')
      return
    }

    if (formData.provider === 'cherwell' && !formData.apiKey) {
      showError('API key is required for Cherwell')
      return
    }

    setTesting(true)
    try {
      const response = await fetch('/api/integrations/itsm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          baseUrl: formData.baseUrl,
          provider: formData.provider,
          apiKey: formData.apiKey || undefined,
          username: formData.username || undefined,
          password: formData.password || undefined,
          authType: formData.authType,
          instanceName: formData.instanceName || undefined,
          customEndpoints: Object.values(customEndpoints).some(v => v) ? customEndpoints : undefined,
          fieldMappings: Object.keys(fieldMappings.status).length > 0 || Object.keys(fieldMappings.priority).length > 0 ? fieldMappings : undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        showSuccess(result.message || 'Successfully connected to ITSM')
      } else {
        showError(result.error || 'Failed to connect to ITSM')
      }
    } catch (error) {
      showError('Failed to test connection')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!formData.baseUrl || !formData.provider) {
      showError('baseUrl and provider are required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/integrations/itsm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          baseUrl: formData.baseUrl,
          provider: formData.provider,
          apiKey: formData.apiKey || undefined,
          username: formData.username || undefined,
          password: formData.password || undefined,
          authType: formData.authType,
          instanceName: formData.instanceName || undefined,
          customEndpoints: Object.values(customEndpoints).some(v => v) ? customEndpoints : undefined,
          fieldMappings: Object.keys(fieldMappings.status).length > 0 || Object.keys(fieldMappings.priority).length > 0 ? fieldMappings : undefined,
          name: formData.name
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        showSuccess('ITSM integration configured successfully')
        await loadConfig()
      } else {
        showError(result.error || 'Failed to save configuration')
      }
    } catch (error) {
      showError('Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            ITSM Integration
          </CardTitle>
          <CardDescription>
            Connect your IT Service Management system (ServiceNow, BMC Remedy, Cherwell, or Custom)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="endpoints">Custom Endpoints</TabsTrigger>
              <TabsTrigger value="mappings">Field Mappings</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4">
              {config?.isConfigured && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    ITSM integration is configured and active
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Integration Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ITSM Integration"
                  />
                </div>

                <div>
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input
                    id="baseUrl"
                    type="url"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    placeholder="https://instance.service-now.com"
                  />
                </div>

                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) => {
                      setFormData({ ...formData, provider: value })
                      // Set default auth type based on provider
                      if (value === 'servicenow') {
                        setFormData(prev => ({ ...prev, authType: 'basic' }))
                      } else if (value === 'cherwell') {
                        setFormData(prev => ({ ...prev, authType: 'apikey' }))
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="servicenow">ServiceNow</SelectItem>
                      <SelectItem value="bmc_remedy">BMC Remedy</SelectItem>
                      <SelectItem value="cherwell">Cherwell</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.provider === 'servicenow' && (
                  <div>
                    <Label htmlFor="instanceName">Instance Name (Optional)</Label>
                    <Input
                      id="instanceName"
                      value={formData.instanceName}
                      onChange={(e) => setFormData({ ...formData, instanceName: e.target.value })}
                      placeholder="dev12345"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ServiceNow instance name (without .service-now.com)
                    </p>
                  </div>
                )}

                {formData.provider === 'servicenow' && (
                  <>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="admin"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="flex gap-2">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Enter password"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {formData.provider === 'cherwell' && (
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="apiKey"
                        type={showApiKey ? 'text' : 'password'}
                        value={formData.apiKey}
                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                        placeholder="Enter API key"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {formData.provider === 'bmc_remedy' && (
                  <>
                    <div>
                      <Label htmlFor="apiKey">API Key (or use Username/Password)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="apiKey"
                          type={showApiKey ? 'text' : 'password'}
                          value={formData.apiKey}
                          onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                          placeholder="Enter API key"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Enter username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="flex gap-2">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Enter password"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {formData.provider === 'custom' && (
                  <>
                    <div>
                      <Label htmlFor="authType">Authentication Type</Label>
                      <Select
                        value={formData.authType}
                        onValueChange={(value) => setFormData({ ...formData, authType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apikey">API Key</SelectItem>
                          <SelectItem value="basic">Basic Auth</SelectItem>
                          <SelectItem value="bearer">Bearer Token</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(formData.authType === 'apikey' || formData.authType === 'bearer') && (
                      <div>
                        <Label htmlFor="apiKey">{formData.authType === 'bearer' ? 'Bearer Token' : 'API Key'}</Label>
                        <div className="flex gap-2">
                          <Input
                            id="apiKey"
                            type={showApiKey ? 'text' : 'password'}
                            value={formData.apiKey}
                            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                            placeholder={`Enter ${formData.authType === 'bearer' ? 'bearer token' : 'API key'}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                    {formData.authType === 'basic' && (
                      <>
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="Enter username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <div className="flex gap-2">
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              placeholder="Enter password"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="endpoints" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="createTicket">Create Ticket Endpoint</Label>
                  <Input
                    id="createTicket"
                    value={customEndpoints.createTicket}
                    onChange={(e) => setCustomEndpoints({ ...customEndpoints, createTicket: e.target.value })}
                    placeholder="/api/tickets"
                  />
                </div>
                <div>
                  <Label htmlFor="updateTicket">Update Ticket Endpoint</Label>
                  <Input
                    id="updateTicket"
                    value={customEndpoints.updateTicket}
                    onChange={(e) => setCustomEndpoints({ ...customEndpoints, updateTicket: e.target.value })}
                    placeholder="/api/tickets/{id}"
                  />
                </div>
                <div>
                  <Label htmlFor="getTicket">Get Ticket Endpoint</Label>
                  <Input
                    id="getTicket"
                    value={customEndpoints.getTicket}
                    onChange={(e) => setCustomEndpoints({ ...customEndpoints, getTicket: e.target.value })}
                    placeholder="/api/tickets/{id}"
                  />
                </div>
                <div>
                  <Label htmlFor="addComment">Add Comment Endpoint</Label>
                  <Input
                    id="addComment"
                    value={customEndpoints.addComment}
                    onChange={(e) => setCustomEndpoints({ ...customEndpoints, addComment: e.target.value })}
                    placeholder="/api/tickets/{id}/comments"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to use default endpoints. Use {'{id}'} as placeholder for ticket ID.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="mappings" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Status Mappings</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Map our status values to ITSM status values
                  </p>
                  <div className="space-y-2">
                    {['BACKLOG', 'IN_PROGRESS', 'DONE', 'CANCELLED'].map(status => (
                      <div key={status} className="flex gap-2 items-center">
                        <span className="w-32 text-sm">{status}</span>
                        <Input
                          value={fieldMappings.status[status] || ''}
                          onChange={(e) => setFieldMappings({
                            ...fieldMappings,
                            status: { ...fieldMappings.status, [status]: e.target.value }
                          })}
                          placeholder="ITSM status value"
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Priority Mappings</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Map our priority values to ITSM priority values
                  </p>
                  <div className="space-y-2">
                    {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(priority => (
                      <div key={priority} className="flex gap-2 items-center">
                        <span className="w-32 text-sm">{priority}</span>
                        <Input
                          value={fieldMappings.priority[priority] || ''}
                          onChange={(e) => setFieldMappings({
                            ...fieldMappings,
                            priority: { ...fieldMappings.priority, [priority]: e.target.value }
                          })}
                          placeholder="ITSM priority value"
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleTestConnection}
              disabled={testing || !formData.baseUrl}
              variant="outline"
            >
              {testing ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !formData.baseUrl}
            >
              {loading ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Configuration
            </Button>
            {config?.isConfigured && config.baseUrl && (
              <Button
                variant="outline"
                onClick={() => window.open(config.baseUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open ITSM
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

