'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Globe,
  Eye,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Settings,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Archive,
  Edit,
  Trash2,
  Plus,
  Copy,
  Download,
  Upload,
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  Shield,
  Lock,
  Unlock
} from 'lucide-react'
import { format } from 'date-fns'

interface PagePublication {
  id: string
  pageId: string
  pageName: string
  status: 'draft' | 'scheduled' | 'published' | 'archived' | 'error'
  version: string
  publishedAt?: string
  scheduledAt?: string
  publishedBy: string
  publishedTo: string[]
  visibility: 'public' | 'private' | 'restricted'
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  analytics: {
    views: number
    uniqueViews: number
    bounceRate: number
    avgTimeOnPage: number
    lastViewed?: string
  }
  performance: {
    loadTime: number
    score: number
    issues: string[]
  }
  permissions: {
    canView: string[]
    canEdit: string[]
    canPublish: string[]
  }
}

interface PagePublishingManagerProps {
  publications: PagePublication[]
  onCreatePublication: (publication: Omit<PagePublication, 'id'>) => void
  onUpdatePublication: (id: string, updates: Partial<PagePublication>) => void
  onDeletePublication: (id: string) => void
  onPublishNow: (id: string) => void
  onSchedulePublish: (id: string, scheduledAt: string) => void
  onUnpublish: (id: string) => void
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onPreview: (id: string) => void
  onExport: (id: string) => void
  onImport: (file: File) => void
}

