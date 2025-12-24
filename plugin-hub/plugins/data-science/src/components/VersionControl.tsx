'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  GitBranch, 
  GitCommit, 
  GitMerge, 
  GitPullRequest, 
  History, 
  RotateCcw, 
  Save, 
  Download, 
  Upload,
  Plus,
  Minus,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  MessageSquare,
  Code,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface VersionControlProps {
  notebookId?: string
  notebookData?: any // Current notebook data for versioning
  onCommit?: (commit: Commit) => Promise<any> | any // Should return notebook data to save
  onBranch?: (branch: Branch) => void
  onMerge?: (merge: Merge) => void
  onRevert?: (version: Version) => void // Should restore notebook to this version
  onExport?: (version: Version, format: string) => void
}

interface Version {
  id: string
  commitId: string
  message: string
  author: string
  authorEmail: string
  timestamp: Date
  changes: Change[]
  branch: string
  tags: string[]
  isCurrent: boolean
}

interface Change {
  type: 'added' | 'modified' | 'deleted' | 'renamed'
  file: string
  linesAdded: number
  linesDeleted: number
  content?: string
}

interface Commit {
  id: string
  message: string
  description?: string
  author: string
  timestamp: Date
  changes: Change[]
  branch: string
}

interface Branch {
  name: string
  description?: string
  isCurrent: boolean
  lastCommit?: string
  lastCommitDate?: Date
  ahead: number
  behind: number
}

interface Merge {
  source: string
  target: string
  message: string
  conflicts?: Conflict[]
}

interface Conflict {
  file: string
  type: 'content' | 'binary'
  description: string
  resolution?: 'ours' | 'theirs' | 'manual'
}

interface Diff {
  file: string
  oldContent: string
  newContent: string
  changes: DiffChange[]
}

interface DiffChange {
  type: 'added' | 'deleted' | 'modified'
  oldLine?: number
  newLine?: number
  content: string
}

