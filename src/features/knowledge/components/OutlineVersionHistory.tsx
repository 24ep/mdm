'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { History, RotateCcw, X, GitCompare } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { KnowledgeDocumentVersion } from '../types'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { EmptyState } from '@/shared/components/EmptyState'
import { OutlineVersionCompare } from './OutlineVersionCompare'

interface OutlineVersionHistoryProps {
  document: { id: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onRestore?: () => void
}

export function OutlineVersionHistory({
  document,
  open,
  onOpenChange,
  onRestore,
}: OutlineVersionHistoryProps) {
  const { data: session } = useSession()
  const [versions, setVersions] = useState<KnowledgeDocumentVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [showCompare, setShowCompare] = useState(false)

  useEffect(() => {
    if (open) {
      fetchVersions()
    }
  }, [open, document.id])

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/knowledge/documents/${document.id}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions || [])
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
      toast.error('Failed to load version history')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (versionId: string) => {
    if (!confirm('Are you sure you want to restore this version? This will create a new version with the restored content.')) {
      return
    }

    setRestoring(versionId)
    try {
      const response = await fetch(
        `/api/knowledge/documents/${document.id}/versions/${versionId}/restore`,
        { method: 'POST' }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to restore version')
      }

      toast.success('Version restored')
      onRestore?.()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setRestoring(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </DialogTitle>
          <DialogDescription>
            View and restore previous versions of this document
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : versions.length === 0 ? (
            <EmptyState
              title="No versions yet"
              description="Document versions will appear here as you edit"
              icon={<History className="h-12 w-12 text-gray-300 dark:text-gray-600" />}
            />
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="border border-gray-200 dark:border-gray-800 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={version.creator?.avatar} />
                        <AvatarFallback>
                          {version.creator?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {version.creator?.name || 'Unknown'}
                          </span>
                          {index === 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(version.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {index > 0 && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCompare(true)}
                        >
                          <GitCompare className="h-4 w-4 mr-2" />
                          Compare
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(version.id)}
                          disabled={restoring === version.id}
                        >
                          {restoring === version.id ? (
                            <LoadingSpinner />
                          ) : (
                            <>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restore
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {version.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {version.content?.substring(0, 200)}
                      {version.content && version.content.length > 200 && '...'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>

      {/* Compare Dialog */}
      <OutlineVersionCompare
        document={document}
        versions={versions}
        open={showCompare}
        onOpenChange={setShowCompare}
      />
    </Dialog>
  )
}

