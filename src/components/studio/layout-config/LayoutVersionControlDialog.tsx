'use client'

import React, { useState, useEffect } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  History,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  Search,
  FileDiff,
  Download,
  X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface LayoutVersion {
  id: string
  version_number: number
  layout_config: any // May be string (from DB) or object
  change_description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  is_current: boolean
  created_by_name?: string | null
  created_by_email?: string | null
}

// Helper to parse layout_config (handles both string and object)
const parseLayoutConfig = (config: any): any => {
  if (typeof config === 'string') {
    try {
      return JSON.parse(config)
    } catch {
      return {}
    }
  }
  return config || {}
}

interface LayoutVersionControlDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spaceId: string
  currentLayoutConfig: any
  onVersionRestore?: (version: LayoutVersion) => void
}

export function LayoutVersionControlDialog({
  open,
  onOpenChange,
  spaceId,
  currentLayoutConfig,
  onVersionRestore,
}: LayoutVersionControlDialogProps) {
  const [versions, setVersions] = useState<LayoutVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<LayoutVersion | null>(null)
  const [comparingVersions, setComparingVersions] = useState<{
    version1: LayoutVersion | null
    version2: LayoutVersion | null
  }>({ version1: null, version2: null })
  const [searchQuery, setSearchQuery] = useState('')
  const [changeDescription, setChangeDescription] = useState('')
  const [creatingVersion, setCreatingVersion] = useState(false)

  // Load versions when dialog opens
  useEffect(() => {
    if (open && spaceId) {
      loadVersions()
    }
  }, [open, spaceId])

  const loadVersions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/layout/versions`)
      if (res.ok) {
        const data = await res.json()
        setVersions(data.versions || [])
      } else {
        toast.error('Failed to load versions')
      }
    } catch (error) {
      console.error('Error loading versions:', error)
      toast.error('Failed to load versions')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVersion = async () => {
    if (!currentLayoutConfig) {
      toast.error('No layout config to save')
      return
    }

    setCreatingVersion(true)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/layout/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layoutConfig: currentLayoutConfig,
          changeDescription: changeDescription.trim() || 'Manual save',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`Version ${data.version.version_number} created`)
        setChangeDescription('')
        await loadVersions()
        if (onVersionRestore) {
          onVersionRestore(data.version)
        }
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to create version')
      }
    } catch (error) {
      console.error('Error creating version:', error)
      toast.error('Failed to create version')
    } finally {
      setCreatingVersion(false)
    }
  }

  const handleRestoreVersion = async (version: LayoutVersion) => {
    if (!confirm(`Restore version ${version.version_number}? This will create a new version from the restored layout.`)) {
      return
    }

    try {
      const res = await fetch(`/api/spaces/${spaceId}/layout/versions/${version.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createNewVersion: true }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`Version ${data.version.version_number} restored`)
        await loadVersions()
        if (onVersionRestore) {
          onVersionRestore(data.version)
        }
        onOpenChange(false)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to restore version')
      }
    } catch (error) {
      console.error('Error restoring version:', error)
      toast.error('Failed to restore version')
    }
  }

  const handleDeleteVersion = async (version: LayoutVersion) => {
    if (version.is_current) {
      toast.error('Cannot delete current version')
      return
    }

    if (!confirm(`Delete version ${version.version_number}? This action cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/spaces/${spaceId}/layout/versions/${version.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success(`Version ${version.version_number} deleted`)
        await loadVersions()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to delete version')
      }
    } catch (error) {
      console.error('Error deleting version:', error)
      toast.error('Failed to delete version')
    }
  }

  const handleCompareVersions = (version1: LayoutVersion, version2: LayoutVersion) => {
    setComparingVersions({ version1, version2 })
  }

  const filteredVersions = versions.filter(v => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      v.version_number.toString().includes(query) ||
      (v.change_description || '').toLowerCase().includes(query) ||
      (v.created_by_name || '').toLowerCase().includes(query)
    )
  })

  // Simple JSON diff for comparison
  const getDifferences = (config1: any, config2: any): string[] => {
    const diff: string[] = []
    const keys1 = new Set(Object.keys(config1 || {}))
    const keys2 = new Set(Object.keys(config2 || {}))

    // Find added keys
    keys2.forEach(key => {
      if (!keys1.has(key)) {
        diff.push(`+ Added: ${key}`)
      }
    })

    // Find removed keys
    keys1.forEach(key => {
      if (!keys2.has(key)) {
        diff.push(`- Removed: ${key}`)
      }
    })

    // Find changed values
    keys1.forEach(key => {
      if (keys2.has(key)) {
        const val1 = JSON.stringify(config1[key])
        const val2 = JSON.stringify(config2[key])
        if (val1 !== val2) {
          diff.push(`~ Changed: ${key}`)
        }
      }
    })

    return diff
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent widthClassName="w-[600px]">
        <DrawerHeader className="flex items-center justify-between">
          <div>
            <DrawerTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Layout Version Control
            </DrawerTitle>
            <DrawerDescription>
              Manage and restore previous versions of your layout configuration
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <ScrollArea className="flex-1" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        <div className="flex flex-col gap-4 p-4">
          {/* Create New Version Section */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label className="text-xs font-semibold">Create New Version</Label>
                <Input
                  placeholder="Describe the changes..."
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  className="text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleCreateVersion()
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleCreateVersion}
                disabled={creatingVersion || !currentLayoutConfig}
                className="whitespace-nowrap"
              >
                {creatingVersion ? 'Creating...' : 'Save Version'}
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search versions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Versions List */}
          <ScrollArea className="flex-1 min-h-[400px] max-h-[500px] border rounded-md">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading versions...</div>
            ) : filteredVersions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery ? 'No versions found' : 'No versions yet. Create your first version above.'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredVersions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      version.is_current ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Version {version.version_number}</span>
                          {version.is_current && (
                            <Badge variant="default" className="text-xs">
                              Current
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {version.change_description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {version.created_by_name && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{version.created_by_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(version.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!version.is_current && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestoreVersion(version)}
                              className="h-8"
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              Restore
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedVersion(version)}
                              className="h-8"
                            >
                              <FileDiff className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVersion(version)}
                              className="h-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {version.is_current && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Version Comparison (if two versions selected) */}
          {comparingVersions.version1 && comparingVersions.version2 && (
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Comparison</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setComparingVersions({ version1: null, version2: null })}
                >
                  Close
                </Button>
              </div>
              <Separator />
              <div className="space-y-1 text-xs">
                {getDifferences(
                  parseLayoutConfig(comparingVersions.version1.layout_config),
                  parseLayoutConfig(comparingVersions.version2.layout_config)
                ).map((diff, idx) => (
                  <div key={idx} className={diff.startsWith('+') ? 'text-primary' : diff.startsWith('-') ? 'text-destructive' : 'text-warning'}>
                    {diff}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}

