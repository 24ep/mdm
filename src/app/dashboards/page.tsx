'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  Share2, 
  Settings,
  BarChart3,
  Users,
  Globe,
  Lock,
  Clock,
  RefreshCw,
  Star,
  MoreHorizontal,
  Grid3X3,
  List
} from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { toast } from 'sonner'

type Dashboard = {
  id: string
  name: string
  description?: string
  type: 'CUSTOM' | 'TEMPLATE' | 'SYSTEM'
  visibility: 'PRIVATE' | 'PUBLIC' | 'SHARED'
  is_default: boolean
  is_active: boolean
  refresh_rate: number
  is_realtime: boolean
  public_link?: string
  background_color: string
  font_family: string
  font_size: number
  grid_size: number
  space_names: string[]
  space_slugs: string[]
  element_count: number
  datasource_count: number
  created_at: string
  updated_at: string
}

export default function DashboardsPage() {
  const router = useRouter()
  const { currentSpace } = useSpace()
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    type: 'CUSTOM' as const,
    visibility: 'PRIVATE' as const,
    refresh_rate: 300,
    is_realtime: false,
    background_color: '#ffffff',
    font_family: 'Inter',
    font_size: 14,
    grid_size: 12
  })

  const loadDashboards = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        ...(currentSpace?.id && { space_id: currentSpace.id }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/dashboards?${params}`)
      if (!response.ok) {
        throw new Error('Failed to load dashboards')
      }

      const data = await response.json()
      setDashboards(data.dashboards || [])
    } catch (error) {
      console.error('Error loading dashboards:', error)
      toast.error('Failed to load dashboards')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboards()
  }, [currentSpace?.id, searchTerm])

  const handleCreateDashboard = async () => {
    if (!createForm.name.trim()) {
      toast.error('Dashboard name is required')
      return
    }

    if (!currentSpace?.id) {
      toast.error('No space selected')
      return
    }

    try {
      setCreateLoading(true)
      const response = await fetch('/api/dashboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createForm,
          space_ids: [currentSpace.id]
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create dashboard')
      }

      const data = await response.json()
      toast.success('Dashboard created successfully')
      setShowCreateDialog(false)
      setCreateForm({
        name: '',
        description: '',
        type: 'CUSTOM',
        visibility: 'PRIVATE',
        refresh_rate: 300,
        is_realtime: false,
        background_color: '#ffffff',
        font_family: 'Inter',
        font_size: 14,
        grid_size: 12
      })
      
      // Navigate to dashboard builder
      router.push(`/dashboards/${data.dashboard.id}/builder`)
    } catch (error: any) {
      console.error('Error creating dashboard:', error)
      toast.error(error.message || 'Failed to create dashboard')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDeleteDashboard = async (dashboardId: string) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) {
      return
    }

    try {
      const response = await fetch(`/api/dashboards/${dashboardId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete dashboard')
      }

      toast.success('Dashboard deleted successfully')
      loadDashboards()
    } catch (error) {
      console.error('Error deleting dashboard:', error)
      toast.error('Failed to delete dashboard')
    }
  }

  const handleDuplicateDashboard = async (dashboardId: string) => {
    try {
      const response = await fetch(`/api/dashboards/${dashboardId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Copy of ${dashboards.find(d => d.id === dashboardId)?.name}`,
          space_ids: [currentSpace?.id].filter(Boolean)
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate dashboard')
      }

      toast.success('Dashboard duplicated successfully')
      loadDashboards()
    } catch (error) {
      console.error('Error duplicating dashboard:', error)
      toast.error('Failed to duplicate dashboard')
    }
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return <Globe className="h-4 w-4 text-green-500" />
      case 'SHARED':
        return <Share2 className="h-4 w-4 text-blue-500" />
      default:
        return <Lock className="h-4 w-4 text-gray-500" />
    }
  }

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return 'Public'
      case 'SHARED':
        return 'Shared'
      default:
        return 'Private'
    }
  }

  const filteredDashboards = dashboards.filter(dashboard =>
    dashboard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dashboard.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboards</h1>
            <p className="text-muted-foreground">
              Create and manage your data dashboards
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Dashboard
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dashboards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Dashboards List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboards...</p>
            </div>
          </div>
        ) : filteredDashboards.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No dashboards found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm 
                  ? 'No dashboards match your search criteria.'
                  : 'Get started by creating your first dashboard.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Dashboard
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDashboards.map((dashboard) => (
              <Card key={dashboard.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                        {dashboard.is_default && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {dashboard.description || 'No description'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getVisibilityIcon(dashboard.visibility)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{dashboard.element_count} elements</span>
                      <span>{dashboard.datasource_count} datasources</span>
                    </div>

                    {/* Spaces */}
                    {dashboard.space_names.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {dashboard.space_names.slice(0, 2).map((space, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {space}
                          </Badge>
                        ))}
                        {dashboard.space_names.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{dashboard.space_names.length - 2} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboards/${dashboard.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboards/${dashboard.id}/builder`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateDashboard(dashboard.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDashboard(dashboard.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getVisibilityLabel(dashboard.visibility)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Dashboard List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDashboards.map((dashboard) => (
                  <div key={dashboard.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold">{dashboard.name}</h3>
                        {dashboard.is_default && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                        {getVisibilityIcon(dashboard.visibility)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {dashboard.description || 'No description'}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{dashboard.element_count} elements</span>
                        <span>{dashboard.datasource_count} datasources</span>
                        <span>{dashboard.space_names.join(', ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboards/${dashboard.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboards/${dashboard.id}/builder`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicateDashboard(dashboard.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDashboard(dashboard.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Dashboard Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Dashboard</DialogTitle>
              <DialogDescription>
                Create a new dashboard to visualize your data
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Dashboard name"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={createForm.type}
                    onValueChange={(value: any) => setCreateForm({ ...createForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                      <SelectItem value="TEMPLATE">Template</SelectItem>
                      <SelectItem value="SYSTEM">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Dashboard description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={createForm.visibility}
                    onValueChange={(value: any) => setCreateForm({ ...createForm, visibility: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                      <SelectItem value="SHARED">Shared</SelectItem>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="refresh_rate">Refresh Rate (seconds)</Label>
                  <Input
                    id="refresh_rate"
                    type="number"
                    value={createForm.refresh_rate}
                    onChange={(e) => setCreateForm({ ...createForm, refresh_rate: parseInt(e.target.value) || 300 })}
                    min="0"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="realtime"
                  checked={createForm.is_realtime}
                  onCheckedChange={(checked) => setCreateForm({ ...createForm, is_realtime: checked })}
                />
                <Label htmlFor="realtime">Real-time updates</Label>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="background_color">Background Color</Label>
                  <Input
                    id="background_color"
                    type="color"
                    value={createForm.background_color}
                    onChange={(e) => setCreateForm({ ...createForm, background_color: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="font_family">Font Family</Label>
                  <Select
                    value={createForm.font_family}
                    onValueChange={(value) => setCreateForm({ ...createForm, font_family: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="font_size">Font Size</Label>
                  <Input
                    id="font_size"
                    type="number"
                    value={createForm.font_size}
                    onChange={(e) => setCreateForm({ ...createForm, font_size: parseInt(e.target.value) || 14 })}
                    min="8"
                    max="24"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDashboard} disabled={createLoading}>
                {createLoading ? 'Creating...' : 'Create Dashboard'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
