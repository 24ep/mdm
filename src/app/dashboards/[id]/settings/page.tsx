'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { 
  Save, 
  ArrowLeft, 
  Settings, 
  Users, 
  Globe, 
  Lock, 
  RefreshCw,
  Share2,
  Trash2,
  Plus,
  X,
  Star,
  Eye,
  Edit
} from 'lucide-react'
import { toast } from 'sonner'

type Dashboard = {
  id: string
  name: string
  description?: string
  type: string
  visibility: string
  is_default: boolean
  is_active: boolean
  refresh_rate: number
  is_realtime: boolean
  public_link?: string
  background_color: string
  background_image?: string
  font_family: string
  font_size: number
  grid_size: number
  space_names: string[]
  space_slugs: string[]
  permissions: any[]
}

type Space = {
  id: string
  name: string
  slug: string
}

type User = {
  id: string
  name: string
  email: string
}

export default function DashboardSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const dashboardId = params.id as string

  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [showAddPermissionDialog, setShowAddPermissionDialog] = useState(false)
  const [newPermission, setNewPermission] = useState({
    user_id: '',
    role: 'VIEWER'
  })

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboards/${dashboardId}`)
      if (!response.ok) {
        throw new Error('Failed to load dashboard')
      }

      const data = await response.json()
      setDashboard(data.dashboard)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

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

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  useEffect(() => {
    if (dashboardId) {
      loadDashboard()
      loadSpaces()
      loadUsers()
    }
  }, [dashboardId])

  const saveDashboard = async () => {
    if (!dashboard) return

    try {
      setSaving(true)
      const response = await fetch(`/api/dashboards/${dashboardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dashboard),
      })

      if (!response.ok) {
        throw new Error('Failed to save dashboard')
      }

      toast.success('Dashboard settings saved successfully')
    } catch (error) {
      console.error('Error saving dashboard:', error)
      toast.error('Failed to save dashboard settings')
    } finally {
      setSaving(false)
    }
  }

  const addPermission = async () => {
    if (!newPermission.user_id) {
      toast.error('Please select a user')
      return
    }

    try {
      const response = await fetch(`/api/dashboards/${dashboardId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPermission),
      })

      if (!response.ok) {
        throw new Error('Failed to add permission')
      }

      toast.success('Permission added successfully')
      setShowAddPermissionDialog(false)
      setNewPermission({ user_id: '', role: 'VIEWER' })
      loadDashboard()
    } catch (error) {
      console.error('Error adding permission:', error)
      toast.error('Failed to add permission')
    }
  }

  const removePermission = async (userId: string) => {
    try {
      const response = await fetch(`/api/dashboards/${dashboardId}/permissions/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove permission')
      }

      toast.success('Permission removed successfully')
      loadDashboard()
    } catch (error) {
      console.error('Error removing permission:', error)
      toast.error('Failed to remove permission')
    }
  }

  const generatePublicLink = async () => {
    try {
      const response = await fetch(`/api/dashboards/${dashboardId}/shares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          share_type: 'PUBLIC'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate public link')
      }

      const data = await response.json()
      setDashboard({
        ...dashboard!,
        public_link: data.share.share_token
      })
      toast.success('Public link generated successfully')
    } catch (error) {
      console.error('Error generating public link:', error)
      toast.error('Failed to generate public link')
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard settings...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!dashboard) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Dashboard not found</h2>
            <p className="text-muted-foreground mb-4">The dashboard you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/dashboards')}>
              Back to Dashboards
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard Settings</h1>
              <p className="text-muted-foreground">{dashboard.name}</p>
            </div>
          </div>
          <Button onClick={saveDashboard} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="sharing">Sharing</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Configure the basic settings for your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Dashboard Name</Label>
                  <Input
                    id="name"
                    value={dashboard.name}
                    onChange={(e) => setDashboard({ ...dashboard, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={dashboard.description || ''}
                    onChange={(e) => setDashboard({ ...dashboard, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={dashboard.type}
                      onValueChange={(value) => setDashboard({ ...dashboard, type: value })}
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
                  <div>
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select
                      value={dashboard.visibility}
                      onValueChange={(value) => setDashboard({ ...dashboard, visibility: value })}
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Refresh Settings</CardTitle>
                <CardDescription>
                  Configure how often the dashboard updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="realtime"
                    checked={dashboard.is_realtime}
                    onCheckedChange={(checked) => setDashboard({ ...dashboard, is_realtime: checked })}
                  />
                  <Label htmlFor="realtime">Real-time updates</Label>
                </div>
                {!dashboard.is_realtime && (
                  <div>
                    <Label htmlFor="refresh_rate">Refresh Rate (seconds)</Label>
                    <Input
                      id="refresh_rate"
                      type="number"
                      value={dashboard.refresh_rate}
                      onChange={(e) => setDashboard({ ...dashboard, refresh_rate: parseInt(e.target.value) || 300 })}
                      min="0"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Permissions</CardTitle>
                <CardDescription>
                  Manage who can view and edit this dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{permission.user_name}</p>
                        <p className="text-sm text-muted-foreground">{permission.user_email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{permission.role}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePermission(permission.user_id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => setShowAddPermissionDialog(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Permission
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sharing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Public Sharing</CardTitle>
                <CardDescription>
                  Share your dashboard with a public link
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboard.public_link ? (
                  <div className="space-y-2">
                    <Label>Public Link</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={`${window.location.origin}/dashboards/public/${dashboard.public_link}`}
                        readOnly
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/dashboards/public/${dashboard.public_link}`)
                          toast.success('Link copied to clipboard')
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No public link</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate a public link to share this dashboard with anyone
                    </p>
                    <Button onClick={generatePublicLink}>
                      Generate Public Link
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize the look and feel of your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="background_color">Background Color</Label>
                    <ColorInput
                      value={dashboard.background_color}
                      onChange={(color) => setDashboard({ ...dashboard, background_color: color })}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#ffffff"
                      inputClassName="h-10 text-xs pl-7"
                    />
                  </div>
                  <div>
                    <Label htmlFor="font_family">Font Family</Label>
                    <Select
                      value={dashboard.font_family}
                      onValueChange={(value) => setDashboard({ ...dashboard, font_family: value })}
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="font_size">Font Size</Label>
                    <Input
                      id="font_size"
                      type="number"
                      value={dashboard.font_size}
                      onChange={(e) => setDashboard({ ...dashboard, font_size: parseInt(e.target.value) || 14 })}
                      min="8"
                      max="24"
                    />
                  </div>
                  <div>
                    <Label htmlFor="grid_size">Grid Size</Label>
                    <Input
                      id="grid_size"
                      type="number"
                      value={dashboard.grid_size}
                      onChange={(e) => setDashboard({ ...dashboard, grid_size: parseInt(e.target.value) || 12 })}
                      min="6"
                      max="24"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Permission Dialog */}
        <Dialog open={showAddPermissionDialog} onOpenChange={setShowAddPermissionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User Permission</DialogTitle>
              <DialogDescription>
                Grant access to this dashboard for a specific user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user">User</Label>
                <Select
                  value={newPermission.user_id}
                  onValueChange={(value) => setNewPermission({ ...newPermission, user_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newPermission.role}
                  onValueChange={(value) => setNewPermission({ ...newPermission, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                    <SelectItem value="EDITOR">Editor</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddPermissionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addPermission}>
                Add Permission
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
