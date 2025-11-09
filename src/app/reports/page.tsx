'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { MainLayout } from '@/components/layout/main-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  Folder,
  BarChart3,
  FileText,
  Settings,
  Power,
  Activity,
  Eye,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Filter,
  X,
  Star,
  StarOff,
  Download,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useSpace } from '@/contexts/space-context'
import { showSuccess, showError, ToastMessages } from '@/lib/toast-utils'
import { ReportsTreeView } from '@/components/reports/ReportsTreeView'
import { SourceTypeView } from '@/components/reports/SourceTypeView'
import { AdvancedFilters } from '@/components/reports/AdvancedFilters'
import { ReportTemplatesDialog } from '@/components/reports/ReportTemplatesDialog'
import { exportReportsToExcel, exportReportsToCSV, exportReportsToJSON } from '@/lib/utils/export-utils'

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

export default function ReportsPage() {
  const router = useRouter()
  const { currentSpace } = useSpace()
  const [activeTab, setActiveTab] = useState<'all' | 'source-type'>('all')
  const [reports, setReports] = useState<Report[]>([])
  const [categories, setCategories] = useState<ReportCategory[]>([])
  const [folders, setFolders] = useState<ReportFolder[]>([])
  const [loading, setLoading] = useState(true)
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

  // Debounce search term
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearchTerm(value)
  }, 300)

  const loadReports = async () => {
    try {
      setLoading(true)
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
      setLoading(false)
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

  // Update debounced search when searchTerm changes
  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  useEffect(() => {
    loadReports()
  }, [currentSpace?.id, debouncedSearchTerm, filters.source, filters.category, filters.status, filters.showFavorites])

  const getSourceIcon = (source: ReportSource) => {
    switch (source) {
      case 'POWER_BI':
        return <Power className="h-4 w-4" />
      case 'GRAFANA':
        return <Activity className="h-4 w-4" />
      case 'LOOKER_STUDIO':
        return <Eye className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
    }
  }

  const getSourceLabel = (source: ReportSource) => {
    switch (source) {
      case 'POWER_BI':
        return 'Power BI'
      case 'GRAFANA':
        return 'Grafana'
      case 'LOOKER_STUDIO':
        return 'Looker Studio'
      default:
        return 'Built-in'
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Dashboards</h1>
            <p className="text-muted-foreground">
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
                  // Use AlertDialog for better UX
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'source-type')}>
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
              loading={loading}
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
                // Filter by category
                setSearchTerm(category.name)
              }}
              onRefresh={loadReports}
            />
          </TabsContent>

          <TabsContent value="source-type" className="mt-6">
            <SourceTypeView
              reports={reports}
              loading={loading}
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
            // Navigate to create report with template
            router.push(`/reports/new?template=${template.id}`)
          }}
        />
      </div>
    </MainLayout>
  )
}

