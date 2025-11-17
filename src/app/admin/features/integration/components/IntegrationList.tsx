'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Zap,
  Database,
  Server,
  Activity,
  Eye,
  EyeOff,
  Link,
  BarChart3,
  Lock,
  Rocket,
  Cloud,
  Globe,
  Search,
  Webhook,
  UserCheck,
  Brain,
  Bot,
  HardDrive,
  Network,
  Gauge
} from 'lucide-react'
import toast from 'react-hot-toast'

export interface IntegrationConfig {
  id: string
  name: string
  type: string
  icon: any
  description: string
  isConfigured: boolean
  status: 'active' | 'inactive' | 'error' | 'pending'
  config?: Record<string, any>
}

// Multi-connection integrations - can have many connections/instances
// These are shown on the Integration page
export const MULTI_CONNECTION_INTEGRATIONS: Omit<IntegrationConfig, 'id' | 'isConfigured' | 'status' | 'config'>[] = [
  {
    name: 'OpenMetadata',
    type: 'openmetadata',
    icon: Database,
    description: 'Metadata management and data governance platform'
  },
  {
    name: 'Power BI',
    type: 'powerbi',
    icon: BarChart3,
    description: 'Microsoft Power BI integration for reports and dashboards'
  },
  {
    name: 'Looker',
    type: 'looker',
    icon: BarChart3,
    description: 'Looker Studio integration for analytics and reporting'
  },
  {
    name: 'Grafana',
    type: 'grafana',
    icon: Activity,
    description: 'Grafana integration for monitoring and visualization'
  },
  {
    name: 'Prometheus',
    type: 'prometheus',
    icon: Gauge,
    description: 'Prometheus integration for metrics collection and monitoring'
  },
  {
    name: 'MinIO',
    type: 'minio',
    icon: HardDrive,
    description: 'MinIO object storage integration for S3-compatible storage'
  },
  {
    name: 'Kong',
    type: 'kong',
    icon: Network,
    description: 'Kong API Gateway integration for API management and routing'
  },
  {
    name: 'Launchpad',
    type: 'launchpad',
    icon: Rocket,
    description: 'Launchpad integration for application management'
  },
  {
    name: 'OAuth Provider',
    type: 'oauth',
    icon: UserCheck,
    description: 'OAuth 2.0 authentication providers (Google, GitHub, Microsoft, etc.)'
  },
  {
    name: 'Webhook',
    type: 'webhook',
    icon: Webhook,
    description: 'Webhook integrations for event notifications and data synchronization'
  },
  {
    name: 'AI Provider',
    type: 'ai_provider',
    icon: Brain,
    description: 'AI service providers (OpenAI, Anthropic, Google AI, etc.)'
  }
]

// System config integrations - only one instance, moved to System Settings
// These are NOT shown on the Integration page
export const SYSTEM_CONFIG_INTEGRATIONS: Omit<IntegrationConfig, 'id' | 'isConfigured' | 'status' | 'config'>[] = [
  {
    name: 'Service Desk',
    type: 'servicedesk',
    icon: Server,
    description: 'Service desk integration (ManageEngine, Jira, etc.)'
  },
  {
    name: 'Vault',
    type: 'vault',
    icon: Lock,
    description: 'HashiCorp Vault for secrets management'
  },
  {
    name: 'Elasticsearch',
    type: 'elasticsearch',
    icon: Search,
    description: 'Elasticsearch integration for centralized logging and search'
  }
]

// Legacy export for backward compatibility
export const INTEGRATIONS = MULTI_CONNECTION_INTEGRATIONS

