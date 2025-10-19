import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  History, 
  Plus, 
  Trash2, 
  Download, 
  RotateCcw, 
  Clock, 
  User, 
  Tag,
  Calendar,
  GitBranch,
  Save
} from 'lucide-react'
import { toast } from 'sonner'

interface DashboardVersion {
  id: string
  name: string
  description: string
  version: string
  created_at: string
  created_by: string
  is_current: boolean
  dashboard_data: any
  tags: string[]
}

interface VersioningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dashboardId: string
  currentDashboard: any
  onVersionSelect: (version: DashboardVersion) => void
  onVersionCreate: (version: Omit<DashboardVersion, 'id' | 'created_at'>) => void
  onVersionRestore: (versionId: string) => void
  onVersionDelete: (versionId: string) => void
}

const MOCK_VERSIONS: DashboardVersion[] = [
  {
    id: '1',
    name: 'Initial Version',
    description: 'First version of the dashboard',
    version: '1.0.0',
    created_at: '2024-01-15T10:30:00Z',
    created_by: 'John Doe',
    is_current: false,
    dashboard_data: {},
    tags: ['initial', 'baseline']
  },
  {
    id: '2',
    name: 'Added Sales Charts',
    description: 'Added new sales performance charts and KPIs',
    version: '1.1.0',
    created_at: '2024-01-20T14:15:00Z',
    created_by: 'Jane Smith',
    is_current: false,
    dashboard_data: {},
    tags: ['sales', 'charts']
  },
  {
    id: '3',
    name: 'Current Version',
    description: 'Latest version with all improvements',
    version: '1.2.0',
    created_at: '2024-01-25T09:45:00Z',
    created_by: 'Bob Johnson',
    is_current: true,
    dashboard_data: {},
    tags: ['current', 'latest']
  }
]

export function VersioningDialog({ 
  open, 
  onOpenChange, 
  dashboardId, 
  currentDashboard,
  onVersionSelect,
  onVersionCreate,
  onVersionRestore,
  onVersionDelete
}: VersioningDialogProps) {
  const [versions, setVersions] = useState<DashboardVersion[]>(MOCK_VERSIONS)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newVersion, setNewVersion] = useState({
    name: '',
    description: '',
    version: '',
    tags: [] as string[]
  })
  const [tagInput, setTagInput] = useState('')

  const handleCreateVersion = () => {
    if (!newVersion.name.trim() || !newVersion.version.trim()) {
      toast.error('Name and version are required')
      return
    }

    const versionData = {
      ...newVersion,
      created_by: 'Current User', // In real app, get from auth context
      is_current: false,
      dashboard_data: currentDashboard
    }

    onVersionCreate(versionData)
    
    // Add to local state
    const newVersionWithId: DashboardVersion = {
      ...versionData,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }
    
    setVersions(prev => [newVersionWithId, ...prev])
    setShowCreateForm(false)
    setNewVersion({ name: '', description: '', version: '', tags: [] })
    toast.success('Version created successfully')
  }

  const handleRestoreVersion = (version: DashboardVersion) => {
    onVersionRestore(version.id)
    
    // Update current version
    setVersions(prev => prev.map(v => ({
      ...v,
      is_current: v.id === version.id
    })))
    
    toast.success(`Restored to version ${version.version}`)
  }

  const handleDeleteVersion = (versionId: string) => {
    onVersionDelete(versionId)
    setVersions(prev => prev.filter(v => v.id !== versionId))
    toast.success('Version deleted successfully')
  }

  const addTag = () => {
    if (tagInput.trim() && !newVersion.tags.includes(tagInput.trim())) {
      setNewVersion(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setNewVersion(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard Versioning</DialogTitle>
          <DialogDescription>
            Manage dashboard versions, create snapshots, and track changes over time.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="versions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="versions">Version History</TabsTrigger>
            <TabsTrigger value="create">Create Version</TabsTrigger>
          </TabsList>
          
          <TabsContent value="versions" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Version History</h3>
                <p className="text-sm text-muted-foreground">
                  Manage and restore previous versions of your dashboard
                </p>
              </div>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Version
              </Button>
            </div>

            <div className="space-y-4">
              {versions.map((version) => (
                <Card key={version.id} className={`${version.is_current ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <GitBranch className="h-5 w-5" />
                          <div>
                            <CardTitle className="text-lg">{version.name}</CardTitle>
                            <CardDescription>Version {version.version}</CardDescription>
                          </div>
                        </div>
                        {version.is_current && (
                          <Badge variant="default">Current</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreVersion(version)}
                          disabled={version.is_current}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteVersion(version.id)}
                          disabled={version.is_current}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{version.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(version.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{version.created_by}</span>
                        </div>
                      </div>
                      
                      {version.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {version.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="create" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Create New Version</h3>
              <p className="text-sm text-muted-foreground">
                Save the current state of your dashboard as a new version
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="version-name">Version Name</Label>
                <Input
                  id="version-name"
                  value={newVersion.name}
                  onChange={(e) => setNewVersion(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Added Analytics Dashboard"
                />
              </div>
              
              <div>
                <Label htmlFor="version-number">Version Number</Label>
                <Input
                  id="version-number"
                  value={newVersion.version}
                  onChange={(e) => setNewVersion(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="e.g., 1.3.0"
                />
              </div>
              
              <div>
                <Label htmlFor="version-description">Description</Label>
                <Textarea
                  id="version-description"
                  value={newVersion.description}
                  onChange={(e) => setNewVersion(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what changes were made in this version..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Tags</Label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button variant="outline" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {newVersion.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {newVersion.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleCreateVersion}>
                  <Save className="h-4 w-4 mr-2" />
                  Create Version
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
