'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Copy, Check, Calendar, Eye, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

interface ReportShareDialogProps {
  reportId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportShareDialog({ reportId, open, onOpenChange }: ReportShareDialogProps) {
  const [loading, setLoading] = useState(false)
  const [shareLink, setShareLink] = useState<string>('')
  const [password, setPassword] = useState('')
  const [requirePassword, setRequirePassword] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  const [maxViews, setMaxViews] = useState('')
  const [copied, setCopied] = useState(false)

  const generateShareLink = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports/${reportId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: requirePassword ? password : undefined,
          expires_at: expiresAt || undefined,
          max_views: maxViews ? parseInt(maxViews) : undefined
        })
      })

      if (!response.ok) throw new Error('Failed to generate share link')

      const data = await response.json()
      const fullUrl = `${window.location.origin}/reports/shared/${data.token}`
      setShareLink(fullUrl)
      toast.success('Share link generated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate share link')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboardHandler = async () => {
    const { copyToClipboard } = await import('@/lib/clipboard')
    const success = await copyToClipboard(shareLink)
    if (success) {
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error('Failed to copy')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Report</DialogTitle>
          <DialogDescription>
            Create a shareable link for this report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!shareLink ? (
            <>
              <div className="flex items-center space-x-2">
                <Switch
                  id="password"
                  checked={requirePassword}
                  onCheckedChange={setRequirePassword}
                />
                <Label htmlFor="password" className="cursor-pointer">
                  <Lock className="h-4 w-4 inline mr-1" />
                  Require password
                </Label>
              </div>

              {requirePassword && (
                <div>
                  <Label htmlFor="share-password">Password</Label>
                  <Input
                    id="share-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="expires">Expires At (Optional)</Label>
                <Input
                  id="expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="max-views">Max Views (Optional)</Label>
                <Input
                  id="max-views"
                  type="number"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  placeholder="Unlimited"
                  min="1"
                />
              </div>

              <Button onClick={generateShareLink} disabled={loading} className="w-full">
                {loading ? 'Generating...' : 'Generate Share Link'}
              </Button>
            </>
          ) : (
            <>
              <div>
                <Label>Share Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboardHandler}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setShareLink('')
                  setPassword('')
                  setRequirePassword(false)
                  setExpiresAt('')
                  setMaxViews('')
                }}
                className="w-full"
              >
                Create New Link
              </Button>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

