'use client'

import { useState } from 'react'
import { useReports } from '../hooks/useReports'
import { ReportsListProps, ReportFilters } from '../types'
import { SpaceSelector } from '@/components/project-management/SpaceSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Plus, Eye, ExternalLink, Loader } from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { useRouter } from 'next/navigation'

/**
 * Single-source ReportsList component
 * Can be used in both space-scoped and admin views
 */
export function ReportsList({
  spaceId = null,
  showFilters = true,
  showSpaceSelector = false,
  viewMode = 'list',
}: ReportsListProps) {
  const router = useRouter()
  const { currentSpace } = useSpace()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    spaceId || currentSpace?.id || 'all'
  )
  const [filters, setFilters] = useState<ReportFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'list' | 'tree'>(viewMode as 'list' | 'tree')

  // Determine effective spaceId for filtering
  const effectiveSpaceId = showSpaceSelector
    ? selectedSpaceId === 'all'
      ? null
      : selectedSpaceId
    : spaceId

  const { reports, loading, refetch, spaceFilter } = useReports({
    spaceId: effectiveSpaceId,
    filters,
  })

  const filteredReports = reports.filter((report) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = report.name?.toLowerCase().includes(query)
      const matchesDescription = report.description?.toLowerCase().includes(query)
      if (!matchesName && !matchesDescription) return false
    }
    return true
  })

  const handleReportClick = (report: any) => {
    router.push(`/reports/${report.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">View and manage your reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push('/reports/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      {showFilters && (
        <div className="flex items-center gap-4 flex-wrap">
          {showSpaceSelector && (
            <SpaceSelector
              value={selectedSpaceId}
              onValueChange={setSelectedSpaceId}
              className="w-[200px]"
              showAllOption={true}
            />
          )}

          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.sourceType || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, sourceType: value === 'all' ? undefined : (value as any) })
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Source Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="power-bi">Power BI</SelectItem>
                <SelectItem value="grafana">Grafana</SelectItem>
                <SelectItem value="looker-studio">Looker Studio</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="plugin">Plugin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No reports found. Create your first report to get started.
            </div>
          ) : (
            filteredReports.map((report) => (
              <Card
                key={report.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleReportClick(report)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    <Badge variant="outline">{report.sourceType}</Badge>
                  </div>
                  {report.description && (
                    <CardDescription>{report.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReportClick(report)
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    {report.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(report.url, '_blank')
                        }}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}

