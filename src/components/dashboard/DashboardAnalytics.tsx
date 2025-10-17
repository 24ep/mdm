'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Clock, 
  Download, 
  Calendar,
  Filter,
  RefreshCw,
  BarChart3,
  Activity
} from 'lucide-react'

interface DashboardAnalyticsProps {
  dashboardId: string
  onExportAnalytics: (format: string) => void
}

interface AnalyticsData {
  views: {
    total: number
    unique: number
    today: number
    thisWeek: number
    thisMonth: number
  }
  users: {
    total: number
    active: number
    new: number
    returning: number
  }
  engagement: {
    avgSessionDuration: number
    bounceRate: number
    pagesPerSession: number
    interactions: number
  }
  performance: {
    loadTime: number
    errorRate: number
    uptime: number
    responseTime: number
  }
  timeSeries: Array<{
    date: string
    views: number
    users: number
    interactions: number
  }>
  topPages: Array<{
    page: string
    views: number
    uniqueViews: number
    avgTime: number
  }>
  userSegments: Array<{
    segment: string
    count: number
    percentage: number
  }>
  deviceBreakdown: Array<{
    device: string
    count: number
    percentage: number
  }>
}

export function DashboardAnalytics({ dashboardId, onExportAnalytics }: DashboardAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState('7d')
  const [refreshTime, setRefreshTime] = useState(new Date())

  // Mock analytics data
  const mockAnalytics: AnalyticsData = {
    views: {
      total: 15420,
      unique: 8930,
      today: 234,
      thisWeek: 1890,
      thisMonth: 5670
    },
    users: {
      total: 8930,
      active: 2340,
      new: 567,
      returning: 1773
    },
    engagement: {
      avgSessionDuration: 245, // seconds
      bounceRate: 23.4,
      pagesPerSession: 3.2,
      interactions: 45670
    },
    performance: {
      loadTime: 1.2, // seconds
      errorRate: 0.8,
      uptime: 99.9,
      responseTime: 150 // ms
    },
    timeSeries: [
      { date: '2024-01-01', views: 120, users: 89, interactions: 340 },
      { date: '2024-01-02', views: 145, users: 102, interactions: 420 },
      { date: '2024-01-03', views: 98, users: 76, interactions: 290 },
      { date: '2024-01-04', views: 167, users: 124, interactions: 510 },
      { date: '2024-01-05', views: 189, users: 145, interactions: 580 },
      { date: '2024-01-06', views: 156, users: 118, interactions: 470 },
      { date: '2024-01-07', views: 234, users: 178, interactions: 720 }
    ],
    topPages: [
      { page: 'Sales Dashboard', views: 4560, uniqueViews: 2340, avgTime: 180 },
      { page: 'Marketing Analytics', views: 3890, uniqueViews: 1980, avgTime: 220 },
      { page: 'Customer Insights', views: 2340, uniqueViews: 1450, avgTime: 160 },
      { page: 'Financial Overview', views: 1890, uniqueViews: 1200, avgTime: 200 }
    ],
    userSegments: [
      { segment: 'Internal Users', count: 2340, percentage: 45.2 },
      { segment: 'External Clients', count: 1890, percentage: 36.5 },
      { segment: 'Partners', count: 950, percentage: 18.3 }
    ],
    deviceBreakdown: [
      { device: 'Desktop', count: 3450, percentage: 65.2 },
      { device: 'Mobile', count: 1230, percentage: 23.2 },
      { device: 'Tablet', count: 610, percentage: 11.6 }
    ]
  }

  useEffect(() => {
    loadAnalytics()
  }, [dashboardId, dateRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setAnalytics(mockAnalytics)
      setRefreshTime(new Date())
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Dashboard Analytics</h2>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button variant="outline" onClick={loadAnalytics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => onExportAnalytics('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Last updated: {refreshTime.toLocaleString()}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.views.total)}</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.users.total)}</div>
                <p className="text-xs text-muted-foreground">
                  +8% from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(analytics.engagement.avgSessionDuration)}</div>
                <p className="text-xs text-muted-foreground">
                  +5% from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interactions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.engagement.interactions)}</div>
                <p className="text-xs text-muted-foreground">
                  +15% from last period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Time Series Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="users" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{page.page}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatNumber(page.uniqueViews)} unique views
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatNumber(page.views)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDuration(page.avgTime)} avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.userSegments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ segment, percentage }) => `${segment} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.userSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.deviceBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="device" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Bounce Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.engagement.bounceRate}%</div>
                <p className="text-xs text-muted-foreground">Lower is better</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pages per Session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.engagement.pagesPerSession}</div>
                <p className="text-xs text-muted-foreground">Higher is better</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.users.active)}</div>
                <p className="text-xs text-muted-foreground">Currently online</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">New Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.users.new)}</div>
                <p className="text-xs text-muted-foreground">This period</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Load Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.performance.loadTime}s</div>
                <p className="text-xs text-muted-foreground">Average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.performance.errorRate}%</div>
                <p className="text-xs text-muted-foreground">Lower is better</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.performance.uptime}%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.performance.responseTime}ms</div>
                <p className="text-xs text-muted-foreground">Average</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
