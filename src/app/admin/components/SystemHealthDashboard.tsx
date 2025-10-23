'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Heart, 
  Server, 
  Database, 
  Globe, 
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Activity,
  Zap,
  Monitor,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Loader,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface HealthStatus {
  service: string
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  uptime: number
  responseTime: number
  lastCheck: Date
  errorRate: number
  dependencies: string[]
}

interface SystemMetrics {
  timestamp: Date
  cpu: number
  memory: number
  disk: number
  network: number
  loadAverage: number
  activeConnections: number
  requestsPerSecond: number
}

interface ServiceDependency {
  name: string
  type: 'database' | 'api' | 'cache' | 'storage' | 'external'
  status: 'up' | 'down' | 'degraded'
  responseTime: number
  lastCheck: Date
  healthCheckUrl?: string
}

interface Alert {
  id: string
  service: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  timestamp: Date
  resolved: boolean
}

export function SystemHealthDashboard() {
  const [healthStatuses, setHealthStatuses] = useState<HealthStatus[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics[]>([])
  const [dependencies, setDependencies] = useState<ServiceDependency[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    loadHealthData()
    const interval = setInterval(loadHealthData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadHealthData = async () => {
    setIsLoading(true)
    try {
      const [healthResponse, metricsResponse, depsResponse, alertsResponse] = await Promise.all([
        fetch('/api/admin/system-health'),
        fetch('/api/admin/system-metrics'),
        fetch('/api/admin/service-dependencies'),
        fetch('/api/admin/health-alerts')
      ])

      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setHealthStatuses(healthData.services.map((service: any) => ({
          ...service,
          lastCheck: new Date(service.lastCheck)
        })))
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setSystemMetrics(metricsData.metrics.map((metric: any) => ({
          ...metric,
          timestamp: new Date(metric.timestamp)
        })))
      }

      if (depsResponse.ok) {
        const depsData = await depsResponse.json()
        setDependencies(depsData.dependencies.map((dep: any) => ({
          ...dep,
          lastCheck: new Date(dep.lastCheck)
        })))
      }

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        setAlerts(alertsData.alerts.map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp)
        })))
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading health data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'bg-green-100 text-green-800'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800'
      case 'down':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'info':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getServiceIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'database':
        return <Database className="h-4 w-4" />
      case 'api':
        return <Globe className="h-4 w-4" />
      case 'cache':
        return <Zap className="h-4 w-4" />
      case 'storage':
        return <HardDrive className="h-4 w-4" />
      case 'auth':
        return <Shield className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const overallHealth = healthStatuses.length > 0 
    ? healthStatuses.every(s => s.status === 'healthy') ? 'healthy' 
    : healthStatuses.some(s => s.status === 'down') ? 'down' 
    : 'degraded'
    : 'unknown'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6" />
            System Health Dashboard
          </h2>
          <p className="text-muted-foreground">
            Real-time system health monitoring and service status
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <div className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={loadHealthData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(overallHealth)}
            Overall System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold mb-2">
                {healthStatuses.filter(s => s.status === 'healthy').length} / {healthStatuses.length} Services
              </div>
              <div className="text-sm text-muted-foreground">
                {healthStatuses.filter(s => s.status === 'down').length} down, {healthStatuses.filter(s => s.status === 'degraded').length} degraded
              </div>
            </div>
            <Badge className={getStatusColor(overallHealth)}>
              {overallHealth.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">
          <h3 className="text-lg font-semibold">Service Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthStatuses.map(service => (
              <Card key={service.service}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getServiceIcon(service.service)}
                      {service.service}
                    </CardTitle>
                    {getStatusIcon(service.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Uptime</span>
                    <span className="text-sm font-medium">{formatUptime(service.uptime)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Response Time</span>
                    <span className="text-sm font-medium">{formatResponseTime(service.responseTime)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Error Rate</span>
                    <span className="text-sm font-medium">{service.errorRate.toFixed(2)}%</span>
                  </div>

                  {service.dependencies.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">Dependencies</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {service.dependencies.map(dep => (
                          <Badge key={dep} variant="outline" className="text-xs">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <h3 className="text-lg font-semibold">System Metrics</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
                <CardDescription>CPU, Memory, and Disk utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={systemMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu" stroke="#8884d8" strokeWidth={2} name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#82ca9d" strokeWidth={2} name="Memory %" />
                    <Line type="monotone" dataKey="disk" stroke="#ffc658" strokeWidth={2} name="Disk %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network & Load</CardTitle>
                <CardDescription>Network usage and system load</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={systemMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="network" stroke="#8884d8" fill="#8884d8" name="Network %" />
                    <Area type="monotone" dataKey="loadAverage" stroke="#82ca9d" fill="#82ca9d" name="Load Average" />
                    <Area type="monotone" dataKey="requestsPerSecond" stroke="#ffc658" fill="#ffc658" name="Requests/sec" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-6">
          <h3 className="text-lg font-semibold">Service Dependencies</h3>
          <div className="space-y-4">
            {dependencies.map(dep => (
              <Card key={dep.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getServiceIcon(dep.type)}
                      <div>
                        <div className="font-medium">{dep.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {dep.type} • {formatResponseTime(dep.responseTime)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(dep.status)}
                      <Badge className={getStatusColor(dep.status)}>
                        {dep.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <h3 className="text-lg font-semibold">Health Alerts</h3>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
                <p className="text-muted-foreground">
                  All systems are operating normally
                </p>
              </div>
            ) : (
              alerts.map(alert => (
                <Card key={alert.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(alert.severity)}
                        <div>
                          <div className="font-medium">{alert.service}</div>
                          <div className="text-sm text-muted-foreground">{alert.message}</div>
                          <div className="text-xs text-muted-foreground">
                            {alert.timestamp.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        {alert.resolved && (
                          <Badge variant="outline" className="text-green-600">
                            Resolved
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
