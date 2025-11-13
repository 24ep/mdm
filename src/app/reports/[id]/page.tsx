'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  BarChart3,
  Power,
  Activity,
  Save,
  Share2,
  Star,
  StarOff
} from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import toast from 'react-hot-toast'
import type { Report } from '@/app/reports/page'
import { ReportPermissionsDialog } from '@/components/reports/ReportPermissionsDialog'
import { ReportEmbedPreview } from '@/components/reports/ReportEmbedPreview'
import { ReportShareDialog } from '@/components/reports/ReportShareDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function ReportViewPage() {
  const router = useRouter()
  const params = useParams()
  const { currentSpace } = useSpace()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    folder_id: ''
  })

  const reportId = params.id as string

  const loadReport = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports/${reportId}`)
      if (!response.ok) {
        throw new Error('Failed to load report')
      }

      const data = await response.json()
      setReport(data.report)
      setFormData({
        name: data.report.name,
        description: data.report.description || '',
        category_id: data.report.category_id || '',
        folder_id: data.report.folder_id || ''
      })
    } catch (error) {
      console.error('Error loading report:', error)
      toast.error('Failed to load report')
      router.push('/reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (reportId) {
      loadReport()
      loadFavoriteStatus()
    }
  }, [reportId])

  const loadFavoriteStatus = async () => {
    try {
      const stored = localStorage.getItem('report_favorites')
      const favorites = stored ? JSON.parse(stored) : []
      setIsFavorite(favorites.includes(reportId))
    } catch (error) {
      console.error('Error loading favorite status:', error)
    }
  }

  const toggleFavorite = () => {
    try {
      const stored = localStorage.getItem('report_favorites')
      const favorites = stored ? JSON.parse(stored) : []
      const newFavorites = isFavorite
        ? favorites.filter((id: string) => id !== reportId)
        : [...favorites, reportId]
      localStorage.setItem('report_favorites', JSON.stringify(newFavorites))
      setIsFavorite(!isFavorite)
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites')
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to update report')
      }

      toast.success('Report updated successfully')
      setEditing(false)
      loadReport()
    } catch (error: any) {
      console.error('Error updating report:', error)
      toast.error(error.message || 'Failed to update report')
    }
  }

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = async () => {

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete report')
      }

      toast.success('Report deleted successfully')
      router.push('/reports')
    } catch (error: any) {
      console.error('Error deleting report:', error)
      toast.error(error.message || 'Failed to delete report')
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'POWER_BI':
        return <Power className="h-6 w-6 text-orange-500" />
      case 'GRAFANA':
        return <Activity className="h-6 w-6 text-orange-500" />
      case 'LOOKER_STUDIO':
        return <Eye className="h-6 w-6 text-blue-500" />
      default:
        return <BarChart3 className="h-6 w-6 text-blue-500" />
    }
  }

  const getSourceLabel = (source: string) => {
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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading report...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!report) {
    return (
      <MainLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">Report not found</h3>
            <Button onClick={() => router.push('/reports')}>
              Back to Reports
            </Button>
          </CardContent>
        </Card>
      </MainLayout>
    )
  }

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
            <div className="flex items-center space-x-3">
              {getSourceIcon(report.source)}
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {editing ? 'Edit Report' : report.name}
                </h1>
                <p className="text-muted-foreground">
                  {getSourceLabel(report.source)} Report
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!editing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFavorite}
                >
                  {isFavorite ? (
                    <>
                      <Star className="h-4 w-4 mr-2 fill-yellow-500 text-yellow-500" />
                      Favorited
                    </>
                  ) : (
                    <>
                      <StarOff className="h-4 w-4 mr-2" />
                      Favorite
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShare(true)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPermissions(true)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Permissions
                </Button>
                {report.source === 'BUILT_IN' && (
                  <Button
                    variant="outline"
                    onClick={() => setEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {(report.embed_url || report.link) && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const url = report.embed_url || report.link
                        if (url) window.open(url, '_blank')
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {editing ? (
          <Card>
            <CardHeader>
              <CardTitle>Edit Report</CardTitle>
              <CardDescription>
                Update report information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name">Report Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false)
                    loadReport()
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Report Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{report.name}</p>
                </div>
                {report.description && (
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p>{report.description}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Source</Label>
                  <Badge>{getSourceLabel(report.source)}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={report.is_active ? 'default' : 'secondary'}>
                    {report.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {report.owner && (
                  <div>
                    <Label className="text-muted-foreground">Owner</Label>
                    <p>{report.owner}</p>
                  </div>
                )}
                {report.workspace && (
                  <div>
                    <Label className="text-muted-foreground">Workspace</Label>
                    <p>{report.workspace}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {report.source !== 'BUILT_IN' && (
              <Card>
                <CardHeader>
                  <CardTitle>External Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.embed_url && (
                    <div>
                      <Label className="text-muted-foreground">Embed URL</Label>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm truncate flex-1">{report.embed_url}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(report.embed_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {report.link && (
                    <div>
                      <Label className="text-muted-foreground">Link</Label>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm truncate flex-1">{report.link}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(report.link, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {report.source === 'BUILT_IN' && (
              <Card>
                <CardHeader>
                  <CardTitle>Report Builder</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Use the built-in visualization service to create and customize your report.
                  </p>
                  <Button onClick={() => router.push(`/dashboards/${report.id}/builder`)}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Open Builder
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Permissions Dialog */}
      <ReportShareDialog
        reportId={reportId}
        open={showShare}
        onOpenChange={setShowShare}
      />
      <ReportPermissionsDialog
        reportId={reportId}
        open={showPermissions}
        onOpenChange={setShowPermissions}
        onSuccess={loadReport}
      />

      {/* Embed Preview */}
      {report && (report.embed_url || report.link || (report.access_type === 'SDK' && report.metadata)) && (
        <ReportEmbedPreview
          report={report}
          open={showPreview}
          onOpenChange={setShowPreview}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{report?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                try {
                  const response = await fetch(`/api/reports/${reportId}`, {
                    method: 'DELETE'
                  })

                  if (!response.ok) {
                    throw new Error('Failed to delete report')
                  }

                  toast.success('Report deleted successfully')
                  setShowDeleteDialog(false)
                  router.push('/reports')
                } catch (error: any) {
                  console.error('Error deleting report:', error)
                  toast.error(error.message || 'Failed to delete report')
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}

