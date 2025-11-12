'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Database, 
  Server, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  HardDrive,
  Cpu,
  MemoryStick
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface HealthMetric {
  id: string
  name: string
  value: number
  unit: string
  status: 'healthy' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  threshold: {
    warning: number
    critical: number
  }
  description: string
}

interface SystemAlert {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  resolved: boolean
}

interface HealthDashboardProps {
  spaceId?: string
}

const HEALTH_METRICS: HealthMetric[] = [
  {
    id: 'cpu_usage',
    name: 'CPU Usage',
    value: 45,
    unit: '%',
    status: 'healthy',
    trend: 'stable',
    threshold: { warning: 70, critical: 90 },
    description: 'Current CPU utilization'
  },
  {
    id: 'memory_usage',
    name: 'Memory Usage',
    value: 62,
    unit: '%',
    status: 'warning',
    trend: 'up',
    threshold: { warning: 60, critical: 85 },
    description: 'Current memory utilization'
  },
  {
    id: 'disk_usage',
    name: 'Disk Usage',
    value: 78,
    unit: '%',
    status: 'warning',
    trend: 'up',
    threshold: { warning: 75, critical: 90 },
    description: 'Current disk space utilization'
  },
  {
    id: 'database_connections',
    name: 'Database Connections',
    value: 12,
    unit: 'connections',
    status: 'healthy',
    trend: 'stable',
    threshold: { warning: 80, critical: 100 },
    description: 'Active database connections'
  },
  {
    id: 'response_time',
    name: 'Response Time',
    value: 150,
    unit: 'ms',
    status: 'healthy',
    trend: 'down',
    threshold: { warning: 500, critical: 1000 },
    description: 'Average API response time'
  },
  {
    id: 'error_rate',
    name: 'Error Rate',
    value: 0.5,
    unit: '%',
    status: 'healthy',
    trend: 'stable',
    threshold: { warning: 2, critical: 5 },
    description: 'Current error rate'
  }
]

const SYSTEM_ALERTS: SystemAlert[] = [
  {
    id: 'alert_1',
    type: 'warning',
    title: 'High Memory Usage',
    message: 'Memory usage has exceeded 60% threshold',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    resolved: false
  },
  {
    id: 'alert_2',
    type: 'error',
    title: 'Database Connection Failed',
    message: 'Failed to establish connection to primary database',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    resolved: true
  },
  {
    id: 'alert_3',
    type: 'info',
    title: 'Scheduled Maintenance',
    message: 'System maintenance scheduled for tonight at 2 AM',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    resolved: false
  }
]

export function SystemHealthDashboard({ spaceId }: HealthDashboardProps) {
  const [metrics, setMetrics] = useState<HealthMetric[]>(HEALTH_METRICS)
  const [alerts, setAlerts] = useState<SystemAlert[]>(SYSTEM_ALERTS)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const refreshMetrics = async () => {
    setIsRefreshing(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update metrics with some random variation
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.max(0, Math.min(100, metric.value + (Math.random() - 0.5) * 10))
      })))
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to refresh metrics:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info': return <Activity className="h-4 w-4 text-blue-500" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-200 bg-red-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      case 'info': return 'border-blue-200 bg-blue-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const overallHealth = metrics.every(m => m.status === 'healthy') ? 'healthy' :
                      metrics.some(m => m.status === 'critical') ? 'critical' : 'warning'

  const criticalAlerts = alerts.filter(a => a.type === 'error' && !a.resolved).length
  const warningAlerts = alerts.filter(a => a.type === 'warning' && !a.resolved).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health</h2>
          <p className="text-muted-foreground">
            Monitor system performance and health metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshMetrics}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className={overallHealth === 'healthy' ? 'border-green-200' : 
                      overallHealth === 'warning' ? 'border-yellow-200' : 'border-red-200'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(overallHealth)}
            System Status: {overallHealth.toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-muted-foreground">Critical Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{warningAlerts}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{alerts.filter(a => !a.resolved).length}</div>
              <div className="text-sm text-muted-foreground">Active Alerts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="w-full">
      <Tabs defaultValue="metrics">
        <TabsList>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(metric.status)}
                      {getTrendIcon(metric.trend)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{metric.value}</span>
                      <span className="text-sm text-muted-foreground">{metric.unit}</span>
                    </div>
                    <Progress 
                      value={metric.value} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Warning: {metric.threshold.warning}{metric.unit}</span>
                      <span>Critical: {metric.threshold.critical}{metric.unit}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Alert key={alert.id} className={getAlertColor(alert.type)}>
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{alert.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={alert.resolved ? 'secondary' : 'destructive'}>
                          {alert.resolved ? 'Resolved' : 'Active'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {alert.timestamp.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <AlertDescription className="mt-1">
                      {alert.message}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  System Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span>{metrics.find(m => m.id === 'cpu_usage')?.value}%</span>
                  </div>
                  <Progress value={metrics.find(m => m.id === 'cpu_usage')?.value} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>{metrics.find(m => m.id === 'memory_usage')?.value}%</span>
                  </div>
                  <Progress value={metrics.find(m => m.id === 'memory_usage')?.value} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Disk Usage</span>
                    <span>{metrics.find(m => m.id === 'disk_usage')?.value}%</span>
                  </div>
                  <Progress value={metrics.find(m => m.id === 'disk_usage')?.value} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Response Time</span>
                    <span>{metrics.find(m => m.id === 'response_time')?.value}ms</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (metrics.find(m => m.id === 'response_time')?.value || 0) / 10)} 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Error Rate</span>
                    <span>{metrics.find(m => m.id === 'error_rate')?.value}%</span>
                  </div>
                  <Progress 
                    value={metrics.find(m => m.id === 'error_rate')?.value * 20} 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Connections</span>
                    <span>{metrics.find(m => m.id === 'database_connections')?.value}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
