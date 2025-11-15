'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { UserCombobox } from '@/components/ui/user-combobox'
import { Share2, Copy, Check, Link as LinkIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { KnowledgeDocument } from '../types'

interface OutlineShareDialogProps {
  document: KnowledgeDocument
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OutlineShareDialog({
  document,
  open,
  onOpenChange,
}: OutlineShareDialogProps) {
  const { data: session } = useSession()
  const [shares, setShares] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [permission, setPermission] = useState<'read' | 'write' | 'admin'>('read')
  const [isPublic, setIsPublic] = useState(false)
  const [publicLink, setPublicLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) {
      fetchShares()
    }
  }, [open, document.id])

  const fetchShares = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/knowledge/documents/${document.id}/shares`)
      if (response.ok) {
        const data = await response.json()
        setShares(data.shares || [])
        // Find public link
        const publicShare = data.shares?.find((s: any) => s.publicLink)
        if (publicShare) {
          setPublicLink(publicShare.publicLink)
          setIsPublic(true)
        }
      }
    } catch (error) {
      console.error('Error fetching shares:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!selectedUserId && !isPublic) {
      toast.error('Please select a user or enable public link')
      return
    }

    try {
      const response = await fetch(`/api/knowledge/documents/${document.id}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId || undefined,
          permission,
          isPublic,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to share document')
      }

      const data = await response.json()
      if (data.share.publicLink) {
        setPublicLink(data.share.publicLink)
      }

      toast.success('Document shared')
      await fetchShares()
      setSelectedUserId('')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleCopyLink = () => {
    if (publicLink) {
      const fullLink = `${window.location.origin}/knowledge/shared/${publicLink}`
      navigator.clipboard.writeText(fullLink)
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Document
          </DialogTitle>
          <DialogDescription>
            Share this document with team members or create a public link
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Share with user */}
          <div>
            <Label>Share with</Label>
            <UserCombobox
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              placeholder="Select a user..."
            />
          </div>

          {/* Permission */}
          {selectedUserId && (
            <div>
              <Label>Permission</Label>
              <Select value={permission} onValueChange={(v: any) => setPermission(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="write">Write</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Public link */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Public Link</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Anyone with the link can view
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {publicLink && (
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-gray-400" />
                <Input
                  value={`${window.location.origin}/knowledge/shared/${publicLink}`}
                  readOnly
                  className="flex-1 text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Existing shares */}
          {shares.length > 0 && (
            <div>
              <Label>Shared with</Label>
              <div className="space-y-2 mt-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-800 rounded"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {share.user?.name || 'Public link'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {share.permission}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch(
                            `/api/knowledge/documents/${document.id}/shares/${share.id}`,
                            { method: 'DELETE' }
                          )
                          if (response.ok) {
                            toast.success('Share removed')
                            await fetchShares()
                          } else {
                            throw new Error('Failed to remove share')
                          }
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to remove share')
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleShare} className="bg-blue-600 hover:bg-blue-700 text-white">
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

