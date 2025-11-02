'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Share2, Copy, Mail, Users, Globe, Lock, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

interface ShareSettings {
  shareType: 'private' | 'team' | 'public'
  allowEdit: boolean
  allowExecute: boolean
  expiresAt?: string
  password?: string
}

interface QuerySharingProps {
  query: string
  queryName: string
  isOpen: boolean
  onClose: () => void
  onShare?: (shareUrl: string, settings: ShareSettings) => void
}

export function QuerySharing({ query, queryName, isOpen, onClose, onShare }: QuerySharingProps) {
  const [shareType, setShareType] = useState<'private' | 'team' | 'public'>('private')
  const [allowEdit, setAllowEdit] = useState(false)
  const [allowExecute, setAllowExecute] = useState(true)
  const [shareUrl, setShareUrl] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  const generateShareUrl = () => {
    const baseUrl = window.location.origin
    const queryId = `query_${Date.now()}`
    const url = `${baseUrl}/admin/query/${queryId}?shared=true`
    setShareUrl(url)
    return url
  }

  const handleShare = () => {
    if (!query.trim()) {
      toast.error('Query is empty')
      return
    }

    const url = shareUrl || generateShareUrl()
    const settings: ShareSettings = {
      shareType,
      allowEdit,
      allowExecute,
    }

    // In production, this would call an API to save the share settings
    if (onShare) {
      onShare(url, settings)
    }

    toast.success('Query shared successfully')
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const handleCopyUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      toast.success('Share URL copied to clipboard')
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } else {
      const url = generateShareUrl()
      navigator.clipboard.writeText(url)
      toast.success('Share URL generated and copied')
    }
  }

  const handleShareByEmail = () => {
    if (!shareUrl) {
      generateShareUrl()
    }
    
    const subject = encodeURIComponent(`Shared Query: ${queryName}`)
    const body = encodeURIComponent(`Check out this shared SQL query:\n\n${shareUrl}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Query
          </DialogTitle>
          <DialogDescription>
            Share this query with team members or make it publicly accessible
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Share Type</Label>
            <Select value={shareType} onValueChange={(v: any) => setShareType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Private - Only me</span>
                  </div>
                </SelectItem>
                <SelectItem value="team">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Team - All team members</span>
                  </div>
                </SelectItem>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Public - Anyone with link</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Edit</Label>
                <p className="text-xs text-gray-500">
                  Users can modify the query
                </p>
              </div>
              <Switch
                checked={allowEdit}
                onCheckedChange={setAllowEdit}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Execute</Label>
                <p className="text-xs text-gray-500">
                  Users can run the query
                </p>
              </div>
              <Switch
                checked={allowExecute}
                onCheckedChange={setAllowExecute}
              />
            </div>
          </div>

          {shareUrl && (
            <div className="space-y-2">
              <Label>Share URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyUrl}
                  className="h-10"
                >
                  {copySuccess ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Share2 className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Sharing Options</p>
                <p className="text-xs text-blue-700 mt-1">
                  {shareType === 'private' && 'Only you can access this query.'}
                  {shareType === 'team' && 'All team members with access to this space can view this query.'}
                  {shareType === 'public' && 'Anyone with the link can view this query.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShareByEmail}>
              <Mail className="h-4 w-4 mr-2" />
              Share via Email
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Generate Share Link
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

