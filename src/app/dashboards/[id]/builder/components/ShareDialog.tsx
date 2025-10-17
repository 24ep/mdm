import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Lock, Users, Globe, Link, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface ShareSettings {
  visibility: 'PRIVATE' | 'RESTRICTED' | 'PUBLIC'
  allowed_users: string[]
  embed_enabled: boolean
  public_link?: string
}

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dashboardName: string
  shareSettings: ShareSettings
  onUpdateSettings: (settings: ShareSettings) => void
}

export function ShareDialog({ open, onOpenChange, dashboardName, shareSettings, onUpdateSettings }: ShareDialogProps) {
  const [settings, setSettings] = useState<ShareSettings>(shareSettings)
  const [selectedUsers, setSelectedUsers] = useState<string[]>(settings.allowed_users || [])
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [availableUsers] = useState([
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com' }
  ])

  const handleUserToggle = (userId: string) => {
    const newUsers = selectedUsers.includes(userId)
      ? selectedUsers.filter(id => id !== userId)
      : [...selectedUsers, userId]
    
    setSelectedUsers(newUsers)
    setSettings({
      ...settings,
      allowed_users: newUsers
    })
  }

  const generatePublicLink = async () => {
    try {
      // Simulate API call
      const mockLink = `dashboard-${Date.now()}`
      setSettings(prev => ({
        ...prev,
        public_link: mockLink
      }))
      toast.success('Public link generated successfully')
    } catch (error) {
      toast.error('Failed to generate public link')
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(type)
      setTimeout(() => setCopiedText(null), 2000)
      toast.success(`${type} copied to clipboard`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const generateEmbedCode = () => {
    if (!settings.public_link) return ''
    
    const embedUrl = `${window.location.origin}/embed/dashboard/${settings.public_link}`
    return `<iframe 
  src="${embedUrl}" 
  width="100%" 
  height="600" 
  frameborder="0" 
  allowfullscreen>
</iframe>`
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'PRIVATE':
        return <Lock className="h-4 w-4" />
      case 'RESTRICTED':
        return <Users className="h-4 w-4" />
      case 'PUBLIC':
        return <Globe className="h-4 w-4" />
      default:
        return <Lock className="h-4 w-4" />
    }
  }

  const handleSave = () => {
    onUpdateSettings(settings)
    onOpenChange(false)
    toast.success('Share settings updated successfully')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Dashboard</DialogTitle>
          <DialogDescription>
            Configure how others can access your dashboard
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Privacy Settings */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Privacy Settings</Label>
              <p className="text-sm text-muted-foreground">Choose who can access your dashboard</p>
            </div>

            <div className="space-y-3">
              {[
                { value: 'PRIVATE', label: 'Private', description: 'Only you can access' },
                { value: 'RESTRICTED', label: 'Restricted', description: 'Specific users only' },
                { value: 'PUBLIC', label: 'Public', description: 'Anyone with link' }
              ].map((option) => (
                <div
                  key={option.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    settings.visibility === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSettings({
                    ...settings,
                    visibility: option.value as any
                  })}
                >
                  <div className="flex items-center space-x-3">
                    {getVisibilityIcon(option.value)}
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      settings.visibility === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {settings.visibility === option.value && (
                        <div className="w-full h-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Selection for Restricted Access */}
          {settings.visibility === 'RESTRICTED' && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Allowed Users</Label>
                <p className="text-sm text-muted-foreground">Select users who can access this dashboard</p>
              </div>
              
              <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <div className={`w-4 h-4 rounded border-2 ${
                      selectedUsers.includes(user.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedUsers.includes(user.id) && (
                        <div className="w-full h-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Embed Settings */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Embed Settings</Label>
              <p className="text-sm text-muted-foreground">Allow embedding this dashboard in other websites</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.embed_enabled}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  embed_enabled: checked
                })}
              />
              <Label>Enable embedding</Label>
            </div>
          </div>

          {/* Public Link Section */}
          {(settings.visibility === 'PUBLIC' || settings.visibility === 'RESTRICTED') && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Public Link</Label>
                <p className="text-sm text-muted-foreground">Share this link to give others access</p>
              </div>
              
              {!settings.public_link ? (
                <Button onClick={generatePublicLink} className="w-full">
                  <Link className="h-4 w-4 mr-2" />
                  Generate Public Link
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <Input
                      value={`${window.location.origin}/dashboard/${settings.public_link}`}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(
                        `${window.location.origin}/dashboard/${settings.public_link}`,
                        'Link'
                      )}
                    >
                      {copiedText === 'Link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Embed Code Section */}
          {settings.embed_enabled && settings.public_link && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Embed Code</Label>
                <p className="text-sm text-muted-foreground">Copy this code to embed the dashboard</p>
              </div>
              
              <div className="space-y-2">
                <Textarea
                  value={generateEmbedCode()}
                  readOnly
                  rows={6}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(generateEmbedCode(), 'Embed Code')}
                  className="w-full"
                >
                  {copiedText === 'Embed Code' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy Embed Code
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
