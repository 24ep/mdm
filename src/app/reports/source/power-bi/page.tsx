'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Power,
  Search,
  Eye,
  ExternalLink,
  Settings,
  Plus,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { toast } from 'sonner'

interface PowerBIReport {
  id: string
  name: string
  description?: string
  owner?: string
  workspace?: string
  workspace_id?: string
  report_id?: string
  dataset_id?: string
  embed_url?: string
  public_link?: string
  api_url?: string
  access_type: 'API' | 'SDK' | 'EMBED' | 'PUBLIC'
  is_active: boolean
  created_at: string
  updated_at: string
  metadata?: {
    refresh_schedule?: string
    last_refresh?: string
    permissions?: string[]
    [key: string]: any
  }
}

export default function PowerBIReportsPage() {
  const router = useRouter()
  const { currentSpace } = useSpace()
  const [reports, setReports] = useState<PowerBIReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const loadReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        source: 'power-bi',
        ...(currentSpace?.id && { space_id: currentSpace.id }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/reports?${params}`)
      if (!response.ok) {
        throw new Error('Failed to load Power BI reports')
      }

      const data = await response.json()
      setReports(data.reports || [])
    } catch (error) {
      console.error('Error loading Power BI reports:', error)
      toast.error('Failed to load Power BI reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [currentSpace?.id, searchTerm])

  const handleOpenReport = (report: PowerBIReport) => {
    if (report.embed_url) {
      window.open(report.embed_url, '_blank')
    } else if (report.public_link) {
      window.open(report.public_link, '_blank')
    } else {
      toast.error('No link available for this report')
    }
  }

  const getAccessTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      'API': 'default',
      'SDK': 'secondary',
      'EMBED': 'outline',
      'PUBLIC': 'default'
    }
    return <Badge variant={variants[type] || 'outline'}>{type}</Badge>
  }

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.workspace?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.owner?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/reports')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Power className="h-8 w-8 text-orange-500" />
                Power BI Reports
              </h1>
              <p className="text-muted-foreground">
                Manage and view reports from Microsoft Power BI
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push('/reports/integrations?source=power-bi')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Integration Settings
            </Button>
            <Button onClick={() => router.push('/reports/integrations?source=power-bi&action=add')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Report
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Power BI reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Reports Table */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading Power BI reports...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredReports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Power className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Power BI reports found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm 
                  ? 'No reports match your search criteria.'
                  : 'Connect your Power BI account or add reports to get started.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => router.push('/reports/integrations?source=power-bi&action=add')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Power BI Report
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Power BI Reports ({filteredReports.length})</CardTitle>
              <CardDescription>
                View and manage your Power BI reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Workspace</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Access Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.name}</div>
                          {report.description && (
                            <div className="text-sm text-muted-foreground">{report.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{report.workspace || '-'}</TableCell>
                      <TableCell>{report.owner || '-'}</TableCell>
                      <TableCell>{getAccessTypeBadge(report.access_type)}</TableCell>
                      <TableCell>
                        <Badge variant={report.is_active ? 'default' : 'secondary'}>
                          {report.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenReport(report)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(report.embed_url || report.public_link) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const url = report.embed_url || report.public_link
                                if (url) window.open(url, '_blank')
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}

