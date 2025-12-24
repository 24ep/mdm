'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Cloud, 
  Database, 
  Server, 
  Upload, 
  Download, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Eye,
  Trash2,
  Plus,
  Edit,
  Key,
  Globe,
  HardDrive,
  Cpu,
  MemoryStick
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface CloudIntegrationProps {
  onConnect?: (config: CloudConfig) => void
  onDisconnect?: (configId: string) => void
  onSync?: (configId: string) => void
  onDeploy?: (config: DeploymentConfig) => void
}

interface CloudConfig {
  id: string
  name: string
  type: 'aws' | 'gcp' | 'azure' | 'databricks' | 'snowflake'
  region: string
  status: 'connected' | 'disconnected' | 'error'
  credentials: {
    accessKey?: string
    secretKey?: string
    token?: string
    endpoint?: string
  }
  resources: CloudResource[]
  createdAt: Date
  lastSync?: Date
}

interface CloudResource {
  id: string
  name: string
  type: 'compute' | 'storage' | 'database' | 'ml' | 'notebook'
  status: 'running' | 'stopped' | 'error'
  size?: string
  cost?: number
  lastUsed?: Date
}

interface DeploymentConfig {
  id: string
  name: string
  cloudConfigId: string
  notebookId: string
  environment: 'development' | 'staging' | 'production'
  resources: {
    cpu: string
    memory: string
    storage: string
    gpu?: string
  }
  autoScaling: boolean
  status: 'deployed' | 'deploying' | 'failed' | 'stopped'
  url?: string
  createdAt: Date
}

