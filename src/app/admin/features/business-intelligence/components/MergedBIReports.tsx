'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  BarChart3,
  FileText,
  Download,
  Settings,
  Plus,
  Trash2,
  Filter,
  RefreshCw,
  Search,
  ChevronDown,
  LayoutDashboard,
  Link as LinkIcon
} from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { showSuccess, showError, ToastMessages } from '@/lib/toast-utils'
import { ReportsTreeView } from '@/components/reports/ReportsTreeView'
import { AdvancedFilters } from '@/components/reports/AdvancedFilters'
import { ReportTemplatesDialog } from '@/components/reports/ReportTemplatesDialog'
import { IntegrationSelectionModal } from '@/components/reports/IntegrationSelectionModal'
import { EmbedReportDialog } from '@/components/reports/EmbedReportDialog'
import { exportReportsToExcel } from '@/lib/utils/export-utils'
import { SpaceSelector } from '@/components/project-management/SpaceSelector'

export type ReportSource = 'BUILT_IN' | 'BUILT_IN_VISUALIZE' | 'CUSTOM_EMBED_LINK' | 'POWER_BI' | 'GRAFANA' | 'LOOKER_STUDIO'

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
  const { currentSpace, spaces } = useSpace()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(currentSpace?.id || 'all')

  // Reports State
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
  const [showIntegrationModal, setShowIntegrationModal] = useState(false)
  const [showEmbedModal, setShowEmbedModal] = useState(false)
  const [showCreateReportDialog, setShowCreateReportDialog] = useState(false)
  const [createReportSpaceId, setCreateReportSpaceId] = useState<string>(selectedSpaceId !== 'all' ? selectedSpaceId : '')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set())
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  // Debounce search term
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearchTerm(value)
  }, 300)

  useEffect(() => {
    loadReports()
  }, [])

  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  // Sync local selection when global space changes
  useEffect(() => {
    if (currentSpace?.id) {
      setSelectedSpaceId(currentSpace.id)
    }
  }, [currentSpace?.id])

  useEffect(() => {
    loadReports()
  }, [selectedSpaceId, debouncedSearchTerm, filters.source, filters.category, filters.status, filters.showFavorites])


  const loadReports = async () => {
    try {
      setReportsLoading(true)
      const params = new URLSearchParams({
        ...(selectedSpaceId && selectedSpaceId !== 'all' && { space_id: selectedSpaceId }),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            BI & Reports
          </h2>
          <p className="text-muted-foreground">
            Manage and organize your reports and dashboards from multiple sources
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <SpaceSelector
            value={selectedSpaceId}
            onValueChange={setSelectedSpaceId}
            className="w-[180px]"
            showAllOption={true}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add dashboard/Report
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => {
                setCreateReportSpaceId(selectedSpaceId !== 'all' ? selectedSpaceId : '')
                setShowCreateReportDialog(true)
              }}>
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Create new building dashboard/report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowIntegrationModal(true)}>
                <Download className="h-4 w-4 mr-2" />
                Import dashboard from external
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowEmbedModal(true)}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Embed custom report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            onClick={() => setShowIntegrationModal(true)}
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

      {/* Reports View */}
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

      {/* Templates Dialog */}
      <ReportTemplatesDialog
        open={showTemplates}
        onOpenChange={setShowTemplates}
        onSelectTemplate={(template) => {
          router.push(`/reports/new?template=${template.id}`)
        }}
      />

      {/* Integration Selection Modal */}
      <IntegrationSelectionModal
        open={showIntegrationModal}
        onOpenChange={setShowIntegrationModal}
        spaceId={currentSpace?.id}
        onSuccess={() => {
          setShowIntegrationModal(false)
          loadReports()
        }}
      />

      {/* Embed Report Modal */}
      <EmbedReportDialog
        open={showEmbedModal}
        onOpenChange={setShowEmbedModal}
        spaceId={currentSpace?.id}
        onSuccess={() => {
          setShowEmbedModal(false)
          loadReports()
        }}
      />

      {/* Create Report Space Selection Dialog */}
      <Dialog open={showCreateReportDialog} onOpenChange={setShowCreateReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Space for New Report</DialogTitle>
            <DialogDescription>
              Choose the space where you want to create your new dashboard/report.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <SpaceSelector
              value={createReportSpaceId}
              onValueChange={setCreateReportSpaceId}
              className="w-full"
              showAllOption={false}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateReportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const selectedSpace = spaces.find(s => s.id === createReportSpaceId)
                if (selectedSpace?.slug) {
                  router.push(`/${selectedSpace.slug}/studio`)
                  setShowCreateReportDialog(false)
                }
              }}
              disabled={!createReportSpaceId}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