export function PagePublishingManager({
  publications,
  onCreatePublication,
  onUpdatePublication,
  onDeletePublication,
  onPublishNow,
  onSchedulePublish,
  onUnpublish,
  onArchive,
  onRestore,
  onPreview,
  onExport,
  onImport
}: PagePublishingManagerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'analytics' | 'settings'>('overview')
  const [selectedPublication, setSelectedPublication] = useState<PagePublication | null>(null)
  const [isCreatingPublication, setIsCreatingPublication] = useState(false)
  const [newPublication, setNewPublication] = useState({
    pageName: '',
    version: '1.0.0',
    visibility: 'public' as const,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [''],
    scheduledAt: undefined as Date | undefined
  })

  const getStatusColor = useCallback((status: PagePublication['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'published': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const getStatusIcon = useCallback((status: PagePublication['status']) => {
    switch (status) {
      case 'draft': return <Edit className="h-4 w-4" />
      case 'scheduled': return <Clock className="h-4 w-4" />
      case 'published': return <Globe className="h-4 w-4" />
      case 'archived': return <Archive className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      default: return <Edit className="h-4 w-4" />
    }
  }, [])

  const handleCreatePublication = useCallback(() => {
    if (!newPublication.pageName) return

    const publication: Omit<PagePublication, 'id'> = {
      pageId: 'page-' + Date.now(),
      pageName: newPublication.pageName,
      status: newPublication.scheduledAt ? 'scheduled' : 'draft',
      version: newPublication.version,
      scheduledAt: newPublication.scheduledAt?.toISOString(),
      publishedBy: 'current-user',
      publishedTo: [],
      visibility: newPublication.visibility,
      seoTitle: newPublication.seoTitle,
      seoDescription: newPublication.seoDescription,
      seoKeywords: newPublication.seoKeywords.filter(k => k.trim()),
      analytics: {
        views: 0,
        uniqueViews: 0,
        bounceRate: 0,
        avgTimeOnPage: 0
      },
      performance: {
        loadTime: 0,
        score: 0,
        issues: []
      },
      permissions: {
        canView: [],
        canEdit: [],
        canPublish: []
      }
    }

    onCreatePublication(publication)
    setIsCreatingPublication(false)
    setNewPublication({
      pageName: '',
      version: '1.0.0',
      visibility: 'public',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: [''],
      scheduledAt: undefined
    })
  }, [newPublication, onCreatePublication])

  const sortedPublications = publications.sort((a, b) => {
    const dateA = new Date(a.publishedAt || a.scheduledAt || '')
    const dateB = new Date(b.publishedAt || b.scheduledAt || '')
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Page Publishing Manager
          </h2>
          <p className="text-muted-foreground">
            Manage page publications, scheduling, and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab('schedule')}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          <Button onClick={() => setIsCreatingPublication(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Publication
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {publications.filter(p => p.status === 'published').length}
                </div>
                <div className="text-sm text-muted-foreground">Published</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {publications.filter(p => p.status === 'scheduled').length}
                </div>
                <div className="text-sm text-muted-foreground">Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-2xl font-bold">
                  {publications.filter(p => p.status === 'draft').length}
                </div>
                <div className="text-sm text-muted-foreground">Drafts</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {publications.reduce((sum, p) => sum + p.analytics.views, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted rounded-lg p-1">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('overview')}
        >
          <Eye className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeTab === 'schedule' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('schedule')}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Schedule
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Analytics
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('settings')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Create Publication Dialog */}
      {isCreatingPublication && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Publication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Page Name</Label>
                <Input
                  value={newPublication.pageName}
                  onChange={(e) => setNewPublication(prev => ({ ...prev, pageName: e.target.value }))}
                  placeholder="My Awesome Page"
                />
              </div>
              <div>
                <Label>Version</Label>
                <Input
                  value={newPublication.version}
                  onChange={(e) => setNewPublication(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="1.0.0"
                />
              </div>
            </div>

            <div>
              <Label>Visibility</Label>
              <Select
                value={newPublication.visibility}
                onValueChange={(value: any) => setNewPublication(prev => ({ ...prev, visibility: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>SEO Title</Label>
              <Input
                value={newPublication.seoTitle}
                onChange={(e) => setNewPublication(prev => ({ ...prev, seoTitle: e.target.value }))}
                placeholder="Page Title for Search Engines"
              />
            </div>

            <div>
              <Label>SEO Description</Label>
              <Textarea
                value={newPublication.seoDescription}
                onChange={(e) => setNewPublication(prev => ({ ...prev, seoDescription: e.target.value }))}
                placeholder="Page description for search engines..."
                rows={3}
              />
            </div>

            <div>
              <Label>Schedule Publication</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newPublication.scheduledAt ? format(newPublication.scheduledAt, 'PPP') : 'Publish immediately'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newPublication.scheduledAt}
                    onSelect={(date) => setNewPublication(prev => ({ ...prev, scheduledAt: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreatingPublication(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePublication}>
                Create Publication
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {sortedPublications.map(publication => (
            <Card key={publication.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(publication.status)}`}>
                      {getStatusIcon(publication.status)}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {publication.pageName}
                        <Badge variant="outline">{publication.version}</Badge>
                        <Badge variant="outline">{publication.visibility}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {publication.publishedAt 
                          ? `Published ${new Date(publication.publishedAt).toLocaleDateString()}`
                          : publication.scheduledAt 
                            ? `Scheduled for ${new Date(publication.scheduledAt).toLocaleDateString()}`
                            : 'Draft'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPreview(publication.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onExport(publication.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {publication.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => onPublishNow(publication.id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Publish Now
                      </Button>
                    )}
                    {publication.status === 'published' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUnpublish(publication.id)}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Unpublish
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeletePublication(publication.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Views</div>
                    <div className="text-lg font-semibold">{publication.analytics.views}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Unique Views</div>
                    <div className="text-lg font-semibold">{publication.analytics.uniqueViews}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Bounce Rate</div>
                    <div className="text-lg font-semibold">{publication.analytics.bounceRate}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Avg. Time</div>
                    <div className="text-lg font-semibold">{publication.analytics.avgTimeOnPage}s</div>
                  </div>
                </div>
                
                {publication.performance.issues.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Performance Issues</span>
                    </div>
                    <ul className="text-sm text-yellow-600 mt-1">
                      {publication.performance.issues.map((issue, index) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Scheduled Publications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {publications.filter(p => p.status === 'scheduled').map(publication => (
                <div key={publication.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{publication.pageName}</div>
                    <div className="text-sm text-muted-foreground">
                      Scheduled for {publication.scheduledAt && new Date(publication.scheduledAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPublishNow(publication.id)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Publish Now
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeletePublication(publication.id)}
                      className="text-red-600 hover:text-red-700"
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

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Publication Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {publications.filter(p => p.status === 'published').map(publication => (
                  <div key={publication.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">{publication.pageName}</h3>
                      <Badge variant="outline">{publication.version}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{publication.analytics.views}</div>
                        <div className="text-sm text-muted-foreground">Total Views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{publication.analytics.uniqueViews}</div>
                        <div className="text-sm text-muted-foreground">Unique Views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{publication.analytics.bounceRate}%</div>
                        <div className="text-sm text-muted-foreground">Bounce Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{publication.analytics.avgTimeOnPage}s</div>
                        <div className="text-sm text-muted-foreground">Avg. Time</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Publishing Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Auto-publish on approval</div>
                  <div className="text-sm text-muted-foreground">Automatically publish pages when approved</div>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email notifications</div>
                  <div className="text-sm text-muted-foreground">Send email notifications for publication events</div>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Performance monitoring</div>
                  <div className="text-sm text-muted-foreground">Monitor page performance and report issues</div>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
