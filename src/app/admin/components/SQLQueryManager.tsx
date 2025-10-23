'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Database, 
  Code, 
  Share, 
  Edit, 
  Eye, 
  Trash2, 
  Plus, 
  Download,
  Upload,
  GitBranch,
  Users,
  Lock,
  Unlock,
  Copy,
  Play,
  Save,
  History,
  Star,
  Fork,
  Settings,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react'
import { SQLQueryExecutor } from '@/components/sql/SQLQueryExecutor'

interface SQLQuery {
  id: string
  name: string
  description: string
  sql: string
  spaceId: string
  spaceName: string
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
  isPublic: boolean
  tags: string[]
  permissions: QueryPermission[]
  gitIntegration?: GitIntegration
  version: number
  isStarred: boolean
  forkCount: number
  lastExecuted?: Date
  executionCount: number
}

interface QueryPermission {
  userId: string
  userName: string
  userEmail: string
  permission: 'view' | 'edit' | 'owner'
  grantedBy: string
  grantedAt: Date
}

interface GitIntegration {
  repository: string
  branch: string
  filePath: string
  lastSync: Date
  autoSync: boolean
  provider: 'github' | 'gitlab'
}

interface QueryVersion {
  id: string
  queryId: string
  version: number
  sql: string
  description: string
  createdBy: string
  createdAt: Date
}