export function CloudIntegration({ 
  onConnect,
  onDisconnect,
  onSync,
  onDeploy
}: CloudIntegrationProps) {
  const [activeTab, setActiveTab] = useState<'connections' | 'resources' | 'deployments' | 'settings'>('connections')
  const [cloudConfigs, setCloudConfigs] = useState<CloudConfig[]>([])
  const [deployments, setDeployments] = useState<DeploymentConfig[]>([])
  const [newConfig, setNewConfig] = useState<Partial<CloudConfig>>({
    name: '',
    type: 'aws',
    region: 'us-east-1',
    credentials: {}
  })
  const [showCredentials, setShowCredentials] = useState(false)

  const cloudTypes = [
    { 
      type: 'aws', 
      label: 'Amazon Web Services', 
      description: 'AWS S3, EC2, SageMaker',
      icon: '☁️',
      regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']
    },
    { 
      type: 'gcp', 
      label: 'Google Cloud Platform', 
      description: 'GCS, Compute Engine, AI Platform',
      icon: '🔵',
      regions: ['us-central1', 'us-east1', 'europe-west1', 'asia-southeast1']
    },
    { 
      type: 'azure', 
      label: 'Microsoft Azure', 
      description: 'Blob Storage, VMs, ML Studio',
      icon: '🔷',
      regions: ['eastus', 'westus2', 'westeurope', 'southeastasia']
    },
    { 
      type: 'databricks', 
      label: 'Databricks', 
      description: 'Unified Analytics Platform',
      icon: '🔶',
      regions: ['us-east-1', 'us-west-2', 'eu-west-1']
    },
    { 
      type: 'snowflake', 
      label: 'Snowflake', 
      description: 'Cloud Data Platform',
      icon: '❄️',
      regions: ['us-east-1', 'us-west-2', 'eu-west-1']
    }
  ]

  useEffect(() => {
    // Initialize with mock data
    setCloudConfigs([
      {
        id: 'config-1',
        name: 'AWS Production',
        type: 'aws',
        region: 'us-east-1',
        status: 'connected',
        credentials: {
          accessKey: 'AKIA***',
          endpoint: 'https://s3.amazonaws.com'
        },
        resources: [
          {
            id: 's3-bucket-1',
            name: 'data-science-bucket',
            type: 'storage',
            status: 'running',
            size: '2.5 TB',
            cost: 45.50,
            lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000)
          },
          {
            id: 'ec2-instance-1',
            name: 'ml-training-instance',
            type: 'compute',
            status: 'running',
            size: 'm5.xlarge',
            cost: 120.00,
            lastUsed: new Date(Date.now() - 30 * 60 * 1000)
          },
          {
            id: 'sagemaker-1',
            name: 'model-endpoint',
            type: 'ml',
            status: 'running',
            size: 'ml.m5.large',
            cost: 85.00,
            lastUsed: new Date(Date.now() - 5 * 60 * 1000)
          }
        ],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'config-2',
        name: 'GCP Development',
        type: 'gcp',
        region: 'us-central1',
        status: 'connected',
        credentials: {
          accessKey: 'GOOG***',
          endpoint: 'https://storage.googleapis.com'
        },
        resources: [
          {
            id: 'gcs-bucket-1',
            name: 'dev-data-bucket',
            type: 'storage',
            status: 'running',
            size: '850 GB',
            cost: 25.30,
            lastUsed: new Date(Date.now() - 4 * 60 * 60 * 1000)
          }
        ],
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        lastSync: new Date(Date.now() - 4 * 60 * 60 * 1000)
      }
    ])

    setDeployments([
      {
        id: 'deploy-1',
        name: 'Sales Analysis API',
        cloudConfigId: 'config-1',
        notebookId: 'notebook-1',
        environment: 'production',
        resources: {
          cpu: '2 cores',
          memory: '8 GB',
          storage: '50 GB',
          gpu: '1x T4'
        },
        autoScaling: true,
        status: 'deployed',
        url: 'https://api.example.com/sales-analysis',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'deploy-2',
        name: 'ML Model Service',
        cloudConfigId: 'config-1',
        notebookId: 'notebook-2',
        environment: 'staging',
        resources: {
          cpu: '1 core',
          memory: '4 GB',
          storage: '20 GB'
        },
        autoScaling: false,
        status: 'deploying',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ])
  }, [])

  const handleConnect = () => {
    if (!newConfig.name?.trim()) {
      toast.error('Please enter a configuration name')
      return
    }

    const config: CloudConfig = {
      id: `config-${Date.now()}`,
      name: newConfig.name,
      type: newConfig.type!,
      region: newConfig.region!,
      status: 'connected',
      credentials: newConfig.credentials!,
      resources: [],
      createdAt: new Date()
    }

    setCloudConfigs(prev => [config, ...prev])
    onConnect?.(config)
    setNewConfig({
      name: '',
      type: 'aws',
      region: 'us-east-1',
      credentials: {}
    })
    toast.success('Cloud configuration connected successfully')
  }

  const handleDisconnect = (configId: string) => {
    setCloudConfigs(prev => prev.map(config => 
      config.id === configId ? { ...config, status: 'disconnected' } : config
    ))
    onDisconnect?.(configId)
    toast.success('Cloud configuration disconnected')
  }

  const handleSync = (configId: string) => {
    setCloudConfigs(prev => prev.map(config => 
      config.id === configId ? { ...config, lastSync: new Date() } : config
    ))
    onSync?.(configId)
    toast.success('Resources synced successfully')
  }

  const handleDeploy = (deployment: DeploymentConfig) => {
    setDeployments(prev => [deployment, ...prev])
    onDeploy?.(deployment)
    toast.success('Deployment started successfully')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'disconnected': return <AlertCircle className="h-4 w-4 text-gray-500" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50 dark:bg-green-950/30'
      case 'disconnected': return 'text-gray-600 bg-gray-50 dark:bg-gray-950/30'
      case 'error': return 'text-red-600 bg-red-50 dark:bg-red-950/30'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950/30'
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'compute': return <Cpu className="h-4 w-4" />
      case 'storage': return <HardDrive className="h-4 w-4" />
      case 'database': return <Database className="h-4 w-4" />
      case 'ml': return <Server className="h-4 w-4" />
      case 'notebook': return <Globe className="h-4 w-4" />
      default: return <Cloud className="h-4 w-4" />
    }
  }

  const getDeploymentStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'deploying': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'stopped': return <AlertCircle className="h-4 w-4 text-gray-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getCloudTypeInfo = (type: string) => {
    return cloudTypes.find(ct => ct.type === type) || cloudTypes[0]
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Cloud className="h-5 w-5 mr-2" />
                  Cloud Connections ({cloudConfigs.length})
                </CardTitle>
                <Button onClick={() => setActiveTab('settings')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Connection
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cloudConfigs.map(config => {
                  const cloudType = getCloudTypeInfo(config.type)
                  return (
                    <div key={config.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-2xl">{cloudType.icon}</span>
                            <h3 className="font-medium">{config.name}</h3>
                            <Badge variant="outline" className={getStatusColor(config.status)}>
                              {getStatusIcon(config.status)}
                              <span className="ml-1">{config.status}</span>
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {cloudType.label} • {config.region}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                              <span className="font-medium">Resources:</span> {config.resources.length}
                            </div>
                            <div>
                              <span className="font-medium">Created:</span> {config.createdAt.toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">Last Sync:</span> {config.lastSync?.toLocaleString() || 'Never'}
                            </div>
                            <div>
                              <span className="font-medium">Total Cost:</span> ${config.resources.reduce((sum, r) => sum + (r.cost || 0), 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(config.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Sync
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCredentials(!showCredentials)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(config.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {showCredentials && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <h4 className="font-medium mb-2">Credentials</h4>
                          <div className="space-y-1 text-sm">
                            <div>Access Key: {config.credentials.accessKey}</div>
                            <div>Endpoint: {config.credentials.endpoint}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2" />
                Cloud Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cloudConfigs.map(config => 
                  config.resources.map(resource => (
                    <div key={resource.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getResourceIcon(resource.type)}
                            <h3 className="font-medium">{resource.name}</h3>
                            <Badge variant="outline" className={getStatusColor(resource.status)}>
                              {getStatusIcon(resource.status)}
                              <span className="ml-1">{resource.status}</span>
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {resource.type}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                              <span className="font-medium">Size:</span> {resource.size || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Cost:</span> ${resource.cost?.toFixed(2) || '0.00'}/month
                            </div>
                            <div>
                              <span className="font-medium">Last Used:</span> {resource.lastUsed?.toLocaleString() || 'Never'}
                            </div>
                            <div>
                              <span className="font-medium">Config:</span> {config.name}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Deployments ({deployments.length})
                </CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Deploy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deployments.map(deployment => (
                  <div key={deployment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{deployment.name}</h3>
                          <Badge variant="outline" className={getStatusColor(deployment.status)}>
                            {getDeploymentStatusIcon(deployment.status)}
                            <span className="ml-1">{deployment.status}</span>
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {deployment.environment}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Notebook: {deployment.notebookId} • Environment: {deployment.environment}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium">CPU:</span> {deployment.resources.cpu}
                          </div>
                          <div>
                            <span className="font-medium">Memory:</span> {deployment.resources.memory}
                          </div>
                          <div>
                            <span className="font-medium">Storage:</span> {deployment.resources.storage}
                          </div>
                          <div>
                            <span className="font-medium">Auto-scaling:</span> {deployment.autoScaling ? 'Yes' : 'No'}
                          </div>
                        </div>
                        
                        {deployment.url && (
                          <div className="mt-2">
                            <a 
                              href={deployment.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              {deployment.url}
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Add Cloud Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="configName">Configuration Name</Label>
                  <Input
                    id="configName"
                    placeholder="My AWS Account"
                    value={newConfig.name || ''}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="cloudType">Cloud Provider</Label>
                  <Select value={newConfig.type} onValueChange={(value) => setNewConfig(prev => ({ ...prev, type: value as any }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cloud provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {cloudTypes.map(cloud => (
                        <SelectItem key={cloud.type} value={cloud.type}>
                          <div className="flex items-center space-x-2">
                            <span>{cloud.icon}</span>
                            <div>
                              <div className="font-medium">{cloud.label}</div>
                              <div className="text-sm text-gray-500">{cloud.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="region">Region</Label>
                <Select value={newConfig.region} onValueChange={(value) => setNewConfig(prev => ({ ...prev, region: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCloudTypeInfo(newConfig.type || 'aws').regions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accessKey">Access Key</Label>
                    <Input
                      id="accessKey"
                      type="password"
                      placeholder="Enter access key"
                      value={newConfig.credentials?.accessKey || ''}
                      onChange={(e) => setNewConfig(prev => ({
                        ...prev,
                        credentials: { ...prev.credentials!, accessKey: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="secretKey">Secret Key</Label>
                    <Input
                      id="secretKey"
                      type="password"
                      placeholder="Enter secret key"
                      value={newConfig.credentials?.secretKey || ''}
                      onChange={(e) => setNewConfig(prev => ({
                        ...prev,
                        credentials: { ...prev.credentials!, secretKey: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="endpoint">Endpoint (Optional)</Label>
                  <Input
                    id="endpoint"
                    placeholder="https://s3.amazonaws.com"
                    value={newConfig.credentials?.endpoint || ''}
                    onChange={(e) => setNewConfig(prev => ({
                      ...prev,
                      credentials: { ...prev.credentials!, endpoint: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <Button onClick={handleConnect} disabled={!newConfig.name?.trim() || !newConfig.credentials?.accessKey}>
                <Cloud className="h-4 w-4 mr-2" />
                Connect to Cloud
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
