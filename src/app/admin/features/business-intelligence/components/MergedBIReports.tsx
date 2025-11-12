'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  FileText, 
  Calendar,
  Download,
  Share,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Users,
  Database,
  Activity,
  Zap,
  Target,
  Filter,
  RefreshCw,
  Play,
  Pause,
  Send,
  Search,
  Power,
  Star,
  StarOff,
  X,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { showSuccess, showError, ToastMessages } from '@/lib/toast-utils'
import { ReportsTreeView } from '@/components/reports/ReportsTreeView'
import { SourceTypeView } from '@/components/reports/SourceTypeView'
import { AdvancedFilters } from '@/components/reports/AdvancedFilters'
import { ReportTemplatesDialog } from '@/components/reports/ReportTemplatesDialog'
import { exportReportsToExcel, exportReportsToCSV, exportReportsToJSON } from '@/lib/utils/export-utils'
import { Dashboard, DashboardWidget, FilterConfig, Report as BIReport, DataSource, ChartTemplate } from '../types'

export type ReportSource = 'BUILT_IN' | 'POWER_BI' | 'GRAFANA' | 'LOOKER_STUDIO'

export interface Report {
  id: string
  name: string
  description?: string
  source: ReportSource
  category_id?: string
  folder_id?: string
  owner?: string
  link?: string
  workspace?: string
  embed_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface ReportCategory {
  id: string
  name: string
  description?: string
  parent_id?: string
  created_at: string
}

export interface ReportFolder {
  id: string
  name: string
  description?: string
  parent_id?: string
  created_at: string
}

export function MergedBIReports() {
  const router = useRouter()
  const { currentSpace } = useSpace()
  
  // Main tab state
  const [mainTab, setMainTab] = useState<'bi' | 'reports'>('bi')
  
  // BI State
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [biReports, setBiReports] = useState<BIReport[]>([])
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [spaces, setSpaces] = useState<Array<{id: string, name: string}>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateDashboard, setShowCreateDashboard] = useState(false)
  const [showCreateReport, setShowCreateReport] = useState(false)
  const [showDataSourceDialog, setShowDataSourceDialog] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<string>('all')
  const [biTab, setBiTab] = useState<'dashboards' | 'reports' | 'data-sources' | 'templates'>('dashboards')

  const [newDashboard, setNewDashboard] = useState({
    name: '',
    description: '',
    spaceId: '',
    isPublic: false
  })

  const [newBiReport, setNewBiReport] = useState<{
    name: string
    description: string
    spaceId: string
    type: 'on_demand' | 'scheduled'
    schedule: string
    format: 'pdf' | 'excel' | 'csv'
    recipients: string
  }>({
    name: '',
    description: '',
    spaceId: '',
    type: 'on_demand',
    schedule: '',
    format: 'pdf',
    recipients: ''
  })

  const [newDataSource, setNewDataSource] = useState({
    name: '',
    type: 'database' as const,
    connection: '',
    spaceId: ''
  })

