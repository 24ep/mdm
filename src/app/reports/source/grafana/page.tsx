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
  Activity,
  Search,
  Eye,
  ExternalLink,
  Settings,
  Plus,
  ArrowLeft
} from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { toast } from 'sonner'

interface GrafanaDashboard {
  id: string
  name: string
  description?: string
  uid?: string
  folder_id?: number
  folder_title?: string
  org_id?: number
  owner?: string
  embed_url?: string
  public_link?: string
  access_type: 'SDK' | 'EMBED' | 'PUBLIC'
  is_active: boolean
  created_at: string
  updated_at: string
  metadata?: {
    tags?: string[]
    version?: number
    refresh?: string
    [key: string]: any
  }
}

export default function GrafanaReportsPage() {
  const router = useRouter()
  const { currentSpace } = useSpace()
  const [dashboards, setDashboards] = useState<GrafanaDashboard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const loadDashboards = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        source: 'grafana',
        ...(currentSpace?.id && { space_id: currentSpace.id }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/reports?${params}`)
      if (!response.ok) {
        throw new Error('Failed to load Grafana dashboards')
      }

      const data = await response.json()
      setDashboards(data.reports || [])
    } catch (error) {
      console.error('Error loading Grafana dashboards:', error)
      toast.error('Failed to load Grafana dashboards')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboards()
  }, [currentSpace?.id, searchTerm])

  const handleOpenDashboard = (dashboard: GrafanaDashboard) => {
    if (dashboard.embed_url) {
      window.open(dashboard.embed_url, '_blank')
    } else if (dashboard.public_link) {
      window.open(dashboard.public_link, '_blank')
    } else {
      toast.error('No link available for this dashboard')
    }
  }

  const getAccessTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      'SDK': 'default',
      'EMBED': 'secondary',
      'PUBLIC': 'outline'
    }
    return <Badge variant={variants[type] || 'outline'}>{type}</Badge>
  }

  const filteredDashboards = dashboards.filter(dashboard =>
    dashboard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dashboard.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dashboard.folder_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dashboard.owner?.toLowerCase().includes(searchTerm.toLowerCase())
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
                <Activity className="h-8 w-8 text-orange-500" />
                Grafana Dashboards
              </h1>
              <p className="text-muted-foreground">
                Manage and view dashboards from Grafana
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push('/reports/integrations?source=grafana')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Integration Settings
            </Button>
            <Button onClick={() => router.push('/reports/integrations?source=grafana&action=add')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Dashboard
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Grafana dashboards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Dashboards Table */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading Grafana dashboards...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredDashboards.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Grafana dashboards found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm 
                  ? 'No dashboards match your search criteria.'
                  : 'Connect your Grafana instance or add dashboards to get started.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => router.push('/reports/integrations?source=grafana&action=add')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Grafana Dashboard
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Grafana Dashboards ({filteredDashboards.length})</CardTitle>
              <CardDescription>
                View and manage your Grafana dashboards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Folder</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Access Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDashboards.map((dashboard) => (
                    <TableRow key={dashboard.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{dashboard.name}</div>
                          {dashboard.description && (
                            <div className="text-sm text-muted-foreground">{dashboard.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{dashboard.folder_title || '-'}</TableCell>
                      <TableCell>{dashboard.owner || '-'}</TableCell>
                      <TableCell>{getAccessTypeBadge(dashboard.access_type)}</TableCell>
                      <TableCell>
                        <Badge variant={dashboard.is_active ? 'default' : 'secondary'}>
                          {dashboard.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDashboard(dashboard)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(dashboard.embed_url || dashboard.public_link) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const url = dashboard.embed_url || dashboard.public_link
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

