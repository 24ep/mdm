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
  onCommit?: (commit: Commit) => void
  onBranch?: (branch: Branch) => void
  onMerge?: (merge: Merge) => void
  onRevert?: (version: Version) => void
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
  notebookId = 'notebook-1',
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
    // Initialize with mock data
    setVersions([
      {
        id: 'v1',
        commitId: 'a1b2c3d',
        message: 'Initial notebook setup',
        author: 'John Doe',
        authorEmail: 'john@example.com',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        changes: [
          { type: 'added', file: 'notebook.ipynb', linesAdded: 50, linesDeleted: 0 }
        ],
        branch: 'main',
        tags: ['v1.0.0'],
        isCurrent: false
      },
      {
        id: 'v2',
        commitId: 'e4f5g6h',
        message: 'Added data visualization',
        author: 'John Doe',
        authorEmail: 'john@example.com',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        changes: [
          { type: 'modified', file: 'notebook.ipynb', linesAdded: 25, linesDeleted: 5 },
          { type: 'added', file: 'charts.py', linesAdded: 30, linesDeleted: 0 }
        ],
        branch: 'main',
        tags: [],
        isCurrent: false
      },
      {
        id: 'v3',
        commitId: 'i7j8k9l',
        message: 'Fixed data preprocessing bug',
        author: 'Jane Smith',
        authorEmail: 'jane@example.com',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        changes: [
          { type: 'modified', file: 'notebook.ipynb', linesAdded: 10, linesDeleted: 8 }
        ],
        branch: 'main',
        tags: ['v1.1.0'],
        isCurrent: true
      }
    ])

    setBranches([
      {
        name: 'main',
        description: 'Main development branch',
        isCurrent: true,
        lastCommit: 'i7j8k9l',
        lastCommitDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        ahead: 0,
        behind: 0
      },
      {
        name: 'feature/ml-pipeline',
        description: 'Machine learning pipeline implementation',
        isCurrent: false,
        lastCommit: 'm1n2o3p',
        lastCommitDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        ahead: 3,
        behind: 1
      },
      {
        name: 'feature/data-viz',
        description: 'Advanced data visualization features',
        isCurrent: false,
        lastCommit: 'q4r5s6t',
        lastCommitDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        ahead: 2,
        behind: 2
      }
    ])

    setUncommittedChanges([
      {
        type: 'modified',
        file: 'notebook.ipynb',
        linesAdded: 15,
        linesDeleted: 3
      },
      {
        type: 'added',
        file: 'utils.py',
        linesAdded: 20,
        linesDeleted: 0
      }
    ])
  }, [])

  const handleCommit = () => {
    if (!commitMessage.trim()) {
      toast.error('Please enter a commit message')
      return
    }

    const commit: Commit = {
      id: `commit-${Date.now()}`,
      message: commitMessage,
      description: commitDescription,
      author: 'Current User',
      timestamp: new Date(),
      changes: uncommittedChanges,
      branch: currentBranch
    }

    const newVersion: Version = {
      id: `v${versions.length + 1}`,
      commitId: commit.id.substring(0, 7),
      message: commit.message,
      author: commit.author,
      authorEmail: 'current@example.com',
      timestamp: commit.timestamp,
      changes: commit.changes,
      branch: commit.branch,
      tags: [],
      isCurrent: true
    }

    setVersions(prev => prev.map(v => ({ ...v, isCurrent: false })).concat(newVersion))
    setUncommittedChanges([])
    setCommitMessage('')
    setCommitDescription('')
    onCommit?.(commit)
    toast.success('Changes committed successfully')
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

  const handleRevert = (version: Version) => {
    onRevert?.(version)
    toast.success(`Reverted to version ${version.commitId}`)
  }

  const handleExport = (version: Version, format: string) => {
    onExport?.(version, format)
    toast.success(`Exported version ${version.commitId} as ${format}`)
  }

  const handleShowDiff = (version: Version) => {
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
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1">
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

      {/* Diff Modal */}
      {showDiff && diff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Diff: {diff.file}</h3>
              <Button variant="ghost" onClick={() => setShowDiff(false)}>
                ×
              </Button>
            </div>
            <div className="space-y-2">
              {diff.changes.map((change, index) => (
                <div key={index} className={`flex items-center space-x-2 p-2 rounded ${getChangeColor(change.type)}`}>
                  <span className="font-mono text-sm w-8">
                    {change.oldLine || change.newLine || ''}
                  </span>
                  <span className="font-mono text-sm">
                    {change.type === 'added' ? '+' : change.type === 'deleted' ? '-' : '~'}
                  </span>
                  <span className="font-mono text-sm">{change.content}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