  // Reports State
  const [reportsTab, setReportsTab] = useState<'all' | 'source-type'>('all')
  const [reports, setReports] = useState<Report[]>([])
  const [categories, setCategories] = useState<ReportCategory[]>([])
  const [folders, setFolders] = useState<ReportFolder[]>([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    source: '' as ReportSource | '',
    category: '',
    status: '',
    showFavorites: false,
    dateFrom: '',
    dateTo: ''
  })
  const [showTemplates, setShowTemplates] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set())
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  const chartTemplates: ChartTemplate[] = [
    {
      id: 'line-chart',
      name: 'Line Chart',
      type: 'line',
      description: 'Time series data visualization',
      icon: '📈',
      config: { type: 'line', showGrid: true, showLegend: true }
    },
    {
      id: 'bar-chart',
      name: 'Bar Chart',
      type: 'bar',
      description: 'Categorical data comparison',
      icon: '📊',
      config: { type: 'bar', showGrid: true, showLegend: true }
    },
    {
      id: 'pie-chart',
      name: 'Pie Chart',
      type: 'pie',
      description: 'Proportional data representation',
      icon: '🥧',
      config: { type: 'pie', showLegend: true, showLabels: true }
    },
    {
      id: 'area-chart',
      name: 'Area Chart',
      type: 'area',
      description: 'Stacked area visualization',
      icon: '📈',
      config: { type: 'area', showGrid: true, showLegend: true }
    }
  ]

  // Debounce search term
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearchTerm(value)
  }, 300)

  useEffect(() => {
    if (mainTab === 'bi') {
      loadSpaces()
      loadDashboards()
      loadBiReports()
      loadDataSources()
    } else {
      loadReports()
    }
  }, [mainTab])

  useEffect(() => {
    if (mainTab === 'reports') {
      debouncedSearch(searchTerm)
    }
  }, [searchTerm, debouncedSearch, mainTab])

  useEffect(() => {
    if (mainTab === 'reports') {
      loadReports()
    }
  }, [currentSpace?.id, debouncedSearchTerm, filters.source, filters.category, filters.status, filters.showFavorites, mainTab])

  const loadSpaces = async () => {
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data.spaces || [])
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
    }
  }

  const loadDashboards = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/bi/dashboards')
      if (response.ok) {
        const data = await response.json()
        setDashboards(data.dashboards.map((dash: any) => ({
          ...dash,
          createdAt: new Date(dash.createdAt),
          updatedAt: new Date(dash.updatedAt)
        })))
      }
    } catch (error) {
      console.error('Error loading dashboards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadBiReports = async () => {
    try {
      const response = await fetch('/api/admin/bi/reports')
      if (response.ok) {
        const data = await response.json()
        setBiReports(data.reports.map((report: any) => ({
          ...report,
          createdAt: new Date(report.createdAt),
          lastRun: report.lastRun ? new Date(report.lastRun) : undefined,
          nextRun: report.nextRun ? new Date(report.nextRun) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    }
  }

  const loadDataSources = async () => {
    try {
      const response = await fetch('/api/admin/bi/data-sources')
      if (response.ok) {
        const data = await response.json()
        setDataSources(data.dataSources)
      }
    } catch (error) {
      console.error('Error loading data sources:', error)
    }
  }

  const loadReports = async () => {
    try {
      setReportsLoading(true)
      const params = new URLSearchParams({
        ...(currentSpace?.id && { space_id: currentSpace.id }),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(filters.source && { source: filters.source }),
        ...(filters.category && { category_id: filters.category }),
        ...(filters.status && { status: filters.status }),
        ...(filters.dateFrom && { date_from: filters.dateFrom }),
        ...(filters.dateTo && { date_to: filters.dateTo })
      })

      const response = await fetch(`/api/reports?${params}`)
      if (!response.ok) {
        throw new Error('Failed to load reports')
      }

      const data = await response.json()
      let filteredReports = data.reports || []
      
      // Apply favorites filter
      if (filters.showFavorites) {
        const stored = localStorage.getItem('report_favorites')
        const favoriteIds = stored ? JSON.parse(stored) : []
        filteredReports = filteredReports.filter((r: Report) => favoriteIds.includes(r.id))
      }

      setReports(filteredReports)
      setCategories(data.categories || [])
      setFolders(data.folders || [])
    } catch (error) {
      console.error('Error loading reports:', error)
      showError(ToastMessages.LOAD_ERROR)
    } finally {
      setReportsLoading(false)
    }
  }

  const createDashboard = async () => {
    try {
      const response = await fetch('/api/admin/bi/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDashboard)
      })

      if (response.ok) {
        setShowCreateDashboard(false)
        setNewDashboard({
          name: '',
          description: '',
          spaceId: '',
          isPublic: false
        })
        loadDashboards()
      }
    } catch (error) {
      console.error('Error creating dashboard:', error)
    }
  }

  const createBiReport = async () => {
    try {
      const response = await fetch('/api/admin/bi/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBiReport,
          recipients: newBiReport.recipients.split(',').map(email => email.trim())
        })
      })

      if (response.ok) {
        setShowCreateReport(false)
        setNewBiReport({
          name: '',
          description: '',
          spaceId: '',
          type: 'on_demand',
          schedule: '',
          format: 'pdf',
          recipients: ''
        })
        loadBiReports()
      }
    } catch (error) {
      console.error('Error creating report:', error)
    }
  }

  const createDataSource = async () => {
    try {
      const response = await fetch('/api/admin/bi/data-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDataSource)
      })

      if (response.ok) {
        setShowDataSourceDialog(false)
        setNewDataSource({
          name: '',
          type: 'database',
          connection: '',
          spaceId: ''
        })
        loadDataSources()
      }
    } catch (error) {
      console.error('Error creating data source:', error)
    }
  }

  const deleteDashboard = async (dashboardId: string) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return

    try {
      const response = await fetch(`/api/admin/bi/dashboards/${dashboardId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadDashboards()
      }
    } catch (error) {
      console.error('Error deleting dashboard:', error)
    }
  }

  const deleteBiReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      const response = await fetch(`/api/admin/bi/reports/${reportId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadBiReports()
      }
    } catch (error) {
      console.error('Error deleting report:', error)
    }
  }

  const runBiReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/admin/bi/reports/${reportId}/run`, {
        method: 'POST'
      })

      if (response.ok) {
        loadBiReports()
      }
    } catch (error) {
      console.error('Error running report:', error)
    }
  }

  const handleBulkDelete = async () => {
    try {
      const response = await fetch('/api/reports/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          report_ids: Array.from(selectedReports)
        })
      })
      if (!response.ok) throw new Error('Failed to delete reports')
      showSuccess(`${selectedReports.size} reports deleted`)
      setSelectedReports(new Set())
      loadReports()
    } catch (error: any) {
      showError(error.message || ToastMessages.DELETE_ERROR)
    }
  }

  const filteredDashboards = selectedSpace === 'all' 
    ? dashboards 
    : dashboards.filter(dash => dash.spaceId === selectedSpace)

  const filteredBiReports = selectedSpace === 'all' 
    ? biReports 
    : biReports.filter(report => report.spaceId === selectedSpace)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            BI & Reports
          </h2>
          <p className="text-muted-foreground">
            Business intelligence dashboards and report management
          </p>
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'bi' | 'reports')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bi">Business Intelligence</TabsTrigger>
          <TabsTrigger value="reports">Reports & Dashboards</TabsTrigger>
        </TabsList>

        <TabsContent value="bi" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by space" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Spaces</SelectItem>
                  {spaces.map(space => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={loadDashboards} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <Tabs value={biTab} onValueChange={(v) => setBiTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboards" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Space Dashboards</h3>
                <Dialog open={showCreateDashboard} onOpenChange={setShowCreateDashboard}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Dashboard
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Dashboard</DialogTitle>
                      <DialogDescription>
                        Create a new dashboard for data visualization
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="dashboard-name">Dashboard Name</Label>
                        <Input
                          id="dashboard-name"
                          value={newDashboard.name}
                          onChange={(e) => setNewDashboard({ ...newDashboard, name: e.target.value })}
                          placeholder="Sales Dashboard"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dashboard-description">Description</Label>
                        <Textarea
                          id="dashboard-description"
                          value={newDashboard.description}
                          onChange={(e) => setNewDashboard({ ...newDashboard, description: e.target.value })}
                          placeholder="Dashboard description"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dashboard-space">Space</Label>
                        <Select value={newDashboard.spaceId} onValueChange={(value) => setNewDashboard({ ...newDashboard, spaceId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a space" />
                          </SelectTrigger>
                          <SelectContent>
                            {spaces.map(space => (
                              <SelectItem key={space.id} value={space.id}>
                                {space.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={newDashboard.isPublic} 
                          onCheckedChange={(checked) => setNewDashboard({ ...newDashboard, isPublic: checked })}
                        />
                        <Label>Make Public</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateDashboard(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createDashboard} disabled={!newDashboard.name || !newDashboard.spaceId}>
                        Create Dashboard
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDashboards.map(dashboard => (
                  <Card key={dashboard.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          {dashboard.name}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          {dashboard.isPublic && (
                            <Badge variant="outline" className="text-xs">Public</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteDashboard(dashboard.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        {dashboard.spaceName} • {dashboard.widgets.length} widgets
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {dashboard.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          Updated: {new Date(dashboard.updatedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Automated Reports</h3>
                <Dialog open={showCreateReport} onOpenChange={setShowCreateReport}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Report</DialogTitle>
                      <DialogDescription>
                        Create a new automated report
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="report-name">Report Name</Label>
                          <Input
                            id="report-name"
                            value={newBiReport.name}
                            onChange={(e) => setNewBiReport({ ...newBiReport, name: e.target.value })}
                            placeholder="Monthly Sales Report"
                          />
                        </div>
                        <div>
                          <Label htmlFor="report-space">Space</Label>
                          <Select value={newBiReport.spaceId} onValueChange={(value) => setNewBiReport({ ...newBiReport, spaceId: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a space" />
                            </SelectTrigger>
                            <SelectContent>
                              {spaces.map(space => (
                                <SelectItem key={space.id} value={space.id}>
                                  {space.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="report-description">Description</Label>
                        <Textarea
                          id="report-description"
                          value={newBiReport.description}
                          onChange={(e) => setNewBiReport({ ...newBiReport, description: e.target.value })}
                          placeholder="Report description"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="report-type">Type</Label>
                          <Select value={newBiReport.type} onValueChange={(value: any) => setNewBiReport({ ...newBiReport, type: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="on_demand">On Demand</SelectItem>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="report-format">Format</Label>
                          <Select value={newBiReport.format} onValueChange={(value: any) => setNewBiReport({ ...newBiReport, format: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="excel">Excel</SelectItem>
                              <SelectItem value="csv">CSV</SelectItem>
                              <SelectItem value="json">JSON</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {newBiReport.type === 'scheduled' && (
                        <div>
                          <Label htmlFor="report-schedule">Schedule (Cron)</Label>
                          <Input
                            id="report-schedule"
                            value={newBiReport.schedule}
                            onChange={(e) => setNewBiReport({ ...newBiReport, schedule: e.target.value })}
                            placeholder="0 9 * * 1 (Every Monday at 9 AM)"
                          />
                        </div>
                      )}
                      <div>
                        <Label htmlFor="report-recipients">Recipients (comma-separated emails)</Label>
                        <Input
                          id="report-recipients"
                          value={newBiReport.recipients}
                          onChange={(e) => setNewBiReport({ ...newBiReport, recipients: e.target.value })}
                          placeholder="admin@company.com, manager@company.com"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateReport(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createBiReport} disabled={!newBiReport.name || !newBiReport.spaceId}>
                        Create Report
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBiReports.map(report => (
                  <Card key={report.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {report.name}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">Report</Badge>
                          <Badge variant={report.type === 'scheduled' ? 'default' : 'outline'}>
                            {report.type}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteBiReport(report.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        {report.spaceName} • {report.format.toUpperCase()} • {report.recipients.length} recipients
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {report.description}
                      </p>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted-foreground">
                          {report.lastRun && (
                            <div>Last run: {report.lastRun.toLocaleDateString()}</div>
                          )}
                          {report.nextRun && (
                            <div>Next run: {report.nextRun.toLocaleDateString()}</div>
                          )}
                        </div>
                        {report.isActive && (
                          <Badge variant="outline" className="text-green-600">Active</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runBiReport(report.id)}
                          className="flex-1"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Run
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="data-sources" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Data Sources</h3>
                <Dialog open={showDataSourceDialog} onOpenChange={setShowDataSourceDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Data Source
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Data Source</DialogTitle>
                      <DialogDescription>
                        Connect a new data source for reporting
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="source-name">Data Source Name</Label>
                        <Input
                          id="source-name"
                          value={newDataSource.name}
                          onChange={(e) => setNewDataSource({ ...newDataSource, name: e.target.value })}
                          placeholder="Sales Database"
                        />
                      </div>
                      <div>
                        <Label htmlFor="source-type">Type</Label>
                        <Select value={newDataSource.type} onValueChange={(value: any) => setNewDataSource({ ...newDataSource, type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="database">Database</SelectItem>
                            <SelectItem value="api">API</SelectItem>
                            <SelectItem value="file">File</SelectItem>
                            <SelectItem value="space_data">Space Data</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="source-connection">Connection</Label>
                        <Input
                          id="source-connection"
                          value={newDataSource.connection}
                          onChange={(e) => setNewDataSource({ ...newDataSource, connection: e.target.value })}
                          placeholder="Database connection string or API endpoint"
                        />
                      </div>
                      <div>
                        <Label htmlFor="source-space">Space (Optional)</Label>
                        <Select value={newDataSource.spaceId} onValueChange={(value) => setNewDataSource({ ...newDataSource, spaceId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a space" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No specific space</SelectItem>
                            {spaces.map(space => (
                              <SelectItem key={space.id} value={space.id}>
                                {space.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDataSourceDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createDataSource} disabled={!newDataSource.name || !newDataSource.connection}>
                        Add Data Source
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dataSources.map(source => (
                  <Card key={source.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        {source.name}
                      </CardTitle>
                      <CardDescription>
                        {source.type} • {source.spaceId ? 'Space-specific' : 'Global'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Connection:</span>
                          <div className="text-muted-foreground font-mono text-xs truncate">
                            {source.connection}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant={source.isActive ? 'default' : 'outline'}>
                            {source.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <h3 className="text-lg font-semibold">Chart Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {chartTemplates.map(template => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{template.icon}</span>
                        {template.name}
                      </CardTitle>
                      <CardDescription>
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{template.type}</Badge>
                        <Button size="sm" variant="outline">
                          <Plus className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Reports & Dashboards Tab */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Reports & Dashboards</h3>
              <p className="text-sm text-muted-foreground">
                Manage and organize your reports and dashboards from multiple sources
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push('/reports/integrations')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Integrations
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTemplates(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button onClick={() => router.push('/reports/new')}>
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchTerm('')
                  }
                }}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {(filters.source || filters.category || filters.status) && (
                <Badge variant="secondary" className="ml-2">
                  {[filters.source, filters.category, filters.status].filter(Boolean).length}
                </Badge>
              )}
            </Button>
            {selectedReports.size > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm(`Delete ${selectedReports.size} report(s)? This action cannot be undone.`)) {
                      handleBulkDelete()
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedReports.size})
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/reports/bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'update_status',
                          report_ids: Array.from(selectedReports),
                          is_active: true
                        })
                      })
                      if (!response.ok) throw new Error('Failed to update reports')
                      showSuccess(`${selectedReports.size} reports activated`)
                      setSelectedReports(new Set())
                      loadReports()
                    } catch (error: any) {
                      showError(error.message || ToastMessages.UPDATE_ERROR)
                    }
                  }}
                >
                  Activate ({selectedReports.size})
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={loadReports}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (reports.length === 0) {
                  showError('No reports to export')
                  return
                }
                exportReportsToExcel(reports, `reports-${new Date().toISOString().split('T')[0]}`)
                showSuccess(`Exported ${reports.length} reports`)
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <AdvancedFilters
              filters={filters}
              categories={categories}
              onFiltersChange={setFilters}
              onClear={() => setFilters({ source: '', category: '', status: '', showFavorites: false, dateFrom: '', dateTo: '' })}
            />
          )}

          {/* Reports Tabs */}
          <Tabs value={reportsTab} onValueChange={(v) => setReportsTab(v as 'all' | 'source-type')}>
            <TabsList>
              <TabsTrigger value="all">
                <FileText className="h-4 w-4 mr-2" />
                All Reports
              </TabsTrigger>
              <TabsTrigger value="source-type">
                <BarChart3 className="h-4 w-4 mr-2" />
                Source Type
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <ReportsTreeView
                reports={reports}
                categories={categories}
                folders={folders}
                loading={reportsLoading}
                searchTerm={searchTerm}
                selectedReports={selectedReports}
                onReportSelect={(reportId, selected) => {
                  setSelectedReports(prev => {
                    const newSet = new Set(prev)
                    if (selected) {
                      newSet.add(reportId)
                    } else {
                      newSet.delete(reportId)
                    }
                    return newSet
                  })
                }}
                onReportClick={(report) => {
                  if (report.source === 'BUILT_IN') {
                    router.push(`/reports/${report.id}`)
                  } else {
                    // For external sources, open in new tab or embed
                    if (report.embed_url) {
                      window.open(report.embed_url, '_blank')
                    } else if (report.link) {
                      window.open(report.link, '_blank')
                    }
                  }
                }}
                onCategoryClick={(category) => {
                  setSearchTerm(category.name)
                }}
                onRefresh={loadReports}
              />
            </TabsContent>

            <TabsContent value="source-type" className="mt-6">
              <SourceTypeView
                reports={reports}
                loading={reportsLoading}
                onSourceClick={(source) => {
                  const sourcePath = source.toLowerCase().replace(/_/g, '-')
                  if (sourcePath === 'built-in') {
                    router.push('/reports/new')
                  } else {
                    router.push(`/reports/source/${sourcePath}`)
                  }
                }}
              />
            </TabsContent>
          </Tabs>

          {/* Templates Dialog */}
          <ReportTemplatesDialog
            open={showTemplates}
            onOpenChange={setShowTemplates}
            onSelectTemplate={(template) => {
              router.push(`/reports/new?template=${template.id}`)
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

