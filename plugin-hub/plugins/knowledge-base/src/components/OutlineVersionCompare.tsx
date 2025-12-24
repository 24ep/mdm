'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { History, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { KnowledgeDocumentVersion } from '../types'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

interface OutlineVersionCompareProps {
  document: { id: string }
  versions: KnowledgeDocumentVersion[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OutlineVersionCompare({
  document,
  versions,
  open,
  onOpenChange,
}: OutlineVersionCompareProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string>('')
  const [diff, setDiff] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && versions.length > 0 && !selectedVersionId) {
      setSelectedVersionId(versions[1]?.id || versions[0]?.id || '')
    }
  }, [open, versions, selectedVersionId])

  useEffect(() => {
    if (selectedVersionId && open) {
      fetchDiff()
    }
  }, [selectedVersionId, open])

  const fetchDiff = async () => {
    if (!selectedVersionId) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/knowledge/documents/${document.id}/versions/${selectedVersionId}/compare`
      )
      if (response.ok) {
        const data = await response.json()
        setDiff(data)
      } else {
        toast.error('Failed to load comparison')
      }
    } catch (error) {
      console.error('Error fetching diff:', error)
      toast.error('Failed to load comparison')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Compare Versions
          </DialogTitle>
          <DialogDescription>
            Compare the current version with a previous version
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Compare with version:</label>
            <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions.map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    {new Date(version.createdAt).toLocaleString()} - {version.creator?.name || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : diff ? (
            <ScrollArea className="h-[500px] border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="space-y-2 font-mono text-sm">
                {diff.diff.map((line: any, index: number) => (
                  <div
                    key={index}
                    className={cn(
                      'px-2 py-1 rounded',
                      line.type === 'added' && 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
                      line.type === 'removed' && 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 line-through',
                      line.type === 'unchanged' && 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    <span className="text-gray-500 dark:text-gray-500 mr-2">
                      {line.line.toString().padStart(4, ' ')}
                    </span>
                    {line.type === 'added' && '+'}
                    {line.type === 'removed' && '-'}
                    {line.type === 'unchanged' && ' '}
                    {' '}
                    {line.content}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

