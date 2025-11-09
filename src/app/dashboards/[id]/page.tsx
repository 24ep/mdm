'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Edit, 
  Share2, 
  Download, 
  Settings, 
  RefreshCw, 
  Play, 
  Pause,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Table,
  Type,
  Image,
  Filter,
  Map,
  Gauge
} from 'lucide-react'
import { toast } from 'sonner'

type DashboardElement = {
  id: string
  name: string
  type: string
  chart_type?: string
  position_x: number
  position_y: number
  width: number
  height: number
  z_index: number
  config: any
  style: any
  data_config: any
  is_visible: boolean
}

type Dashboard = {
  id: string
  name: string
  description?: string
  background_color: string
  font_family: string
  font_size: number
  grid_size: number
  layout_config: any
  style_config: any
  elements: DashboardElement[]
  datasources: any[]
  filters: any[]
  refresh_rate: number
  is_realtime: boolean
}

const getElementIcon = (type: string, chartType?: string) => {
  switch (type) {
    case 'KPI':
      return TrendingUp
    case 'CHART':
      switch (chartType) {
        case 'BAR':
          return BarChart3
        case 'LINE':
          return LineChart
        case 'PIE':
          return PieChart
        default:
          return BarChart3
      }
    case 'TABLE':
      return Table
    case 'TEXT':
      return Type
    case 'IMAGE':
      return Image
    case 'FILTER':
      return Filter
    case 'MAP':
      return Map
    case 'GAUGE':
      return Gauge
    default:
      return BarChart3
  }
}

export default function DashboardViewPage() {
  const params = useParams()
  const router = useRouter()
  const dashboardId = params.id as string

  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboards/${dashboardId}`)
      if (!response.ok) {
        throw new Error('Failed to load dashboard')
      }

      const data = await response.json()
      setDashboard(data.dashboard)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const refreshDashboard = async () => {
    try {
      setRefreshing(true)
      await loadDashboard()
      toast.success('Dashboard refreshed')
    } catch (error) {
      console.error('Error refreshing dashboard:', error)
      toast.error('Failed to refresh dashboard')
    } finally {
      setRefreshing(false)
    }
  }

  const exportToExcel = async () => {
    try {
      const response = await fetch(`/api/dashboards/${dashboardId}/export/excel`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to export dashboard')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${dashboard?.name || 'dashboard'}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Dashboard exported to Excel')
    } catch (error) {
      console.error('Error exporting dashboard:', error)
      toast.error('Failed to export dashboard')
    }
  }

  const exportToPDF = async () => {
    try {
      const response = await fetch(`/api/dashboards/${dashboardId}/export/pdf`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to export dashboard')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to export dashboard')
      }

      // Download from S3 using presigned URL
      const { downloadPDFFromS3 } = await import('@/lib/s3-download')
      await downloadPDFFromS3(data.key, data.bucket, data.filename)

      toast.success('Dashboard exported to PDF')
    } catch (error) {
      console.error('Error exporting dashboard:', error)
      toast.error('Failed to export dashboard')
    }
  }

  useEffect(() => {
    if (dashboardId) {
      loadDashboard()
    }
  }, [dashboardId])

  // Auto-refresh if real-time is enabled
  useEffect(() => {
    if (dashboard?.is_realtime && dashboard.refresh_rate > 0) {
      const interval = setInterval(() => {
        if (isPlaying) {
          refreshDashboard()
        }
      }, dashboard.refresh_rate * 1000)

      return () => clearInterval(interval)
    }
  }, [dashboard?.is_realtime, dashboard?.refresh_rate, isPlaying])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!dashboard) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Dashboard not found</h2>
            <p className="text-muted-foreground mb-4">The dashboard you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/dashboards')}>
              Back to Dashboards
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{dashboard.name}</h1>
            {dashboard.description && (
              <p className="text-muted-foreground mt-1">{dashboard.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {dashboard.is_realtime && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshDashboard}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboards/${dashboardId}/builder`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Elements</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.elements.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
              <Table className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.datasources.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filters</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.filters.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Refresh Rate</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboard.is_realtime ? 'Real-time' : `${dashboard.refresh_rate}s`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Canvas */}
        <Card>
          <CardContent className="p-6">
            <div
              className="relative min-h-96 bg-background rounded-lg shadow-sm"
              style={{
                backgroundColor: dashboard.background_color,
                fontFamily: dashboard.font_family,
                fontSize: `${dashboard.font_size}px`
              }}
            >
              {dashboard.elements.length === 0 ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No elements added</h3>
                    <p className="text-muted-foreground mb-4">
                      This dashboard doesn't have any elements yet.
                    </p>
                    <Button onClick={() => router.push(`/dashboards/${dashboardId}/builder`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Add Elements
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  {dashboard.elements
                    .filter(element => element.is_visible)
                    .sort((a, b) => a.z_index - b.z_index)
                    .map((element) => {
                      const Icon = getElementIcon(element.type, element.chart_type)
                      return (
                        <div
                          key={element.id}
                          className="absolute border rounded-lg shadow-sm bg-background"
                          style={{
                            left: `${(element.position_x / dashboard.grid_size) * 100}%`,
                            top: `${(element.position_y / dashboard.grid_size) * 100}%`,
                            width: `${(element.width / dashboard.grid_size) * 100}%`,
                            height: `${(element.height / dashboard.grid_size) * 100}%`,
                            zIndex: element.z_index,
                            ...element.style
                          }}
                        >
                          <div className="w-full h-full p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-medium text-sm">{element.name}</h3>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {element.type}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {element.width}×{element.height} grid units
                            </div>
                            {/* Placeholder for actual chart/table content */}
                            <div className="mt-4 flex items-center justify-center h-20 bg-muted/30 rounded border-2 border-dashed border-border">
                              <div className="text-center text-gray-500">
                                <Icon className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-xs">{element.name}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