export function SQLQueryManager() {
  const [queries, setQueries] = useState<SQLQuery[]>([])
  const [selectedQuery, setSelectedQuery] = useState<SQLQuery | null>(null)
  const [queryVersions, setQueryVersions] = useState<QueryVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateQuery, setShowCreateQuery] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showGitDialog, setShowGitDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpace, setSelectedSpace] = useState<string>('all')
  const [spaces, setSpaces] = useState<Array<{id: string, name: string}>>([])
  const [activeTab, setActiveTab] = useState('details')

  const [newQuery, setNewQuery] = useState({
    name: '',
    description: '',
    sql: '',
    spaceId: '',
    isPublic: false,
    tags: ''
  })

  const [shareSettings, setShareSettings] = useState({
    userId: '',
    permission: 'view' as const,
    message: ''
  })

  const [gitSettings, setGitSettings] = useState({
    repository: '',
    branch: 'main',
    filePath: '',
    provider: 'github' as const,
    autoSync: false
  })

  useEffect(() => {
    loadSpaces()
    loadQueries()
  }, [])

  useEffect(() => {
    if (selectedQuery) {
      loadQueryVersions(selectedQuery.id)
    }
  }, [selectedQuery])

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

  const loadQueries = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/sql-queries')
      if (response.ok) {
        const data = await response.json()
        setQueries(data.queries.map((query: any) => ({
          ...query,
          createdAt: new Date(query.createdAt),
          updatedAt: new Date(query.updatedAt),
          lastExecuted: query.lastExecuted ? new Date(query.lastExecuted) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading queries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadQueryVersions = async (queryId: string) => {
    try {
      const response = await fetch(`/api/admin/sql-queries/${queryId}/versions`)
      if (response.ok) {
        const data = await response.json()
        setQueryVersions(data.versions.map((version: any) => ({
          ...version,
          createdAt: new Date(version.createdAt)
        })))
      }
    } catch (error) {
      console.error('Error loading query versions:', error)
    }
  }

  const createQuery = async () => {
    try {
      const response = await fetch('/api/admin/sql-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newQuery,
          tags: newQuery.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        })
      })

      if (response.ok) {
        setShowCreateQuery(false)
        setNewQuery({
          name: '',
          description: '',
          sql: '',
          spaceId: '',
          isPublic: false,
          tags: ''
        })
        loadQueries()
      }
    } catch (error) {
      console.error('Error creating query:', error)
    }
  }

  const updateQuery = async (queryId: string, updates: Partial<SQLQuery>) => {
    try {
      const response = await fetch(`/api/admin/sql-queries/${queryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        loadQueries()
        if (selectedQuery?.id === queryId) {
          setSelectedQuery({ ...selectedQuery, ...updates })
        }
      }
    } catch (error) {
      console.error('Error updating query:', error)
    }
  }

  const deleteQuery = async (queryId: string) => {
    if (!confirm('Are you sure you want to delete this query?')) return

    try {
      const response = await fetch(`/api/admin/sql-queries/${queryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadQueries()
        if (selectedQuery?.id === queryId) {
          setSelectedQuery(null)
        }
      }
    } catch (error) {
      console.error('Error deleting query:', error)
    }
  }

  const shareQuery = async () => {
    if (!selectedQuery) return

    try {
      const response = await fetch(`/api/admin/sql-queries/${selectedQuery.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shareSettings)
      })

      if (response.ok) {
        setShowShareDialog(false)
        setShareSettings({
          userId: '',
          permission: 'view',
          message: ''
        })
        loadQueries()
      }
    } catch (error) {
      console.error('Error sharing query:', error)
    }
  }

  const setupGitIntegration = async () => {
    if (!selectedQuery) return

    try {
      const response = await fetch(`/api/admin/sql-queries/${selectedQuery.id}/git`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gitSettings)
      })

      if (response.ok) {
        setShowGitDialog(false)
        setGitSettings({
          repository: '',
          branch: 'main',
          filePath: '',
          provider: 'github',
          autoSync: false
        })
        loadQueries()
      }
    } catch (error) {
      console.error('Error setting up Git integration:', error)
    }
  }

  const syncToGit = async (queryId: string) => {
    try {
      const response = await fetch(`/api/admin/sql-queries/${queryId}/git/sync`, {
        method: 'POST'
      })

      if (response.ok) {
        loadQueries()
      }
    } catch (error) {
      console.error('Error syncing to Git:', error)
    }
  }

  const forkQuery = async (queryId: string) => {
    try {
      const response = await fetch(`/api/admin/sql-queries/${queryId}/fork`, {
        method: 'POST'
      })

      if (response.ok) {
        loadQueries()
      }
    } catch (error) {
      console.error('Error forking query:', error)
    }
  }

  const starQuery = async (queryId: string) => {
    try {
      const response = await fetch(`/api/admin/sql-queries/${queryId}/star`, {
        method: 'POST'
      })

      if (response.ok) {
        loadQueries()
      }
    } catch (error) {
      console.error('Error starring query:', error)
    }
  }

  const filteredQueries = queries.filter(query => {
    const matchesSearch = query.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesSpace = selectedSpace === 'all' || query.spaceId === selectedSpace
    return matchesSearch && matchesSpace
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Code className="h-6 w-6" />
            SQL Query Manager
          </h2>
          <p className="text-muted-foreground">
            Create, share, and collaborate on SQL queries with Git integration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadQueries} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search queries..."
            className="pl-8"
          />
        </div>
        <Select value={selectedSpace} onValueChange={setSelectedSpace}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by space" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Spaces</SelectItem>
            {spaces.map(space => (
              <SelectItem key={space.id} value={space.id}>
                {space.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={showCreateQuery} onOpenChange={setShowCreateQuery}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Query
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create SQL Query</DialogTitle>
              <DialogDescription>
                Create a new SQL query with sharing and Git integration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="query-name">Query Name</Label>
                  <Input
                    id="query-name"
                    value={newQuery.name}
                    onChange={(e) => setNewQuery({ ...newQuery, name: e.target.value })}
                    placeholder="Sales Analysis Query"
                  />
                </div>
                <div>
                  <Label htmlFor="query-space">Space</Label>
                  <Select value={newQuery.spaceId} onValueChange={(value) => setNewQuery({ ...newQuery, spaceId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a space" />
                    </SelectTrigger>
                    <SelectContent>
                      {spaces.map(space => (
                        <SelectItem key={space.id} value={space.id}>
                          {space.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="query-description">Description</Label>
                <Textarea
                  id="query-description"
                  value={newQuery.description}
                  onChange={(e) => setNewQuery({ ...newQuery, description: e.target.value })}
                  placeholder="Query description and purpose"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="query-sql">SQL Query</Label>
                <Textarea
                  id="query-sql"
                  value={newQuery.sql}
                  onChange={(e) => setNewQuery({ ...newQuery, sql: e.target.value })}
                  placeholder="SELECT * FROM users WHERE created_at > '2024-01-01';"
                  rows={8}
                  className="font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="query-tags">Tags (comma-separated)</Label>
                  <Input
                    id="query-tags"
                    value={newQuery.tags}
                    onChange={(e) => setNewQuery({ ...newQuery, tags: e.target.value })}
                    placeholder="analytics, sales, reporting"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={newQuery.isPublic} 
                    onCheckedChange={(checked) => setNewQuery({ ...newQuery, isPublic: checked })}
                  />
                  <Label>Make Public</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateQuery(false)}>
                Cancel
              </Button>
              <Button onClick={createQuery} disabled={!newQuery.name || !newQuery.sql}>
                Create Query
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Queries ({filteredQueries.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {filteredQueries.map(query => (
                    <Card
                      key={query.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        selectedQuery?.id === query.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedQuery(query)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{query.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {query.spaceName}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {query.isPublic && (
                              <Badge variant="outline" className="text-xs">Public</Badge>
                            )}
                            {query.isStarred && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {query.description}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>v{query.version}</span>
                          <span>{query.executionCount} runs</span>
                        </div>
                        {query.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {query.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {query.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{query.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Query Details */}
        <div className="lg:col-span-2">
          {selectedQuery ? (
            <div className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="execute">Execute</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Code className="h-5 w-5" />
                            {selectedQuery.name}
                          </CardTitle>
                          <CardDescription>
                            {selectedQuery.spaceName} • v{selectedQuery.version} • {selectedQuery.executionCount} runs
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => starQuery(selectedQuery.id)}
                          >
                            <Star className={`h-3 w-3 mr-1 ${selectedQuery.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
                            {selectedQuery.forkCount}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => forkQuery(selectedQuery.id)}
                          >
                            <Fork className="h-3 w-3 mr-1" />
                            Fork
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowShareDialog(true)}
                          >
                            <Share className="h-3 w-3 mr-1" />
                            Share
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowGitDialog(true)}
                          >
                            <GitBranch className="h-3 w-3 mr-1" />
                            Git
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label>Description</Label>
                          <div className="text-sm text-muted-foreground mt-1">
                            {selectedQuery.description}
                          </div>
                        </div>
                        <div>
                          <Label>SQL Query</Label>
                          <div className="mt-2 p-4 bg-muted rounded-lg">
                            <pre className="text-sm font-mono whitespace-pre-wrap">
                              {selectedQuery.sql}
                            </pre>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Button onClick={() => setActiveTab('execute')}>
                            <Play className="h-4 w-4 mr-2" />
                            Execute
                          </Button>
                          <Button variant="outline">
                            <Save className="h-4 w-4 mr-2" />
                            Save Version
                          </Button>
                          <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                </TabsContent>

                <TabsContent value="execute" className="space-y-6">
                  <SQLQueryExecutor
                    queryId={selectedQuery.id}
                    sql={selectedQuery.sql}
                    onExecutionComplete={(result) => {
                      console.log('Query execution completed:', result)
                    }}
                  />
                </TabsContent>

                <TabsContent value="permissions" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Permissions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedQuery.permissions.map(permission => (
                          <div key={permission.userId} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <div className="font-medium">{permission.userName}</div>
                              <div className="text-sm text-muted-foreground">{permission.userEmail}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={permission.permission === 'owner' ? 'default' : 'outline'}>
                                {permission.permission}
                              </Badge>
                              <Button size="sm" variant="ghost">
                                <Settings className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Version History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {queryVersions.map(version => (
                          <div key={version.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <div className="font-medium">Version {version.version}</div>
                              <div className="text-sm text-muted-foreground">{version.description}</div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {version.createdAt.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Git Integration */}
              {selectedQuery.gitIntegration && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5" />
                      Git Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Repository</span>
                        <span className="text-sm text-muted-foreground">{selectedQuery.gitIntegration.repository}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Branch</span>
                        <span className="text-sm text-muted-foreground">{selectedQuery.gitIntegration.branch}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Last Sync</span>
                        <span className="text-sm text-muted-foreground">
                          {selectedQuery.gitIntegration.lastSync.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <Button size="sm" onClick={() => syncToGit(selectedQuery.id)}>
                          <Upload className="h-3 w-3 mr-1" />
                          Sync to Git
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Pull from Git
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Code className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select a Query</h3>
              <p className="text-muted-foreground">
                Choose a query from the list to view details and manage permissions
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Query</DialogTitle>
            <DialogDescription>
              Share this query with other users and set permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="share-user">User Email</Label>
              <Input
                id="share-user"
                value={shareSettings.userId}
                onChange={(e) => setShareSettings({ ...shareSettings, userId: e.target.value })}
                placeholder="user@company.com"
              />
            </div>
            <div>
              <Label htmlFor="share-permission">Permission</Label>
              <Select value={shareSettings.permission} onValueChange={(value: any) => setShareSettings({ ...shareSettings, permission: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="share-message">Message (Optional)</Label>
              <Textarea
                id="share-message"
                value={shareSettings.message}
                onChange={(e) => setShareSettings({ ...shareSettings, message: e.target.value })}
                placeholder="Add a message for the user"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={shareQuery} disabled={!shareSettings.userId}>
              Share Query
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Git Integration Dialog */}
      <Dialog open={showGitDialog} onOpenChange={setShowGitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Git Integration</DialogTitle>
            <DialogDescription>
              Connect this query to a Git repository for version control and backup
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="git-provider">Provider</Label>
              <Select value={gitSettings.provider} onValueChange={(value: any) => setGitSettings({ ...gitSettings, provider: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="github">GitHub</SelectItem>
                  <SelectItem value="gitlab">GitLab</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="git-repository">Repository URL</Label>
              <Input
                id="git-repository"
                value={gitSettings.repository}
                onChange={(e) => setGitSettings({ ...gitSettings, repository: e.target.value })}
                placeholder="https://github.com/username/repository"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="git-branch">Branch</Label>
                <Input
                  id="git-branch"
                  value={gitSettings.branch}
                  onChange={(e) => setGitSettings({ ...gitSettings, branch: e.target.value })}
                  placeholder="main"
                />
              </div>
              <div>
                <Label htmlFor="git-filepath">File Path</Label>
                <Input
                  id="git-filepath"
                  value={gitSettings.filePath}
                  onChange={(e => setGitSettings({ ...gitSettings, filePath: e.target.value }))}
                  placeholder="queries/sales-analysis.sql"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={gitSettings.autoSync} 
                onCheckedChange={(checked) => setGitSettings({ ...gitSettings, autoSync: checked })}
              />
              <Label>Auto-sync on changes</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={setupGitIntegration} disabled={!gitSettings.repository}>
              Setup Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
