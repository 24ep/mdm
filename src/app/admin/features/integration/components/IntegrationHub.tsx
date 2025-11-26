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
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from '@/components/ui/drawer'
import { 
  Link, 
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  Eye,
  EyeOff,
  Bot,
  BarChart3,
  Shield,
  Rocket,
  Activity,
  HardDrive,
  Network,
  Plus,
  Edit,
  Trash2,
  List
} from 'lucide-react'
import toast from 'react-hot-toast'
import React from 'react'
import { IntegrationConfig, INTEGRATIONS } from './IntegrationList'

export function IntegrationHub() {
  const [platformIntegrations, setPlatformIntegrations] = useState<IntegrationConfig[]>([])
  const [aiProviders, setAiProviders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPlatformIntegration, setSelectedPlatformIntegration] = useState<IntegrationConfig | null>(null)
  const [selectedAIProvider, setSelectedAIProvider] = useState<any | null>(null)
  const [showPlatformConfigDialog, setShowPlatformConfigDialog] = useState(false)
  const [showAIConfigDialog, setShowAIConfigDialog] = useState(false)
  const [platformConfigForm, setPlatformConfigForm] = useState<Record<string, any>>({})
  const [aiConfigForm, setAiConfigForm] = useState<Record<string, any>>({})
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [showApiKey, setShowApiKey] = useState(false)
  const [showConnectionsDrawer, setShowConnectionsDrawer] = useState(false)
  const [selectedIntegrationForConnections, setSelectedIntegrationForConnections] = useState<IntegrationConfig | null>(null)
  const [connections, setConnections] = useState<any[]>([])
  const [isLoadingConnections, setIsLoadingConnections] = useState(false)
  const [showAddConnectionDialog, setShowAddConnectionDialog] = useState(false)
  const [editingConnection, setEditingConnection] = useState<any | null>(null)
  const [connectionForm, setConnectionForm] = useState<Record<string, any>>({})

  // Define integration categories by feature
  const integrationCategories = {
    'dashboard-reports': {
      name: 'Dashboard & Reports',
      icon: BarChart3,
      types: ['powerbi', 'looker', 'grafana']
    },
    'monitoring-observability': {
      name: 'Monitoring & Observability',
      icon: Activity,
      types: ['prometheus', 'grafana']
    },
    'data-governance': {
      name: 'Data Governance',
      icon: Shield,
      types: ['openmetadata', 'metadata']
    },
    'storage': {
      name: 'Storage',
      icon: HardDrive,
      types: ['minio']
    },
    'api-gateway': {
      name: 'API Gateway',
      icon: Network,
      types: ['kong']
    },
    'application-management': {
      name: 'Application Management',
      icon: Rocket,
      types: ['launchpad']
    },
    'ai-providers': {
      name: 'AI Providers',
      icon: Bot,
      types: ['ai_provider']
    }
  }

  useEffect(() => {
    loadPlatformIntegrations()
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

  const getConfigFields = (type: string) => {
    switch (type.toLowerCase()) {
      case 'openmetadata':
      case 'metadata':
        return [
          { key: 'apiUrl', label: 'API URL', type: 'text', required: true },
          { key: 'apiKey', label: 'API Key', type: 'password', required: true },
          { key: 'authType', label: 'Auth Type', type: 'select', options: ['apiKey', 'basic', 'bearer'], required: true }
        ]
      case 'servicedesk':
        return [
          { key: 'baseUrl', label: 'Base URL', type: 'text', required: true },
          { key: 'apiKey', label: 'API Key', type: 'password', required: true },
          { key: 'technicianKey', label: 'Technician Key', type: 'password', required: false }
        ]
      case 'gitlab':
        return [
          { key: 'token', label: 'Personal Access Token', type: 'password', required: true, placeholder: 'glpat-...' },
          { key: 'projectId', label: 'Project ID', type: 'text', required: true, placeholder: 'group/project or numeric ID' },
          { key: 'baseUrl', label: 'GitLab URL (optional)', type: 'text', required: false, placeholder: 'https://gitlab.com' }
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

  const handleOpenConnectionsDrawer = async (integration: IntegrationConfig) => {
    setSelectedIntegrationForConnections(integration)
    setShowConnectionsDrawer(true)
    await loadConnections(integration.id)
  }

  const loadConnections = async (integrationId: string) => {
    setIsLoadingConnections(true)
    try {
      const response = await fetch(`/api/admin/integrations/${integrationId}/connections`)
      if (response.ok) {
        const data = await response.json()
        setConnections(data.connections || [])
      } else {
        setConnections([])
      }
    } catch (error) {
      console.error('Error loading connections:', error)
      setConnections([])
    } finally {
      setIsLoadingConnections(false)
    }
  }

  const handleAddConnection = () => {
    if (!selectedIntegrationForConnections) return
    setEditingConnection(null)
    setConnectionForm({})
    setShowAddConnectionDialog(true)
  }

  const handleEditConnection = (connection: any) => {
    setEditingConnection(connection)
    setConnectionForm(connection.config || {})
    setShowAddConnectionDialog(true)
  }

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) return
    
    if (!selectedIntegrationForConnections) return
    
    try {
      setIsLoadingConnections(true)
      const response = await fetch(`/api/admin/integrations/${selectedIntegrationForConnections.id}/connections/${connectionId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Connection deleted successfully')
        await loadConnections(selectedIntegrationForConnections.id)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete connection')
      }
    } catch (error) {
      console.error('Error deleting connection:', error)
      toast.error('Failed to delete connection')
    } finally {
      setIsLoadingConnections(false)
    }
  }

  const handleSaveConnection = async () => {
    if (!selectedIntegrationForConnections) return

    try {
      setIsLoadingConnections(true)
      const url = editingConnection
        ? `/api/admin/integrations/${selectedIntegrationForConnections.id}/connections/${editingConnection.id}`
        : `/api/admin/integrations/${selectedIntegrationForConnections.id}/connections`
      
      const method = editingConnection ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: connectionForm.name || `Connection ${connections.length + 1}`,
          config: connectionForm
        })
      })

      if (response.ok) {
        toast.success(editingConnection ? 'Connection updated successfully' : 'Connection added successfully')
        setShowAddConnectionDialog(false)
        setEditingConnection(null)
        setConnectionForm({})
        await loadConnections(selectedIntegrationForConnections.id)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save connection')
      }
    } catch (error) {
      console.error('Error saving connection:', error)
      toast.error('Failed to save connection')
    } finally {
      setIsLoadingConnections(false)
    }
  }

  const handleTestConnection = async (connection: any) => {
    if (!selectedIntegrationForConnections) return

    try {
      setIsLoadingConnections(true)
      const response = await fetch(`/api/admin/integrations/${selectedIntegrationForConnections.id}/connections/${connection.id}/test`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success(`Connection "${connection.name}" test successful`)
          // Update connection status
          await loadConnections(selectedIntegrationForConnections.id)
        } else {
          toast.error(data.error || 'Connection test failed')
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Connection test failed')
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      toast.error('Connection test failed')
    } finally {
      setIsLoadingConnections(false)
    }
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


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Link className="h-6 w-6" />
            Integration Hub
          </h2>
          <p className="text-muted-foreground">
            Connect with third-party services and external APIs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            loadPlatformIntegrations()
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
              {Object.entries(integrationCategories).map(([key, category]) => {
                const Icon = category.icon
                return (
                  <TabsTrigger 
                    key={key}
                    value={key} 
                    className="w-full justify-start px-3 py-2 rounded-md hover:bg-accent transition-colors [&.text-foreground]:bg-accent [&.text-foreground]:border-r-2 [&.text-foreground]:border-r-primary [&.text-foreground]:border-b-0"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {category.name}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-8">
          {/* Filter integrations by category */}
          {(() => {
            let filteredIntegrations = platformIntegrations
            let categoryName = 'All Integrations'
            let categoryIcon = Link

            if (selectedCategory !== 'all') {
              const category = integrationCategories[selectedCategory as keyof typeof integrationCategories]
              if (category) {
                categoryName = category.name
                categoryIcon = category.icon
                filteredIntegrations = platformIntegrations.filter(integration => 
                  category.types.includes(integration.type.toLowerCase())
                )
              }
            }

            // For AI providers, show from aiProviders state
            if (selectedCategory === 'ai-providers') {
              return (
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
                                  toast(`Testing ${provider.name}...`)
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
              )
            }

            // For platform integrations
            const Icon = categoryIcon
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {categoryName}
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredIntegrations.length > 0 ? (
                    filteredIntegrations.map(integration => {
                  const IntegrationIcon = integration.icon
                  return (
                    <Card 
                      key={integration.id} 
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleOpenConnectionsDrawer(integration)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <IntegrationIcon className="h-5 w-5" />
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
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
                    })
                  ) : (
                    <Card className="col-span-full">
                      <CardContent className="p-8 text-center text-muted-foreground">
                        No integrations found in this category
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )
          })()}
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

      {/* Connections Drawer */}
      <Drawer open={showConnectionsDrawer} onOpenChange={setShowConnectionsDrawer}>
        <DrawerContent widthClassName="w-[600px]" className="bg-white">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedIntegrationForConnections && (
                  <>
                    {React.createElement(selectedIntegrationForConnections.icon, { className: "h-5 w-5" })}
                    <DrawerTitle>{selectedIntegrationForConnections.name} Connections</DrawerTitle>
                  </>
                )}
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="sm">
                  Close
                </Button>
              </DrawerClose>
            </div>
            <DrawerDescription>
              Manage service/asset connections for this integration
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="flex flex-col h-[calc(100vh-120px)]">
            <div className="p-4 border-b flex-shrink-0">
              <Button onClick={handleAddConnection} size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Connection
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              {isLoadingConnections ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No connections configured</p>
                  <p className="text-sm mt-2">Click "Add Connection" to create one</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.map((connection) => (
                    <Card key={connection.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{connection.name || `Connection ${connection.id}`}</CardTitle>
                          <div className="flex items-center gap-2">
                            {connection.status === 'active' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {connection.status === 'inactive' && <XCircle className="h-4 w-4 text-gray-500" />}
                            {connection.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {connection.config && Object.keys(connection.config).length > 0 && (
                              <div className="text-sm text-muted-foreground space-y-1">
                                {Object.entries(connection.config).slice(0, 2).map(([key, value]: [string, any]) => (
                                  <div key={key} className="truncate">
                                    <span className="font-medium">{key}:</span> {typeof value === 'string' && value.length > 30 ? value.substring(0, 30) + '...' : String(value)}
                                  </div>
                                ))}
                                {Object.keys(connection.config).length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{Object.keys(connection.config).length - 2} more fields
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestConnection(connection)}
                              disabled={isLoadingConnections}
                              title="Test Connection"
                            >
                              <Zap className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditConnection(connection)}
                              title="Edit Connection"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteConnection(connection.id)}
                              title="Delete Connection"
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Add/Edit Connection Dialog */}
      {selectedIntegrationForConnections && (
        <Dialog open={showAddConnectionDialog} onOpenChange={setShowAddConnectionDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConnection ? 'Edit Connection' : 'Add Connection'} - {selectedIntegrationForConnections.name}
              </DialogTitle>
              <DialogDescription>
                Configure connection settings for {selectedIntegrationForConnections.name}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="connection-name">Connection Name</Label>
                  <Input
                    id="connection-name"
                    value={connectionForm.name || ''}
                    onChange={(e) => setConnectionForm({ ...connectionForm, name: e.target.value })}
                    placeholder="Enter connection name"
                  />
                </div>
                {getConfigFields(selectedIntegrationForConnections.type).map(field => (
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
                          value={connectionForm[field.key] || ''}
                          onChange={(e) => setConnectionForm({ ...connectionForm, [field.key]: e.target.value })}
                          placeholder={(field as any).placeholder || `Enter ${field.label.toLowerCase()}`}
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
                        value={connectionForm[field.key] || ''}
                        onChange={(e) => setConnectionForm({ ...connectionForm, [field.key]: e.target.value })}
                        placeholder={(field as any).placeholder || `Enter ${field.label.toLowerCase()}`}
                        rows={4}
                      />
                    ) : field.type === 'select' ? (
                      <Select
                        value={connectionForm[field.key] || ''}
                        onValueChange={(value) => setConnectionForm({ ...connectionForm, [field.key]: value })}
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
                    ) : field.type === 'number' ? (
                      <Input
                        id={field.key}
                        type="number"
                        value={connectionForm[field.key] || ''}
                        onChange={(e) => setConnectionForm({ ...connectionForm, [field.key]: e.target.value })}
                        placeholder={(field as any).placeholder || `Enter ${field.label.toLowerCase()}`}
                      />
                    ) : (
                      <Input
                        id={field.key}
                        type="text"
                        value={connectionForm[field.key] || ''}
                        onChange={(e) => setConnectionForm({ ...connectionForm, [field.key]: e.target.value })}
                        placeholder={(field as any).placeholder || `Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowAddConnectionDialog(false)
                setEditingConnection(null)
                setConnectionForm({})
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveConnection} 
                disabled={isLoadingConnections}
              >
                {isLoadingConnections ? 'Saving...' : (editingConnection ? 'Update' : 'Add')} Connection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}
