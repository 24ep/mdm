'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { History, Clock, User, RotateCcw, Eye, Copy, Check } from 'lucide-react'
import { formatTimeAgo } from '@/lib/date-formatters'
import { showSuccess } from '@/lib/toast-utils'

interface QueryVersion {
  id: string
  query: string
  name: string
  version: number
  createdAt: Date
  createdBy: string
  description?: string
  isCurrent: boolean
}

interface QueryVersionHistoryProps {
  query: string
  queryName: string
  isOpen: boolean
  onClose: () => void
  versions?: QueryVersion[]
  onLoadVersion?: (version: QueryVersion) => void
  onRestoreVersion?: (version: QueryVersion) => void
}

export function QueryVersionHistory({
  query,
  queryName,
  isOpen,
  onClose,
  versions = [],
  onLoadVersion,
  onRestoreVersion
}: QueryVersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<QueryVersion | null>(null)
  const [previewVersion, setPreviewVersion] = useState<string | null>(null)

  // Generate mock versions if none provided
  const displayVersions: QueryVersion[] = versions.length > 0 ? versions : [
    {
      id: '1',
      query,
      name: queryName,
      version: 1,
      createdAt: new Date(),
      createdBy: 'Current User',
      isCurrent: true
    }
  ]

  const handleViewVersion = (version: QueryVersion) => {
    setSelectedVersion(version)
    setPreviewVersion(version.query)
  }

  const handleLoadVersion = (version: QueryVersion) => {
    if (onLoadVersion) {
      onLoadVersion(version)
    }
    showSuccess(`Loaded version ${version.version}`)
    onClose()
  }

  const handleRestoreVersion = (version: QueryVersion) => {
    if (confirm(`Restore this query to version ${version.version}? This will replace the current query.`)) {
      if (onRestoreVersion) {
        onRestoreVersion(version)
      }
      showSuccess(`Query restored to version ${version.version}`)
      onClose()
    }
  }

  const handleCopyVersion = (version: QueryVersion) => {
    navigator.clipboard.writeText(version.query)
    showSuccess('Query copied to clipboard')
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Query Version History
          </DialogTitle>
          <DialogDescription>
            View and restore previous versions of this query
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Versions List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium mb-3">Versions</h3>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {displayVersions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedVersion?.id === version.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-border hover:border-primary/50'
                    } ${version.isCurrent ? 'ring-2 ring-green-200' : ''}`}
                    onClick={() => handleViewVersion(version)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={version.isCurrent ? 'default' : 'secondary'}>
                          v{version.version}
                          {version.isCurrent && ' (Current)'}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopyVersion(version)
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <User className="h-3 w-3" />
                      <span>{version.createdBy}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(version.createdAt)}</span>
                    </div>
                    {version.description && (
                      <p className="text-xs text-muted-foreground mt-2">{version.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Version Preview */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium mb-3">Preview</h3>
            {previewVersion ? (
              <div className="h-[400px] flex flex-col">
                <ScrollArea className="flex-1 border rounded-lg">
                  <div className="p-4">
                    <pre className="text-xs font-mono bg-muted p-3 rounded whitespace-pre-wrap">
                      {previewVersion}
                    </pre>
                  </div>
                </ScrollArea>
                {selectedVersion && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLoadVersion(selectedVersion)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Load Version
                    </Button>
                    {!selectedVersion.isCurrent && (
                      <Button
                        size="sm"
                        onClick={() => handleRestoreVersion(selectedVersion)}
                        className="flex-1"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center border rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Select a version to preview</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