export function VersionControl({ 
  notebookId,
  notebookData,
  onCommit,
  onBranch,
  onMerge,
  onRevert,
  onExport
}: VersionControlProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'branches' | 'changes' | 'merge'>('history')
  const [versions, setVersions] = useState<Version[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [currentBranch, setCurrentBranch] = useState<string>('main')
  const [uncommittedChanges, setUncommittedChanges] = useState<Change[]>([])
  const [commitMessage, setCommitMessage] = useState('')
  const [commitDescription, setCommitDescription] = useState('')
  const [newBranchName, setNewBranchName] = useState('')
  const [newBranchDescription, setNewBranchDescription] = useState('')
  const [selectedVersion, setSelectedVersion] = useState<string>('')
  const [showDiff, setShowDiff] = useState(false)
  const [diff, setDiff] = useState<Diff | null>(null)

  useEffect(() => {
    if (!notebookId) return

    // Fetch versions from API
    const fetchVersions = async () => {
      try {
        const response = await fetch(`/api/notebooks/${encodeURIComponent(notebookId)}/versions`)
        if (!response.ok) {
          throw new Error('Failed to fetch versions')
        }

        const data = await response.json()
        if (data.success && data.versions) {
          // Transform API versions to component format
          const transformedVersions: Version[] = data.versions.map((v: any) => ({
            id: v.id,
            commitId: v.id.substring(0, 7), // Short commit ID
            message: v.commit_message || 'No message',
            author: v.author || 'Unknown',
            authorEmail: v.author_email || '',
            timestamp: new Date(v.created_at),
            changes: v.change_summary
              ? [
                  ...(v.change_summary.files_added || []).map((f: string) => ({
                    type: 'added' as const,
                    file: f,
                    linesAdded: v.change_summary.lines_added || 0,
                    linesDeleted: 0
                  })),
                  ...(v.change_summary.files_modified || []).map((f: string) => ({
                    type: 'modified' as const,
                    file: f,
                    linesAdded: v.change_summary.lines_added || 0,
                    linesDeleted: v.change_summary.lines_deleted || 0
                  })),
                  ...(v.change_summary.files_deleted || []).map((f: string) => ({
                    type: 'deleted' as const,
                    file: f,
                    linesAdded: 0,
                    linesDeleted: v.change_summary.lines_deleted || 0
                  }))
                ]
              : [{ type: 'modified' as const, file: 'notebook.ipynb', linesAdded: 0, linesDeleted: 0 }],
            branch: v.branch_name || 'main',
            tags: v.tags || [],
            isCurrent: v.is_current || false
          }))

          setVersions(transformedVersions)

          // Extract unique branches from versions
          const branchMap = new Map<string, Branch>()
          transformedVersions.forEach((v) => {
            if (!branchMap.has(v.branch)) {
              branchMap.set(v.branch, {
                name: v.branch,
                description: '',
                isCurrent: v.isCurrent,
                lastCommit: v.commitId,
                lastCommitDate: v.timestamp,
                ahead: 0,
                behind: 0
              })
            }
          })
          setBranches(Array.from(branchMap.values()))
          setCurrentBranch(
            transformedVersions.find((v) => v.isCurrent)?.branch || 'main'
          )
        }
      } catch (error) {
        console.error('Error fetching versions:', error)
        toast.error('Failed to load version history')
      }
    }

    fetchVersions()
  }, [notebookId])

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      toast.error('Please enter a commit message')
      return
    }

    if (!notebookId) {
      toast.error('Notebook ID is required')
      return
    }

    try {
      // Calculate change summary
      const changeSummary = {
        files_added: uncommittedChanges.filter((c) => c.type === 'added').map((c) => c.file),
        files_modified: uncommittedChanges.filter((c) => c.type === 'modified').map((c) => c.file),
        files_deleted: uncommittedChanges.filter((c) => c.type === 'deleted').map((c) => c.file),
        lines_added: uncommittedChanges.reduce((sum, c) => sum + c.linesAdded, 0),
        lines_deleted: uncommittedChanges.reduce((sum, c) => sum + c.linesDeleted, 0)
      }

      // Get notebook data from props or callback
      let dataToSave = notebookData
      
      if (onCommit) {
        const commit: Commit = {
          id: `commit-${Date.now()}`,
          message: commitMessage,
          description: commitDescription,
          author: 'Current User',
          timestamp: new Date(),
          changes: uncommittedChanges,
          branch: currentBranch
        }
        
        const result = await onCommit(commit)
        if (result) {
          dataToSave = result
        }
      }

      if (!dataToSave) {
        toast.error('Notebook data is required for versioning')
        return
      }

      // Create version via API
      const response = await fetch(`/api/notebooks/${encodeURIComponent(notebookId)}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebook_data: notebookData,
          commit_message: commitMessage,
          commit_description: commitDescription,
          branch_name: currentBranch,
          tags: [],
          change_summary: changeSummary,
          is_current: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create version')
      }

      const data = await response.json()

      // Refresh versions list
      const versionsResponse = await fetch(`/api/notebooks/${encodeURIComponent(notebookId)}/versions`)
      if (versionsResponse.ok) {
        const versionsData = await versionsResponse.json()
        if (versionsData.success && versionsData.versions) {
          const transformedVersions: Version[] = versionsData.versions.map((v: any) => ({
            id: v.id,
            commitId: v.id.substring(0, 7),
            message: v.commit_message || 'No message',
            author: v.author || 'Unknown',
            authorEmail: v.author_email || '',
            timestamp: new Date(v.created_at),
            changes: v.change_summary
              ? [
                  ...(v.change_summary.files_added || []).map((f: string) => ({
                    type: 'added' as const,
                    file: f,
                    linesAdded: v.change_summary.lines_added || 0,
                    linesDeleted: 0
                  })),
                  ...(v.change_summary.files_modified || []).map((f: string) => ({
                    type: 'modified' as const,
                    file: f,
                    linesAdded: v.change_summary.lines_added || 0,
                    linesDeleted: v.change_summary.lines_deleted || 0
                  })),
                  ...(v.change_summary.files_deleted || []).map((f: string) => ({
                    type: 'deleted' as const,
                    file: f,
                    linesAdded: 0,
                    linesDeleted: v.change_summary.lines_deleted || 0
                  }))
                ]
              : [{ type: 'modified' as const, file: 'notebook.ipynb', linesAdded: 0, linesDeleted: 0 }],
            branch: v.branch_name || 'main',
            tags: v.tags || [],
            isCurrent: v.is_current || false
          }))
          setVersions(transformedVersions)
        }
      }

      setUncommittedChanges([])
      setCommitMessage('')
      setCommitDescription('')
      toast.success('Changes committed successfully')
    } catch (error: any) {
      console.error('Error committing version:', error)
      toast.error('Failed to commit changes')
    }
  }

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) {
      toast.error('Please enter a branch name')
      return
    }

    const branch: Branch = {
      name: newBranchName,
      description: newBranchDescription,
      isCurrent: false,
      lastCommit: versions[0]?.commitId,
      lastCommitDate: versions[0]?.timestamp,
      ahead: 0,
      behind: 0
    }

    setBranches(prev => prev.map(b => ({ ...b, isCurrent: false })).concat(branch))
    setNewBranchName('')
    setNewBranchDescription('')
    onBranch?.(branch)
    toast.success(`Branch '${newBranchName}' created`)
  }

  const handleSwitchBranch = (branchName: string) => {
    setBranches(prev => prev.map(b => ({ ...b, isCurrent: b.name === branchName })))
    setCurrentBranch(branchName)
    toast.success(`Switched to branch '${branchName}'`)
  }

  const handleRevert = async (version: Version) => {
    if (!notebookId) {
      toast.error('Notebook ID is required')
      return
    }

    try {
      // Restore version via API
      const response = await fetch(
        `/api/notebooks/${encodeURIComponent(notebookId)}/versions/${version.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to restore version')
      }

      const data = await response.json()

      // Call onRevert callback with restored version data
      onRevert?.(version)

      // Refresh versions list
      const versionsResponse = await fetch(`/api/notebooks/${encodeURIComponent(notebookId)}/versions`)
      if (versionsResponse.ok) {
        const versionsData = await versionsResponse.json()
        if (versionsData.success && versionsData.versions) {
          const transformedVersions: Version[] = versionsData.versions.map((v: any) => ({
            id: v.id,
            commitId: v.id.substring(0, 7),
            message: v.commit_message || 'No message',
            author: v.author || 'Unknown',
            authorEmail: v.author_email || '',
            timestamp: new Date(v.created_at),
            changes: v.change_summary ? [] : [],
            branch: v.branch_name || 'main',
            tags: v.tags || [],
            isCurrent: v.is_current || false
          }))
          setVersions(transformedVersions)
        }
      }

      toast.success(`Reverted to version ${version.commitId}`)
    } catch (error: any) {
      console.error('Error reverting version:', error)
      toast.error('Failed to revert version')
    }
  }

  const handleExport = (version: Version, format: string) => {
    onExport?.(version, format)
    toast.success(`Exported version ${version.commitId} as ${format}`)
  }

  const handleShowDiff = async (version: Version) => {
    if (!notebookId) {
      toast.error('Notebook ID is required')
      return
    }

    try {
      // Get current version ID
      const currentVersion = versions.find((v) => v.isCurrent)
      if (!currentVersion) {
        toast.error('Current version not found')
        return
      }

      // Fetch diff from API
      const response = await fetch(`/api/notebooks/${encodeURIComponent(notebookId)}/versions/diff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebook_id: notebookId,
          version1_id: version.id,
          version2_id: currentVersion.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch diff')
      }

      const data = await response.json()
      if (data.success && data.diff) {
        const diffData = data.diff

        // Transform diff to display format
        const diffChanges: DiffChange[] = []

        // Add cell changes
        diffData.changes.cells_added.forEach((cell: any) => {
          diffChanges.push({
            type: 'added',
            newLine: 1,
            content: `+ Added cell (${cell.type}): ${(cell.content || '').substring(0, 50)}...`
          })
        })

        diffData.changes.cells_deleted.forEach((cell: any) => {
          diffChanges.push({
            type: 'deleted',
            oldLine: 1,
            content: `- Deleted cell (${cell.type}): ${(cell.content || '').substring(0, 50)}...`
          })
        })

        diffData.changes.cells_modified.forEach((change: any) => {
          if (change.type === 'content') {
            diffChanges.push({
              type: 'modified',
              oldLine: 1,
              newLine: 1,
              content: `~ Modified cell content`
            })
          }
        })

        setDiff({
          file: 'notebook.ipynb',
          oldContent: `Version ${diffData.version1.version_number}`,
          newContent: `Version ${diffData.version2.version_number}`,
          changes: diffChanges.length > 0 ? diffChanges : [
            { type: 'modified', oldLine: 1, newLine: 1, content: 'No changes detected' }
          ]
        })

        setSelectedVersion(version.id)
        setShowDiff(true)
      }
    } catch (error: any) {
      console.error('Error fetching diff:', error)
      toast.error('Failed to load diff')
      
      // Fallback to mock diff
      setSelectedVersion(version.id)
      setDiff({
        file: 'notebook.ipynb',
        oldContent: 'Previous version content...',
        newContent: 'Current version content...',
        changes: [
          { type: 'added', newLine: 1, content: '+ New line added' },
          { type: 'deleted', oldLine: 2, content: '- Old line removed' },
          { type: 'modified', oldLine: 3, newLine: 3, content: '~ Modified line' }
        ]
      })
      setShowDiff(true)
    }
  }

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'added': return <Plus className="h-4 w-4 text-green-500" />
      case 'deleted': return <Minus className="h-4 w-4 text-red-500" />
      case 'modified': return <Code className="h-4 w-4 text-blue-500" />
      case 'renamed': return <FileText className="h-4 w-4 text-yellow-500" />
      default: return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'added': return 'text-green-600 bg-green-50 dark:bg-green-950/30'
      case 'deleted': return 'text-red-600 bg-red-50 dark:bg-red-950/30'
      case 'modified': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30'
      case 'renamed': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950/30'
    }
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="changes">Changes</TabsTrigger>
          <TabsTrigger value="merge">Merge</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                Version History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {versions.map((version, index) => (
                  <div key={version.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <GitCommit className="h-4 w-4 text-gray-500" />
                          <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                            {version.commitId}
                          </span>
                          {version.isCurrent && (
                            <Badge variant="default" className="text-xs">
                              Current
                            </Badge>
                          )}
                          {version.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <h3 className="font-medium mb-1">{version.message}</h3>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{version.author}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{version.timestamp.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <GitBranch className="h-3 w-3" />
                            <span>{version.branch}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {version.changes.map((change, changeIndex) => (
                            <div key={changeIndex} className={`flex items-center space-x-2 p-2 rounded ${getChangeColor(change.type)}`}>
                              {getChangeIcon(change.type)}
                              <span className="text-sm font-medium">{change.file}</span>
                              <span className="text-xs">
                                +{change.linesAdded} -{change.linesDeleted}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShowDiff(version)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Diff
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport(version, 'ipynb')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                        {!version.isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevert(version)}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Revert
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <GitBranch className="h-5 w-5 mr-2" />
                  Branches
                </CardTitle>
                <Button onClick={() => setActiveTab('changes')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Branch
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {branches.map(branch => (
                  <div key={branch.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <GitBranch className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{branch.name}</span>
                        {branch.isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      {branch.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {branch.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Last commit: {branch.lastCommit}</span>
                        {branch.ahead > 0 && (
                          <span className="text-green-600">+{branch.ahead} ahead</span>
                        )}
                        {branch.behind > 0 && (
                          <span className="text-red-600">-{branch.behind} behind</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!branch.isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwitchBranch(branch.name)}
                        >
                          Switch
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <GitMerge className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="h-5 w-5 mr-2" />
                Uncommitted Changes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create Branch */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold mb-3">Create New Branch</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="branchName">Branch Name</Label>
                    <Input
                      id="branchName"
                      placeholder="feature/new-feature"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="branchDescription">Description (Optional)</Label>
                    <Input
                      id="branchDescription"
                      placeholder="Description of the new feature"
                      value={newBranchDescription}
                      onChange={(e) => setNewBranchDescription(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCreateBranch} disabled={!newBranchName.trim()}>
                    <GitBranch className="h-4 w-4 mr-2" />
                    Create Branch
                  </Button>
                </div>
              </div>

              {/* Changes List */}
              <div className="space-y-2">
                <h3 className="font-semibold">Modified Files</h3>
                {uncommittedChanges.map((change, index) => (
                  <div key={index} className={`flex items-center space-x-2 p-2 rounded ${getChangeColor(change.type)}`}>
                    {getChangeIcon(change.type)}
                    <span className="font-medium">{change.file}</span>
                    <span className="text-sm">
                      +{change.linesAdded} -{change.linesDeleted}
                    </span>
                  </div>
                ))}
              </div>

              {/* Commit Form */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold mb-3">Commit Changes</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="commitMessage">Commit Message</Label>
                    <Input
                      id="commitMessage"
                      placeholder="Add descriptive commit message"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="commitDescription">Description (Optional)</Label>
                    <Textarea
                      id="commitDescription"
                      placeholder="Detailed description of changes"
                      value={commitDescription}
                      onChange={(e) => setCommitDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleCommit} disabled={!commitMessage.trim() || uncommittedChanges.length === 0}>
                    <GitCommit className="h-4 w-4 mr-2" />
                    Commit Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="merge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GitMerge className="h-5 w-5 mr-2" />
                Merge Branches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <GitPullRequest className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Merge Feature Coming Soon</h3>
                <p className="text-gray-600 mb-4">
                  Advanced merge capabilities including conflict resolution and pull requests.
                </p>
                <Button disabled>
                  <GitMerge className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>

      {/* Diff Modal */}
      {showDiff && diff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDiff(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Diff: {diff.file}</h3>
                <div className="text-sm text-gray-500 mt-1">
                  {diff.oldContent} → {diff.newContent}
                </div>
              </div>
              <Button variant="ghost" onClick={() => setShowDiff(false)}>
                ×
              </Button>
            </div>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {diff.changes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No changes detected between versions
                </div>
              ) : (
                diff.changes.map((change, index) => (
                  <div key={index} className={`flex items-start space-x-2 p-2 rounded text-sm ${getChangeColor(change.type)}`}>
                    <span className="font-mono text-xs w-12 text-gray-500">
                      {change.oldLine || ''}
                    </span>
                    <span className="font-mono text-xs w-12 text-gray-500">
                      {change.newLine || ''}
                    </span>
                    <span className="font-mono text-xs w-4">
                      {change.type === 'added' ? '+' : change.type === 'deleted' ? '-' : '~'}
                    </span>
                    <span className="font-mono text-xs flex-1 break-words">{change.content}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <Button variant="outline" onClick={() => setShowDiff(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
