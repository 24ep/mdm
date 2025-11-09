'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { 
  Server,
  Plus,
  Edit,
  Trash2,
  Play,
  Square,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Settings,
  Terminal,
  Code,
  Database,
  FileCode,
  Zap,
  Monitor,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Shield,
  Key,
  Globe,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Download,
  Upload,
  Copy,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle2,
  Loader2,
  Power,
  PowerOff,
  RotateCcw,
  Save,
  Search,
  Filter,
  MoreHorizontal,
  Users,
  MessageSquare,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Maximize,
  Minimize2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { KernelSetupGuide } from '../../../components/KernelSetupGuide'
import { KernelServer, KernelTemplate } from '../types'

export function KernelManagement() {
  const [kernels, setKernels] = useState<KernelServer[]>([])
  const [templates, setTemplates] = useState<KernelTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddKernel, setShowAddKernel] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const [selectedKernel, setSelectedKernel] = useState<KernelServer | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterLanguage, setFilterLanguage] = useState<string>('all')

  // Mock data - replace with actual API calls
  useEffect(() => {
    loadKernels()
    loadTemplates()
  }, [])

  const loadKernels = async () => {
    setIsLoading(true)
    try {
      // Mock kernel data
      const mockKernels: KernelServer[] = [
        {
          id: 'kernel-1',
          name: 'Python 3.11 Server',
          host: 'localhost',
          port: 8888,
          protocol: 'http',
          status: 'online',
          language: 'python',
          version: '3.11.0',
          description: 'Main Python kernel server for data science',
          maxConnections: 100,
          currentConnections: 15,
          cpuUsage: 25.5,
          memoryUsage: 45.2,
          diskUsage: 12.8,
          lastSeen: new Date(),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date(),
          isPublic: false,
          authentication: {
            type: 'token',
            token: 'kernel-token-123'
          },
          environment: {
            python: '3.11.0',
            node: '18.17.0'
          },
          packages: ['pandas', 'numpy', 'matplotlib', 'scikit-learn', 'jupyter'],
          capabilities: ['code_execution', 'data_visualization', 'ml_training'],
          healthCheck: {
            enabled: true,
            interval: 30,
            timeout: 10,
            endpoint: '/health'
          },
          logs: {
            enabled: true,
            level: 'info',
            maxSize: 100,
            retention: 7
          }
        },
        {
          id: 'kernel-2',
          name: 'R 4.3 Server',
          host: '192.168.1.100',
          port: 8889,
          protocol: 'http',
          status: 'online',
          language: 'r',
          version: '4.3.0',
          description: 'R kernel server for statistical analysis',
          maxConnections: 50,
          currentConnections: 8,
          cpuUsage: 18.3,
          memoryUsage: 32.1,
          diskUsage: 8.5,
          lastSeen: new Date(),
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date(),
          isPublic: true,
          authentication: {
            type: 'basic',
            username: 'ruser',
            password: 'rpass123'
          },
          environment: {
            r: '4.3.0'
          },
          packages: ['ggplot2', 'dplyr', 'tidyr', 'shiny', 'rmarkdown'],
          capabilities: ['code_execution', 'statistical_analysis', 'reporting'],
          healthCheck: {
            enabled: true,
            interval: 60,
            timeout: 15,
            endpoint: '/health'
          },
          logs: {
            enabled: true,
            level: 'warn',
            maxSize: 50,
            retention: 14
          }
        },
        {
          id: 'kernel-3',
          name: 'Julia 1.9 Server',
          host: 'kernel.example.com',
          port: 8890,
          protocol: 'https',
          status: 'offline',
          language: 'julia',
          version: '1.9.0',
          description: 'Julia kernel for high-performance computing',
          maxConnections: 200,
          currentConnections: 0,
          cpuUsage: 0,
          memoryUsage: 0,
          diskUsage: 15.2,
          lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date(),
          isPublic: false,
          authentication: {
            type: 'oauth',
            clientId: 'julia-client',
            clientSecret: 'julia-secret'
          },
          environment: {
            julia: '1.9.0'
          },
          packages: ['Plots', 'DataFrames', 'Flux', 'DifferentialEquations'],
          capabilities: ['code_execution', 'hpc_computing', 'scientific_computing'],
          healthCheck: {
            enabled: true,
            interval: 120,
            timeout: 30,
            endpoint: '/health'
          },
          logs: {
            enabled: true,
            level: 'error',
            maxSize: 200,
            retention: 30
          }
        }
      ]
      
      setKernels(mockKernels)
    } catch (error) {
      toast.error('Failed to load kernel servers')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const mockTemplates: KernelTemplate[] = [
        {
          id: 'template-python',
          name: 'Python Data Science',
          language: 'python',
          description: 'Complete Python environment for data science',
          dockerImage: 'jupyter/scipy-notebook:latest',
          requirements: ['pandas', 'numpy', 'matplotlib', 'seaborn', 'scikit-learn', 'plotly'],
          environment: {
            'PYTHON_VERSION': '3.11',
            'JUPYTER_ENABLE_LAB': 'yes'
          },
          startupScript: '#!/bin/bash\npip install -r requirements.txt\njupyter lab --ip=0.0.0.0 --port=8888 --no-browser --allow-root',
          healthCheck: 'curl -f http://localhost:8888/health || exit 1',
          documentation: 'Python data science kernel with popular ML libraries'
        },
        {
          id: 'template-r',
          name: 'R Statistical Analysis',
          language: 'r',
          description: 'R environment for statistical analysis and reporting',
          dockerImage: 'rocker/rstudio:latest',
          requirements: ['ggplot2', 'dplyr', 'tidyr', 'shiny', 'rmarkdown', 'knitr'],
          environment: {
            'R_VERSION': '4.3',
            'RSTUDIO_VERSION': '2023.09'
          },
          startupScript: '#!/bin/bash\nR -e "install.packages(c(\'ggplot2\', \'dplyr\', \'tidyr\'))"\nrstudio-server start',
          healthCheck: 'curl -f http://localhost:8787/health || exit 1',
          documentation: 'R statistical computing environment with visualization libraries'
        },
        {
          id: 'template-julia',
          name: 'Julia High Performance',
          language: 'julia',
          description: 'Julia environment for high-performance computing',
          dockerImage: 'julia:1.9-bullseye',
          requirements: ['Plots', 'DataFrames', 'Flux', 'DifferentialEquations', 'JuMP'],
          environment: {
            'JULIA_VERSION': '1.9',
            'JULIA_PKG_SERVER': 'https://pkg.julialang.org'
          },
          startupScript: '#!/bin/bash\njulia -e "using Pkg; Pkg.add([\\"Plots\\", \\"DataFrames\\", \\"Flux\\"])"\njulia --project=. -e "using Pluto; Pluto.run()"',
          healthCheck: 'julia -e "println(\\"Julia is running\\")" || exit 1',
          documentation: 'Julia high-performance computing environment'
        },
        {
          id: 'template-node',
          name: 'Node.js Data Processing',
          language: 'javascript',
          description: 'Node.js environment for data processing and visualization',
          dockerImage: 'node:18-bullseye',
          requirements: ['d3', 'plotly', 'lodash', 'moment', 'csv-parser'],
          environment: {
            'NODE_VERSION': '18',
            'NPM_CONFIG_LOGLEVEL': 'info'
          },
          startupScript: '#!/bin/bash\nnpm install\nexec node server.js',
          healthCheck: 'curl -f http://localhost:3000/health || exit 1',
          documentation: 'Node.js environment for data processing and web-based visualizations'
        }
      ]
      
      setTemplates(mockTemplates)
    } catch (error) {
      toast.error('Failed to load kernel templates')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'offline': return <XCircle className="h-4 w-4 text-gray-400" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'starting': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'stopping': return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800'
      case 'offline': return 'bg-gray-100 text-gray-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'starting': return 'bg-blue-100 text-blue-800'
      case 'stopping': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLanguageIcon = (language: string) => {
    switch (language) {
      case 'python': return <FileCode className="h-4 w-4 text-blue-500" />
      case 'r': return <FileCode className="h-4 w-4 text-purple-500" />
      case 'julia': return <FileCode className="h-4 w-4 text-red-500" />
      case 'javascript': return <Code className="h-4 w-4 text-yellow-500" />
      case 'sql': return <Database className="h-4 w-4 text-green-500" />
      default: return <Code className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredKernels = kernels.filter(kernel => {
    const matchesSearch = kernel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         kernel.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         kernel.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || kernel.status === filterStatus
    const matchesLanguage = filterLanguage === 'all' || kernel.language === filterLanguage
    
    return matchesSearch && matchesStatus && matchesLanguage
  })

  const startKernel = async (kernelId: string) => {
    try {
      setKernels(prev => prev.map(k => 
        k.id === kernelId ? { ...k, status: 'starting' } : k
      ))
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setKernels(prev => prev.map(k => 
        k.id === kernelId ? { ...k, status: 'online', lastSeen: new Date() } : k
      ))
      
      toast.success('Kernel server started successfully')
    } catch (error) {
      setKernels(prev => prev.map(k => 
        k.id === kernelId ? { ...k, status: 'error' } : k
      ))
      toast.error('Failed to start kernel server')
    }
  }

  const stopKernel = async (kernelId: string) => {
    try {
      setKernels(prev => prev.map(k => 
        k.id === kernelId ? { ...k, status: 'stopping' } : k
      ))
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setKernels(prev => prev.map(k => 
        k.id === kernelId ? { ...k, status: 'offline', currentConnections: 0 } : k
      ))
      
      toast.success('Kernel server stopped successfully')
    } catch (error) {
      setKernels(prev => prev.map(k => 
        k.id === kernelId ? { ...k, status: 'error' } : k
      ))
      toast.error('Failed to stop kernel server')
    }
  }

  const restartKernel = async (kernelId: string) => {
    try {
      await stopKernel(kernelId)
      await new Promise(resolve => setTimeout(resolve, 1000))
      await startKernel(kernelId)
      toast.success('Kernel server restarted successfully')
    } catch (error) {
      toast.error('Failed to restart kernel server')
    }
  }

  const deleteKernel = async (kernelId: string) => {
    if (!confirm('Are you sure you want to delete this kernel server?')) return
    
    try {
      setKernels(prev => prev.filter(k => k.id !== kernelId))
      toast.success('Kernel server deleted successfully')
    } catch (error) {
      toast.error('Failed to delete kernel server')
    }
  }

  const testConnection = async (kernelId: string) => {
    const kernel = kernels.find(k => k.id === kernelId)
    if (!kernel) return
    
    try {
      toast.loading('Testing connection...')
      
      // Mock connection test
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.dismiss()
      toast.success(`Connection to ${kernel.name} successful`)
    } catch (error) {
      toast.dismiss()
      toast.error('Connection test failed')
    }
  }

  const copyConnectionString = (kernel: KernelServer) => {
    const connectionString = `${kernel.protocol}://${kernel.host}:${kernel.port}`
    navigator.clipboard.writeText(connectionString)
    toast.success('Connection string copied to clipboard')
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Server className="h-6 w-6" />
            Kernel Management
          </h2>
          <p className="text-muted-foreground">
            Manage remote kernel servers for notebook execution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSetupGuide(true)}>
            <BookOpen className="h-4 w-4 mr-2" />
            Setup Guide
          </Button>
          <Button variant="outline" size="sm" onClick={loadKernels} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAddKernel(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Kernel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total Kernels</span>
            </div>
            <div className="text-2xl font-bold mt-1">{kernels.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Online</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {kernels.filter(k => k.status === 'online').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Active Connections</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {kernels.reduce((sum, k) => sum + k.currentConnections, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Avg CPU Usage</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {Math.round(kernels.reduce((sum, k) => sum + k.cpuUsage, 0) / kernels.length || 0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="kernels" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kernels">Kernel Servers</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="kernels" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search kernels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterLanguage} onValueChange={setFilterLanguage}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="r">R</SelectItem>
                <SelectItem value="julia">Julia</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kernel List */}
          <div className="space-y-4">
            {filteredKernels.map((kernel) => (
              <Card key={kernel.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getLanguageIcon(kernel.language)}
                      <div>
                        <CardTitle className="text-lg">{kernel.name}</CardTitle>
                        <CardDescription>
                          {kernel.host}:{kernel.port} • {kernel.language} {kernel.version}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(kernel.status)}>
                        {getStatusIcon(kernel.status)}
                        <span className="ml-1 capitalize">{kernel.status}</span>
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => testConnection(kernel.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Network className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyConnectionString(kernel)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {kernel.status === 'online' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => stopKernel(kernel.id)}
                            className="h-8 w-8 p-0"
                          >
                            <PowerOff className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startKernel(kernel.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => restartKernel(kernel.id)}
                          className="h-8 w-8 p-0"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedKernel(kernel)}
                          className="h-8 w-8 p-0"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteKernel(kernel.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Connections</div>
                      <div className="text-lg font-semibold">
                        {kernel.currentConnections}/{kernel.maxConnections}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">CPU Usage</div>
                      <div className="text-lg font-semibold">{kernel.cpuUsage}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Memory</div>
                      <div className="text-lg font-semibold">{kernel.memoryUsage}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Last Seen</div>
                      <div className="text-lg font-semibold">
                        {kernel.lastSeen.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  {kernel.description && (
                    <div className="mt-3 text-sm text-gray-600">
                      {kernel.description}
                    </div>
                  )}
                  
                  <div className="mt-3 flex flex-wrap gap-1">
                    {kernel.packages.slice(0, 5).map((pkg) => (
                      <Badge key={pkg} variant="secondary" className="text-xs">
                        {pkg}
                      </Badge>
                    ))}
                    {kernel.packages.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{kernel.packages.length - 5} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Kernel Templates</h3>
            <Button onClick={() => setShowTemplates(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {getLanguageIcon(template.language)}
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Docker Image:</span> {template.dockerImage}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Requirements:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.requirements.map((req) => (
                          <Badge key={req} variant="outline" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Documentation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <h3 className="text-lg font-semibold">System Monitoring</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Resource Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {kernels.map((kernel) => (
                    <div key={kernel.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{kernel.name}</span>
                        <span className="text-sm text-gray-500">{kernel.cpuUsage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${kernel.cpuUsage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {kernels.map((kernel) => (
                    <div key={kernel.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(kernel.status)}
                        <span className="text-sm font-medium">{kernel.name}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {kernel.currentConnections}/{kernel.maxConnections}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <h3 className="text-lg font-semibold">Global Settings</h3>
          
          <Card>
            <CardHeader>
              <CardTitle>Kernel Management Settings</CardTitle>
              <CardDescription>
                Configure global settings for kernel management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-health-check">Auto Health Check</Label>
                  <p className="text-sm text-gray-500">Automatically monitor kernel health</p>
                </div>
                <Switch id="auto-health-check" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-restart">Auto Restart Failed Kernels</Label>
                  <p className="text-sm text-gray-500">Automatically restart kernels that fail health checks</p>
                </div>
                <Switch id="auto-restart" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="log-retention">Log Retention (days)</Label>
                  <p className="text-sm text-gray-500">How long to keep kernel logs</p>
                </div>
                <Input type="number" defaultValue="30" className="w-20" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Setup Guide Modal */}
      {showSetupGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-lg">
            <KernelSetupGuide onClose={() => setShowSetupGuide(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
