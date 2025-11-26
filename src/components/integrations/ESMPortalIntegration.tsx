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
  Trash2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ESMPortalConfig {
  id?: string
  name?: string
  baseUrl?: string
  authType?: string
  isActive?: boolean
  isConfigured?: boolean
  customConfig?: any
}

interface ESMPortalIntegrationProps {
  spaceId: string
}

export function ESMPortalIntegration({ spaceId }: ESMPortalIntegrationProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [config, setConfig] = useState<ESMPortalConfig | null>(null)
  const [formData, setFormData] = useState({
    baseUrl: '',
    authType: 'apikey',
    apiKey: '',
    username: '',
    password: '',
    name: 'ESM Portal Integration'
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' }
  ])

  useEffect(() => {
    loadConfig()
  }, [spaceId])

  const loadConfig = async () => {
    try {
      const response = await fetch(`/api/integrations/esm-portal?space_id=${spaceId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setConfig(data.config)
          setFormData(prev => ({
            ...prev,
            baseUrl: data.config.baseUrl || '',
            authType: data.config.authType || 'apikey',
            name: data.config.name || 'ESM Portal Integration'
          }))
          if (data.config.customConfig?.customHeaders) {
            const headers = Object.entries(data.config.customConfig.customHeaders).map(([key, value]) => ({
              key,
              value: value as string
            }))
            setCustomHeaders(headers.length > 0 ? headers : [{ key: '', value: '' }])
          }
        }
      }
    } catch (error) {
      console.error('Failed to load ESM Portal config:', error)
    }
  }

  const handleTestConnection = async () => {
    if (!formData.baseUrl) {
      toast({
        title: 'Validation Error',
        description: 'Please provide baseUrl to test connection',
        variant: 'destructive'
      })
      return
    }

    if (formData.authType === 'apikey' && !formData.apiKey) {
      toast({
        title: 'Validation Error',
        description: 'API key is required for API key authentication',
        variant: 'destructive'
      })
      return
    }

    if (formData.authType === 'basic' && (!formData.username || !formData.password)) {
      toast({
        title: 'Validation Error',
        description: 'Username and password are required for basic authentication',
        variant: 'destructive'
      })
      return
    }

    setTesting(true)
    try {
      const headersObj: Record<string, string> = {}
      customHeaders.forEach(h => {
        if (h.key && h.value) {
          headersObj[h.key] = h.value
        }
      })

      const response = await fetch('/api/integrations/esm-portal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          baseUrl: formData.baseUrl,
          apiKey: formData.apiKey || undefined,
          username: formData.username || undefined,
          password: formData.password || undefined,
          authType: formData.authType,
          customHeaders: headersObj
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Connection Successful',
          description: result.message || 'Successfully connected to ESM Portal',
        })
      } else {
        toast({
          title: 'Connection Failed',
          description: result.error || 'Failed to connect to ESM Portal',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test connection',
        variant: 'destructive'
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!formData.baseUrl) {
      toast({
        title: 'Validation Error',
        description: 'baseUrl is required',
        variant: 'destructive'
      })
      return
    }

    if (formData.authType === 'apikey' && !formData.apiKey) {
      toast({
        title: 'Validation Error',
        description: 'API key is required for API key authentication',
        variant: 'destructive'
      })
      return
    }

    if (formData.authType === 'basic' && (!formData.username || !formData.password)) {
      toast({
        title: 'Validation Error',
        description: 'Username and password are required for basic authentication',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const headersObj: Record<string, string> = {}
      customHeaders.forEach(h => {
        if (h.key && h.value) {
          headersObj[h.key] = h.value
        }
      })

      const response = await fetch('/api/integrations/esm-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          baseUrl: formData.baseUrl,
          apiKey: formData.apiKey || undefined,
          username: formData.username || undefined,
          password: formData.password || undefined,
          authType: formData.authType,
          customHeaders: headersObj,
          name: formData.name
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Configuration Saved',
          description: 'ESM Portal integration configured successfully',
        })
        await loadConfig()
      } else {
        toast({
          title: 'Configuration Failed',
          description: result.error || 'Failed to save configuration',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const addCustomHeader = () => {
    setCustomHeaders([...customHeaders, { key: '', value: '' }])
  }

  const removeCustomHeader = (index: number) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== index))
  }

  const updateCustomHeader = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...customHeaders]
    updated[index] = { ...updated[index], [field]: value }
    setCustomHeaders(updated)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            ESM Portal Integration
          </CardTitle>
          <CardDescription>
            Connect your ESM Portal instance to sync tickets and requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config?.isConfigured && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ESM Portal integration is configured and active
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
                placeholder="ESM Portal Integration"
              />
            </div>

            <div>
              <Label htmlFor="baseUrl">ESM Portal Base URL</Label>
              <Input
                id="baseUrl"
                type="url"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder="https://esm-portal.company.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your ESM Portal instance URL
              </p>
            </div>

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

            {formData.authType === 'apikey' && (
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="Enter your API key"
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

            {formData.authType === 'bearer' && (
              <div>
                <Label htmlFor="apiKey">Bearer Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="Enter bearer token"
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

            <div>
              <Label>Custom Headers (Optional)</Label>
              <div className="space-y-2">
                {customHeaders.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Header name"
                      value={header.key}
                      onChange={(e) => updateCustomHeader(index, 'key', e.target.value)}
                    />
                    <Input
                      placeholder="Header value"
                      value={header.value}
                      onChange={(e) => updateCustomHeader(index, 'value', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeCustomHeader(index)}
                      disabled={customHeaders.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomHeader}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Header
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Add custom HTTP headers if required by your ESM Portal API
              </p>
            </div>
          </div>

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
                Open ESM Portal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

