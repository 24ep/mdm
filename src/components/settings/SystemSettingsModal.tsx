"use client"

import { useState, useEffect } from 'react'
import { useSpace } from '@/contexts/space-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Settings as SettingsIcon,
  Users,
  FileText,
  X,
  Save,
  RefreshCw,
  Shield,
  Database,
  Bell,
  Palette,
  Activity
} from 'lucide-react'
import { LangfuseSettings } from './LangfuseSettings'
import { IntegrationSettings } from './IntegrationSettings'
import { toast } from 'react-hot-toast'
import { Z_INDEX } from '@/lib/z-index'

interface SystemSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SystemSettings {
  appName: string
  deletePolicyDays: number
  enableAuditTrail: boolean
  enableNotifications: boolean
  enableThemeConfig: boolean
  enableUserRegistration: boolean
  requireEmailVerification: boolean
  requireAdminApproval: boolean
}

const defaultSettings: SystemSettings = {
  appName: 'Unified Data Platform',
  deletePolicyDays: 30,
  enableAuditTrail: true,
  enableNotifications: true,
  enableThemeConfig: true,
  enableUserRegistration: true,
  requireEmailVerification: true,
  requireAdminApproval: false
}

export function SystemSettingsModal({ open, onOpenChange }: SystemSettingsModalProps) {
  const { currentSpace } = useSpace()
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load settings on mount
  useEffect(() => {
    if (open) {
      loadSettings()
    }
  }, [open])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/system-settings')
      const data = await response.json()
      if (data.success && data.settings) {
        setSettings({ ...defaultSettings, ...data.settings })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Settings saved successfully')
        setHasChanges(false)
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSettings(defaultSettings)
    setHasChanges(true)
  }

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onOpenChange(false)
      }
    } else {
      onOpenChange(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm" style={{ zIndex: Z_INDEX.modal }}>
      <div className="fixed inset-0 bg-background">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="p-6 border-b bg-card relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <SettingsIcon className="h-6 w-6" />
                  System Settings
                </h1>
                <p className="text-sm text-muted-foreground">
                  Configure system-wide settings and policies
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    Unsaved Changes
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isLoading}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex h-full">
            <div className="w-full flex">
              <Tabs defaultValue="system">
                {/* Left Sidebar */}
                <div className="w-64 bg-card border-r flex flex-col">
                  <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold">Configuration</h2>
                    <p className="text-sm text-muted-foreground">Global system settings</p>
                  </div>

                  <nav className="flex-1 p-4">
                    <TabsList className="w-full flex-col h-auto bg-transparent space-y-1">
                      <TabsTrigger
                        className="justify-start w-full"
                        value="system"
                      >
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        System
                      </TabsTrigger>
                      <TabsTrigger
                        className="justify-start w-full"
                        value="api-docs"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        API Docs
                      </TabsTrigger>
                      <TabsTrigger
                        className="justify-start w-full"
                        value="users"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Users
                      </TabsTrigger>
                      <TabsTrigger
                        className="justify-start w-full"
                        value="integrations"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Integrations
                      </TabsTrigger>
                      <TabsTrigger
                        className="justify-start w-full"
                        value="observability"
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Observability
                      </TabsTrigger>
                    </TabsList>
                  </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    {/* System Settings */}
                    <TabsContent value="system" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <SettingsIcon className="h-5 w-5" />
                            <span>System Configuration</span>
                          </CardTitle>
                          <CardDescription>
                            Configure core system settings and policies
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="app-name">Application Name</Label>
                              <Input
                                id="app-name"
                                value={settings.appName}
                                onChange={(e) => updateSetting('appName', e.target.value)}
                                placeholder="Unified Data Platform"
                              />
                              <p className="text-sm text-muted-foreground">
                                The name displayed in the application header
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="delete-policy">Delete Policy (Days)</Label>
                              <Input
                                id="delete-policy"
                                type="number"
                                value={settings.deletePolicyDays}
                                onChange={(e) => updateSetting('deletePolicyDays', Number(e.target.value))}
                                placeholder="30"
                                min="1"
                                max="365"
                              />
                              <p className="text-sm text-muted-foreground">
                                Days to keep deleted data before permanent removal
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                              Security & Monitoring
                            </h4>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="space-y-0.5">
                                <Label className="flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  Enable Audit Trail
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Track all system activities and changes
                                </p>
                              </div>
                              <Switch
                                checked={settings.enableAuditTrail}
                                onCheckedChange={(checked) => updateSetting('enableAuditTrail', checked)}
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="space-y-0.5">
                                <Label className="flex items-center gap-2">
                                  <Bell className="h-4 w-4" />
                                  Enable Notifications
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Send system notifications to users
                                </p>
                              </div>
                              <Switch
                                checked={settings.enableNotifications}
                                onCheckedChange={(checked) => updateSetting('enableNotifications', checked)}
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                              Features
                            </h4>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="space-y-0.5">
                                <Label className="flex items-center gap-2">
                                  <Palette className="h-4 w-4" />
                                  Enable Theme Configuration
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Allow users to customize theme and colors
                                </p>
                              </div>
                              <Switch
                                checked={settings.enableThemeConfig}
                                onCheckedChange={(checked) => updateSetting('enableThemeConfig', checked)}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* API Documentation */}
                    <TabsContent value="api-docs" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <FileText className="h-5 w-5" />
                            <span>API Documentation</span>
                          </CardTitle>
                          <CardDescription>
                            System API endpoints and integration guides
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <Database className="h-4 w-4" />
                                  Base URL
                                </h4>
                                <code className="text-sm bg-background px-2 py-1 rounded">
                                  https://your-domain.com/api
                                </code>
                              </div>

                              <div className="space-y-2">
                                <h4 className="font-semibold">Authentication</h4>
                                <p className="text-sm text-muted-foreground">
                                  All API requests require authentication using Bearer tokens.
                                </p>
                                <div className="bg-muted p-3 rounded text-sm">
                                  <code>Authorization: Bearer your-token-here</code>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="font-semibold">Available Endpoints</h4>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-3 border rounded">
                                  <div>
                                    <code className="text-sm font-mono">GET /api/data-models</code>
                                    <p className="text-xs text-muted-foreground">List all data models</p>
                                  </div>
                                  <Badge variant="secondary">GET</Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded">
                                  <div>
                                    <code className="text-sm font-mono">POST /api/data-models</code>
                                    <p className="text-xs text-muted-foreground">Create new data model</p>
                                  </div>
                                  <Badge variant="secondary">POST</Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded">
                                  <div>
                                    <code className="text-sm font-mono">GET /api/entities</code>
                                    <p className="text-xs text-muted-foreground">List entities</p>
                                  </div>
                                  <Badge variant="secondary">GET</Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded">
                                  <div>
                                    <code className="text-sm font-mono">POST /api/entities</code>
                                    <p className="text-xs text-muted-foreground">Create new entity</p>
                                  </div>
                                  <Badge variant="secondary">POST</Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Users Management */}
                    <TabsContent value="users" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Users className="h-5 w-5" />
                            <span>User Management</span>
                          </CardTitle>
                          <CardDescription>
                            Configure user registration and access policies
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                              Registration Settings
                            </h4>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="space-y-0.5">
                                <Label className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  User Registration
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Allow new users to register accounts
                                </p>
                              </div>
                              <Switch
                                checked={settings.enableUserRegistration}
                                onCheckedChange={(checked) => updateSetting('enableUserRegistration', checked)}
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="space-y-0.5">
                                <Label className="flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  Email Verification
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Require email verification for new users
                                </p>
                              </div>
                              <Switch
                                checked={settings.requireEmailVerification}
                                onCheckedChange={(checked) => updateSetting('requireEmailVerification', checked)}
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="space-y-0.5">
                                <Label className="flex items-center gap-2">
                                  <SettingsIcon className="h-4 w-4" />
                                  Admin Approval
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Require admin approval for new users
                                </p>
                              </div>
                              <Switch
                                checked={settings.requireAdminApproval}
                                onCheckedChange={(checked) => updateSetting('requireAdminApproval', checked)}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Observability Settings */}
                    <TabsContent value="observability" className="space-y-6">
                      <LangfuseSettings />
                    </TabsContent>

                    {/* Infrastructure Integrations */}
                    <TabsContent value="integrations" className="space-y-6">
                      <IntegrationSettings />
                    </TabsContent>
                  </div>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}