export function IntegrationList() {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([])
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [configForm, setConfigForm] = useState<Record<string, any>>({})
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/integrations/list')
      if (response.ok) {
        const data = await response.json()
        // Merge with default integrations
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
        setIntegrations(merged)
      } else {
        // If API doesn't exist, use default integrations
        const defaultIntegrations = INTEGRATIONS.map(integration => ({
          id: `default-${integration.type}`,
          ...integration,
          isConfigured: false,
          status: 'inactive' as const,
          config: {}
        }))
        setIntegrations(defaultIntegrations)
      }
    } catch (error) {
      console.error('Error loading integrations:', error)
      // Use default integrations on error
      const defaultIntegrations = INTEGRATIONS.map(integration => ({
        id: `default-${integration.type}`,
        ...integration,
        isConfigured: false,
        status: 'inactive' as const,
        config: {}
      }))
      setIntegrations(defaultIntegrations)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfigure = (integration: IntegrationConfig) => {
    setSelectedIntegration(integration)
    setConfigForm(integration.config || {})
    setShowConfigDialog(true)
  }

  const handleSaveConfig = async () => {
    if (!selectedIntegration) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/integrations/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedIntegration.name,
          type: selectedIntegration.type,
          config: configForm
        })
      })

      if (response.ok) {
        toast.success(`${selectedIntegration.name} configuration saved successfully`)
        setShowConfigDialog(false)
        loadIntegrations()
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

  const handleTestConnection = async (integration: IntegrationConfig) => {
    try {
      setIsTesting(true)
      const response = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: integration.name,
          type: integration.type,
          config: integration.config || configForm
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success(`${integration.name} connection test successful`)
          // Update status
          setIntegrations(prev => prev.map(i => 
            i.id === integration.id 
              ? { ...i, status: 'active' as const }
              : i
          ))
        } else {
          toast.error(data.error || 'Connection test failed')
          setIntegrations(prev => prev.map(i => 
            i.id === integration.id 
              ? { ...i, status: 'error' as const }
              : i
          ))
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Connection test failed')
        setIntegrations(prev => prev.map(i => 
          i.id === integration.id 
            ? { ...i, status: 'error' as const }
            : i
        ))
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      toast.error('Connection test failed')
      setIntegrations(prev => prev.map(i => 
        i.id === integration.id 
          ? { ...i, status: 'error' as const }
          : i
      ))
    } finally {
      setIsTesting(false)
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

  const getConfigFields = (type: string) => {
    switch (type.toLowerCase()) {
      case 'openmetadata':
      case 'metadata':
        return [
          { key: 'apiUrl', label: 'API URL', type: 'text', required: true },
          { key: 'apiKey', label: 'API Key', type: 'password', required: true },
          { key: 'authType', label: 'Auth Type', type: 'select', options: ['apiKey', 'basic', 'bearer'], required: true }
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
      case 'prometheus':
        return [
          { key: 'apiUrl', label: 'Prometheus URL', type: 'text', required: true, placeholder: 'http://prometheus:9090' },
          { key: 'username', label: 'Username', type: 'text', required: false },
          { key: 'password', label: 'Password', type: 'password', required: false },
          { key: 'timeout', label: 'Timeout (seconds)', type: 'number', required: false, placeholder: '30' }
        ]
      case 'minio':
        return [
          { key: 'endpoint', label: 'MinIO Endpoint', type: 'text', required: true, placeholder: 'http://minio:9000' },
          { key: 'accessKey', label: 'Access Key', type: 'text', required: true },
          { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
          { key: 'useSSL', label: 'Use SSL', type: 'select', options: ['true', 'false'], required: false },
          { key: 'region', label: 'Region', type: 'text', required: false, placeholder: 'us-east-1' },
          { key: 'bucket', label: 'Default Bucket', type: 'text', required: false }
        ]
      case 'kong':
        return [
          { key: 'adminUrl', label: 'Kong Admin API URL', type: 'text', required: true, placeholder: 'http://kong:8001' },
          { key: 'apiKey', label: 'API Key', type: 'password', required: false },
          { key: 'username', label: 'Username', type: 'text', required: false },
          { key: 'password', label: 'Password', type: 'password', required: false },
          { key: 'timeout', label: 'Timeout (seconds)', type: 'number', required: false, placeholder: '30' }
        ]
      case 'launchpad':
        return [
          { key: 'apiUrl', label: 'API URL', type: 'text', required: true },
          { key: 'apiKey', label: 'API Key', type: 'password', required: true },
          { key: 'environment', label: 'Environment', type: 'select', options: ['development', 'staging', 'production'], required: true }
        ]
      case 'oauth':
        return [
          { key: 'provider', label: 'OAuth Provider', type: 'select', options: ['google', 'github', 'microsoft', 'facebook', 'linkedin', 'twitter', 'custom'], required: true },
          { key: 'clientId', label: 'Client ID', type: 'text', required: true },
          { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
          { key: 'redirectUri', label: 'Redirect URI', type: 'text', required: true, placeholder: 'https://yourdomain.com/auth/callback' },
          { key: 'authorizationUrl', label: 'Authorization URL', type: 'text', required: false, placeholder: 'For custom providers' },
          { key: 'tokenUrl', label: 'Token URL', type: 'text', required: false, placeholder: 'For custom providers' },
          { key: 'scopes', label: 'Scopes (comma-separated)', type: 'text', required: false, placeholder: 'openid, profile, email' }
        ]
      case 'webhook':
        return [
          { key: 'name', label: 'Webhook Name', type: 'text', required: true },
          { key: 'url', label: 'Webhook URL', type: 'text', required: true, placeholder: 'https://example.com/webhook' },
          { key: 'secret', label: 'Webhook Secret', type: 'password', required: false, placeholder: 'Secret for signature verification' },
          { key: 'events', label: 'Events (comma-separated)', type: 'text', required: false, placeholder: 'user.created, data.updated' },
          { key: 'method', label: 'HTTP Method', type: 'select', options: ['POST', 'PUT', 'PATCH'], required: false },
          { key: 'headers', label: 'Custom Headers (JSON)', type: 'textarea', required: false, placeholder: '{"X-Custom-Header": "value"}' }
        ]
      case 'ai_provider':
        return [
          { key: 'provider', label: 'AI Provider', type: 'select', options: ['openai', 'anthropic', 'google', 'cohere', 'huggingface', 'custom'], required: true },
          { key: 'apiKey', label: 'API Key', type: 'password', required: true },
          { key: 'baseUrl', label: 'Base URL', type: 'text', required: false, placeholder: 'Custom API endpoint (optional)' },
          { key: 'model', label: 'Default Model', type: 'text', required: false, placeholder: 'gpt-4, claude-3, etc.' },
          { key: 'timeout', label: 'Timeout (ms)', type: 'number', required: false, placeholder: '30000' },
          { key: 'maxRetries', label: 'Max Retries', type: 'number', required: false, placeholder: '3' }
        ]
      default:
        return [
          { key: 'url', label: 'URL', type: 'text', required: true },
          { key: 'apiKey', label: 'API Key', type: 'password', required: false }
        ]
    }
  }

  const renderConfigForm = () => {
    if (!selectedIntegration) return null

    const fields = getConfigFields(selectedIntegration.type)

    return (
      <div className="space-y-4">
        {fields.map(field => (
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
                  value={configForm[field.key] || ''}
                  onChange={(e) => setConfigForm({ ...configForm, [field.key]: e.target.value })}
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
                value={configForm[field.key] || ''}
                onChange={(e) => setConfigForm({ ...configForm, [field.key]: e.target.value })}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                rows={4}
              />
            ) : field.type === 'select' ? (
              <select
                id={field.key}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={configForm[field.key] || ''}
                onChange={(e) => setConfigForm({ ...configForm, [field.key]: e.target.value })}
              >
                <option value="">Select {field.label}</option>
                {'options' in field && field.options ? field.options.map(option => (
                  <option key={option} value={option}>{option}</option>
                )) : null}
              </select>
            ) : (
              <Input
                id={field.key}
                type="text"
                value={configForm[field.key] || ''}
                onChange={(e) => setConfigForm({ ...configForm, [field.key]: e.target.value })}
                placeholder={(field as any).placeholder || `Enter ${field.label.toLowerCase()}`}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Platform Integrations</h3>
          <p className="text-sm text-muted-foreground">
            Configure and manage integrations with external services and APIs
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadIntegrations} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map(integration => {
          const Icon = integration.icon
          return (
            <Card 
              key={integration.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {integration.name}
                  </CardTitle>
                  {getStatusIcon(integration.status)}
                </div>
                <CardDescription>
                  {integration.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(integration.status)}>
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
                    onClick={() => handleConfigure(integration)}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleTestConnection(integration)}
                    disabled={isTesting || !integration.isConfigured}
                  >
                    <Zap className={`h-3 w-3 mr-1 ${isTesting ? 'animate-spin' : ''}`} />
                    Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              {selectedIntegration?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {renderConfigForm()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveConfig} 
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
            {selectedIntegration?.isConfigured && (
              <Button 
                variant="secondary"
                onClick={() => handleTestConnection(selectedIntegration)} 
                disabled={isTesting || isLoading}
              >
                <Zap className={`h-3 w-3 mr-1 ${isTesting ? 'animate-spin' : ''}`} />
                Test Connection
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

