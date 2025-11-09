'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Database, 
  AlertTriangle,
  BarChart3,
  Activity,
  Zap,
  RefreshCw
} from 'lucide-react'
import { QueryPerformanceRecord, QueryPerformanceStats, PerformanceTrend } from '@/lib/query-performance'
import { formatDuration } from '@/lib/utils'

interface QueryPerformanceDashboardProps {
  onQueryClick?: (query: string) => void
}

export function QueryPerformanceDashboard({ onQueryClick }: QueryPerformanceDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'slow' | 'stats' | 'trends'>('overview')
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('7')
  const [loading, setLoading] = useState(false)
  const [slowQueries, setSlowQueries] = useState<QueryPerformanceRecord[]>([])
  const [recentQueries, setRecentQueries] = useState<QueryPerformanceRecord[]>([])
  const [queryStats, setQueryStats] = useState<QueryPerformanceStats[]>([])
  const [trends, setTrends] = useState<PerformanceTrend[]>([])
  const [overview, setOverview] = useState({
    totalQueries: 0,
    slowQueries: 0,
    avgExecutionTime: 0,
    totalExecutionTime: 0
  })

  useEffect(() => {
    loadData()
  }, [activeTab, timeRange])

  const loadData = async () => {
    setLoading(true)
    try {
      const days = parseInt(timeRange)

      switch (activeTab) {
        case 'overview':
          const [recentRes, slowRes, statsRes] = await Promise.all([
            fetch(`/api/admin/query-performance?type=recent&limit=10`),
            fetch(`/api/admin/query-performance?type=slow&limit=10`),
            fetch(`/api/admin/query-performance?type=stats&days=${days}`)
          ])
          
          const recentData = await recentRes.json()
          const slowData = await slowRes.json()
          const statsData = await statsRes.json()

          setRecentQueries(recentData.data || [])
          setSlowQueries(slowData.data || [])
          setQueryStats(statsData.data || [])

          // Calculate overview
          const allStats = statsData.data || []
          const totalQueries = allStats.reduce((sum: number, stat: QueryPerformanceStats) => sum + stat.executionCount, 0)
          const slowCount = allStats.reduce((sum: number, stat: QueryPerformanceStats) => sum + stat.slowQueryCount, 0)
          const totalTime = allStats.reduce((sum: number, stat: QueryPerformanceStats) => sum + stat.totalExecutionTime, 0)
          const avgTime = totalQueries > 0 ? totalTime / totalQueries : 0

          setOverview({
            totalQueries,
            slowQueries: slowCount,
            avgExecutionTime: avgTime,
            totalExecutionTime: totalTime
          })
          break

        case 'slow':
          const slowResponse = await fetch(`/api/admin/query-performance?type=slow&limit=50`)
          const slowResult = await slowResponse.json()
          setSlowQueries(slowResult.data || [])
          break

        case 'stats':
          const statsResponse = await fetch(`/api/admin/query-performance?type=stats&days=${days}`)
          const statsResult = await statsResponse.json()
          setQueryStats(statsResult.data || [])
          break

        case 'trends':
          const trendsResponse = await fetch(`/api/admin/query-performance?type=trends&days=${days}`)
          const trendsResult = await trendsResponse.json()
          setTrends(trendsResult.data || [])
          break
      }
    } catch (error) {
      console.error('Failed to load performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatQuery = (query: string, maxLength: number = 100) => {
    if (query.length <= maxLength) return query
    return query.substring(0, maxLength) + '...'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Query Performance</h2>
          <p className="text-sm text-muted-foreground">Monitor and analyze query execution performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="slow">Slow Queries</TabsTrigger>
          <TabsTrigger value="stats">Query Statistics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Queries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalQueries.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Last {timeRange} days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Slow Queries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{overview.slowQueries.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.totalQueries > 0 
                    ? `${((overview.slowQueries / overview.totalQueries) * 100).toFixed(1)}% of total`
                    : '0% of total'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg Execution Time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(overview.avgExecutionTime)}</div>
                <p className="text-xs text-muted-foreground mt-1">Per query</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Execution Time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(overview.totalExecutionTime)}</div>
                <p className="text-xs text-muted-foreground mt-1">Cumulative</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Slow Queries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Slow Queries</CardTitle>
              <CardDescription>Queries that exceeded the performance threshold</CardDescription>
            </CardHeader>
            <CardContent>
              {slowQueries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No slow queries found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {slowQueries.slice(0, 10).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => onQueryClick?.(record.query)}
                    >
                      <div className="flex-1 min-w-0">
                        <code className="text-xs text-gray-700 break-all">
                          {formatQuery(record.query, 150)}
                        </code>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{record.timestamp.toLocaleString()}</span>
                          {record.userName && <span>• {record.userName}</span>}
                          <span>• {record.rowCount.toLocaleString()} rows</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant="destructive" className="text-xs">
                          {formatDuration(record.executionTime)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slow Queries</CardTitle>
              <CardDescription>Queries exceeding 1 second execution time</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                </div>
              ) : slowQueries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No slow queries found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {slowQueries.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => onQueryClick?.(record.query)}
                    >
                      <div className="flex-1 min-w-0">
                        <code className="text-sm text-gray-700 break-all">
                          {formatQuery(record.query, 200)}
                        </code>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {record.timestamp.toLocaleString()}
                          </span>
                          {record.userName && <span>• {record.userName}</span>}
                          <span className="flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            {record.rowCount.toLocaleString()} rows
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant="destructive" className="text-sm font-medium">
                          {formatDuration(record.executionTime)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query Statistics</CardTitle>
              <CardDescription>Performance metrics by query pattern</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                </div>
              ) : queryStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No query statistics available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {queryStats.map((stat) => (
                    <div
                      key={stat.queryHash}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => onQueryClick?.(stat.query)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <code className="text-sm text-gray-700 break-all flex-1">
                          {formatQuery(stat.query, 200)}
                        </code>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 text-xs">
                        <div>
                          <div className="text-muted-foreground">Executions</div>
                          <div className="font-medium">{stat.executionCount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg Time</div>
                          <div className="font-medium">{formatDuration(stat.avgExecutionTime)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Min/Max</div>
                          <div className="font-medium">
                            {formatDuration(stat.minExecutionTime)} / {formatDuration(stat.maxExecutionTime)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg Rows</div>
                          <div className="font-medium">{stat.avgRowCount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Slow Count</div>
                          <div className="font-medium text-orange-600">{stat.slowQueryCount}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Query performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                </div>
              ) : trends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No trend data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trends.map((trend) => (
                    <div key={trend.date} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{new Date(trend.date).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {trend.queryCount} queries • {trend.slowQueryCount} slow
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatDuration(trend.avgExecutionTime)}</div>
                        <div className="text-xs text-muted-foreground">avg time</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}





