'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  Settings, 
  Edit, 
  Eye, 
  Share, 
  Download,
  Plus,
  Filter,
  RefreshCw,
  Users,
  Database,
  Activity,
  TrendingUp,
  Target
} from 'lucide-react'
import { DashboardBuilder } from './DashboardBuilder'

interface SpaceDashboardProps {
  spaceId: string
  spaceName: string
  isEditMode?: boolean
  onEditModeChange?: (editMode: boolean) => void
}

interface Dashboard {
  id: string
  name: string
  description: string
  widgets: any[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

interface SpaceStats {
  totalUsers: number
  totalDataModels: number
  totalRecords: number
  storageUsed: number
  lastActivity: Date
}

export function SpaceDashboard({ 
  spaceId, 
  spaceName, 
  isEditMode = false,
  onEditModeChange 
}: SpaceDashboardProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [spaceStats, setSpaceStats] = useState<SpaceStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadDashboard()
    loadSpaceStats()
  }, [spaceId])

  const loadDashboard = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/spaces/${spaceId}/dashboard`)
      if (response.ok) {
        const data = await response.json()
        setDashboard(data.dashboard)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSpaceStats = async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}/stats`)
      if (response.ok) {
        const data = await response.json()
        setSpaceStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading space stats:', error)
    }
  }

  const saveDashboard = async (widgets: any[]) => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}/dashboard`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets })
      })

      if (response.ok) {
        loadDashboard()
      }
    } catch (error) {
      console.error('Error saving dashboard:', error)
    }
  }

  const exportDashboard = async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}/dashboard/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${spaceName}-dashboard.pdf`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting dashboard:', error)
    }
  }

  const shareDashboard = async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}/dashboard/share`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        const { copyToClipboard } = await import('@/lib/clipboard')
        await copyToClipboard(data.shareUrl)
        // Show success message
      }
    } catch (error) {
      console.error('Error sharing dashboard:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            {spaceName} Dashboard
          </h2>
          <p className="text-muted-foreground">
            Real-time analytics and insights for {spaceName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditModeChange?.(!isEditMode)}
          >
            {isEditMode ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                View
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={exportDashboard}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={shareDashboard}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={loadDashboard}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Space Statistics */}
      {spaceStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{spaceStats.totalUsers}</div>
              <div className="text-xs text-muted-foreground">
                Active members
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Models</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{spaceStats.totalDataModels}</div>
              <div className="text-xs text-muted-foreground">
                Models created
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Records</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{spaceStats.totalRecords.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                Total data entries
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(spaceStats.storageUsed / 1024 / 1024).toFixed(1)} MB
              </div>
              <div className="text-xs text-muted-foreground">
                Storage used
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {dashboard ? (
            <DashboardBuilder
              dashboardId={dashboard.id}
              widgets={dashboard.widgets}
              onWidgetsChange={saveDashboard}
              dataSources={[]}
              isEditMode={isEditMode}
            />
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Dashboard Created</h3>
              <p className="text-muted-foreground mb-4">
                Create your first dashboard to start visualizing data
              </p>
              <Button onClick={() => onEditModeChange?.(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Dashboard
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <h3 className="text-lg font-semibold">Advanced Analytics</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>User engagement over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Activity Chart Placeholder
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Growth</CardTitle>
                <CardDescription>Data model and record growth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Growth Chart Placeholder
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <h3 className="text-lg font-semibold">Space Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Report
                </CardTitle>
                <CardDescription>
                  System performance and usage metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Monthly</Badge>
                  <Button size="sm" variant="outline">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Report
                </CardTitle>
                <CardDescription>
                  User activity and engagement analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Weekly</Badge>
                  <Button size="sm" variant="outline">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Report
                </CardTitle>
                <CardDescription>
                  Data model usage and record statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Daily</Badge>
                  <Button size="sm" variant="outline">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
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
