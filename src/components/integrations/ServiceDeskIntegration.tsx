'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CheckCircle, 
  XCircle, 
  Loader, 
  Settings, 
  ExternalLink,
  TestTube,
  Save,
  AlertCircle,
  Clock,
  Map,
  FileText,
  History,
  Download,
  Upload,
  RefreshCw,
  Webhook,
  Trash2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ServiceDeskConfig {
  id?: string
  name?: string
  baseUrl?: string
  isActive?: boolean
  isConfigured?: boolean
  createdAt?: string
  updatedAt?: string
}

interface ServiceDeskIntegrationProps {
  spaceId: string
}

export function ServiceDeskIntegration({ spaceId }: ServiceDeskIntegrationProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [config, setConfig] = useState<ServiceDeskConfig | null>(null)
  const [formData, setFormData] = useState({
    baseUrl: '',
    apiKey: '',
    technicianKey: '',
    name: 'ManageEngine ServiceDesk'
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [activeTab, setActiveTab] = useState('config')
  
  // Sync schedule state
  const [syncSchedule, setSyncSchedule] = useState<any>(null)
  const [scheduleType, setScheduleType] = useState('manual')
  const [scheduleConfig, setScheduleConfig] = useState({ interval_minutes: 15, time: '09:00' })
  
  // Field mappings state
  const [fieldMappings, setFieldMappings] = useState<any[]>([])
  const [newMapping, setNewMapping] = useState({ name: '', mappings: {} })
  
  // Templates state
  const [templates, setTemplates] = useState<any[]>([])
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', config: {} })
  
  // Sync logs state
  const [syncLogs, setSyncLogs] = useState<any[]>([])
  const [syncStats, setSyncStats] = useState<any>(null)

  useEffect(() => {
    loadConfig()
    loadSyncSchedule()
    loadFieldMappings()
    loadTemplates()
    loadSyncLogs()
  }, [spaceId])

  const loadConfig = async () => {
    try {
      const response = await fetch(`/api/integrations/manageengine-servicedesk?space_id=${spaceId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setConfig(data.config)
          setFormData(prev => ({
            ...prev,
            baseUrl: data.config.baseUrl || '',
            name: data.config.name || 'ManageEngine ServiceDesk'
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load ServiceDesk config:', error)
    }
  }

  const handleTestConnection = async () => {
    if (!formData.baseUrl || !formData.apiKey) {
      toast({
        title: 'Validation Error',
        description: 'Please provide baseUrl and apiKey to test connection',
        variant: 'destructive'
      })
      return
    }

    setTesting(true)
    try {
      const response = await fetch('/api/integrations/manageengine-servicedesk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          baseUrl: formData.baseUrl,
          apiKey: formData.apiKey,
          technicianKey: formData.technicianKey || undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Connection Successful',
          description: 'Successfully connected to ManageEngine ServiceDesk',
        })
      } else {
        toast({
          title: 'Connection Failed',
          description: result.error || 'Failed to connect to ServiceDesk',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test connection',
        variant: 'destructive'
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!formData.baseUrl || !formData.apiKey) {
      toast({
        title: 'Validation Error',
        description: 'baseUrl and apiKey are required',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/integrations/manageengine-servicedesk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          baseUrl: formData.baseUrl,
          apiKey: formData.apiKey,
          technicianKey: formData.technicianKey || undefined,
          name: formData.name
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Configuration Saved',
          description: 'ServiceDesk integration configured successfully',
        })
        await loadConfig()
      } else {
        toast({
          title: 'Configuration Failed',
          description: result.error || 'Failed to save configuration',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSyncSchedule = async () => {
    try {
      const response = await fetch(`/api/integrations/manageengine-servicedesk/sync-schedule?space_id=${spaceId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.schedule) {
          setSyncSchedule(data.schedule)
          setScheduleType(data.schedule.schedule_type)
          setScheduleConfig(data.schedule.schedule_config || {})
        }
      }
    } catch (error) {
      console.error('Failed to load sync schedule:', error)
    }
  }

  const saveSyncSchedule = async () => {
    try {
      const response = await fetch('/api/integrations/manageengine-servicedesk/sync-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          schedule_type: scheduleType,
          schedule_config: scheduleConfig,
          is_active: true
        })
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Sync schedule saved successfully',
        })
        await loadSyncSchedule()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save sync schedule',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save sync schedule',
        variant: 'destructive'
      })
    }
  }

  const loadFieldMappings = async () => {
    try {
      const response = await fetch(`/api/integrations/manageengine-servicedesk/field-mappings?space_id=${spaceId}`)
      if (response.ok) {
        const data = await response.json()
        setFieldMappings(data.mappings || [])
      }
    } catch (error) {
      console.error('Failed to load field mappings:', error)
    }
  }

  const saveFieldMapping = async () => {
    if (!newMapping.name) {
      toast({
        title: 'Error',
        description: 'Mapping name is required',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/integrations/manageengine-servicedesk/field-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          mapping_name: newMapping.name,
          mappings: newMapping.mappings
        })
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Field mapping saved successfully',
        })
        setNewMapping({ name: '', mappings: {} })
        await loadFieldMappings()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save field mapping',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save field mapping',
        variant: 'destructive'
      })
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/integrations/manageengine-servicedesk/templates?space_id=${spaceId}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const saveTemplate = async () => {
    if (!newTemplate.name) {
      toast({
        title: 'Error',
        description: 'Template name is required',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/integrations/manageengine-servicedesk/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          name: newTemplate.name,
          description: newTemplate.description,
          template_config: newTemplate.config
        })
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Template saved successfully',
        })
        setNewTemplate({ name: '', description: '', config: {} })
        await loadTemplates()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save template',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive'
      })
    }
  }

  const deleteFieldMapping = async (mappingId: string) => {
    if (!confirm('Are you sure you want to delete this field mapping?')) {
      return
    }

    try {
      const response = await fetch(`/api/integrations/manageengine-servicedesk/field-mappings?mapping_id=${mappingId}&space_id=${spaceId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Field mapping deleted successfully',
        })
        await loadFieldMappings()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete field mapping',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete field mapping',
        variant: 'destructive'
      })
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      const response = await fetch(`/api/integrations/manageengine-servicedesk/templates?template_id=${templateId}&space_id=${spaceId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Template deleted successfully',
        })
        await loadTemplates()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete template',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive'
      })
    }
  }

  const loadSyncLogs = async () => {
    try {
      const response = await fetch(`/api/integrations/manageengine-servicedesk/sync-logs?space_id=${spaceId}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setSyncLogs(data.logs || [])
        setSyncStats(data.statistics)
      }
    } catch (error) {
      console.error('Failed to load sync logs:', error)
    }
  }

  const handleExportConfig = async () => {
    try {
      const response = await fetch(`/api/integrations/manageengine-servicedesk/export-config?space_id=${spaceId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `servicedesk-config-${spaceId}-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast({
          title: 'Success',
          description: 'Configuration exported successfully',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export configuration',
        variant: 'destructive'
      })
    }
  }

  const handleImportConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const configData = JSON.parse(text)

      const response = await fetch('/api/integrations/manageengine-servicedesk/import-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          config_data: configData,
          overwrite: true
        })
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Configuration imported successfully',
        })
        await loadSyncSchedule()
        await loadFieldMappings()
        await loadTemplates()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to import configuration',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to import configuration',
        variant: 'destructive'
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              ManageEngine ServiceDesk Integration
            </CardTitle>
            <CardDescription>
              Configure integration to push tickets to ManageEngine ServiceDesk Plus
            </CardDescription>
          </div>
          {config?.isConfigured && (
            <Badge variant={config.isActive ? 'default' : 'secondary'}>
              {config.isActive ? 'Active' : 'Inactive'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="schedule">Auto-Sync</TabsTrigger>
            <TabsTrigger value="mappings">Field Mappings</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4 mt-4">
            {config?.isConfigured && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ServiceDesk integration is configured. You can push tickets from the ticket detail view.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Integration Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ManageEngine ServiceDesk"
                />
              </div>

              <div>
                <Label htmlFor="baseUrl">ServiceDesk Base URL</Label>
                <Input
                  id="baseUrl"
                  type="url"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="https://yourcompany.servicedeskplus.com"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Your ManageEngine ServiceDesk Plus instance URL
                </p>
              </div>

              <div>
                <Label htmlFor="apiKey">API Key (Technician Key)</Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="Enter your ServiceDesk API key"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <XCircle className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Get your API key from ServiceDesk Plus Admin → Integration → API Key
                </p>
              </div>

              <div>
                <Label htmlFor="technicianKey">Technician Key (Optional)</Label>
                <Input
                  id="technicianKey"
                  type="password"
                  value={formData.technicianKey}
                  onChange={(e) => setFormData({ ...formData, technicianKey: e.target.value })}
                  placeholder="Optional technician key"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Optional: Use if you need a specific technician key
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing || !formData.baseUrl || !formData.apiKey}
                >
                  {testing ? (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Test Connection
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading || !formData.baseUrl || !formData.apiKey}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Configuration
                </Button>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleExportConfig}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Config
                </Button>
                <Button variant="outline" onClick={() => document.getElementById('import-config')?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Config
                </Button>
                <input
                  id="import-config"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportConfig}
                />
              </div>

              {config?.isConfigured && (
                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Last updated: {config.updatedAt ? new Date(config.updatedAt).toLocaleString() : 'Never'}</p>
                    <p>Created: {config.createdAt ? new Date(config.createdAt).toLocaleString() : 'Unknown'}</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label>Sync Schedule Type</Label>
                <Select value={scheduleType} onValueChange={setScheduleType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Only</SelectItem>
                    <SelectItem value="interval">Interval (Minutes)</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scheduleType === 'interval' && (
                <div>
                  <Label>Interval (Minutes)</Label>
                  <Input
                    type="number"
                    min="5"
                    value={scheduleConfig.interval_minutes || 15}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, interval_minutes: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              )}

              {scheduleType === 'daily' && (
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={scheduleConfig.time || '09:00'}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, time: e.target.value })}
                    className="mt-1"
                  />
                </div>
              )}

              {syncSchedule && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    {syncSchedule.last_run_at && (
                      <p>Last run: {new Date(syncSchedule.last_run_at).toLocaleString()}</p>
                    )}
                    {syncSchedule.next_run_at && (
                      <p>Next run: {new Date(syncSchedule.next_run_at).toLocaleString()}</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={saveSyncSchedule}>
                <Save className="h-4 w-4 mr-2" />
                Save Schedule
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="mappings" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label>New Field Mapping</Label>
                <Input
                  placeholder="Mapping name"
                  value={newMapping.name}
                  onChange={(e) => setNewMapping({ ...newMapping, name: e.target.value })}
                  className="mt-1"
                />
                <Textarea
                  placeholder='{"local_field": "servicedesk_field", ...}'
                  value={JSON.stringify(newMapping.mappings, null, 2)}
                  onChange={(e) => {
                    try {
                      setNewMapping({ ...newMapping, mappings: JSON.parse(e.target.value) })
                    } catch {}
                  }}
                  className="mt-2 font-mono text-sm"
                  rows={6}
                />
                <Button onClick={saveFieldMapping} className="mt-2">
                  <Save className="h-4 w-4 mr-2" />
                  Save Mapping
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Existing Mappings</Label>
                {fieldMappings.map((mapping) => (
                  <Card key={mapping.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{mapping.mapping_name}</div>
                          {mapping.is_default && <Badge variant="outline" className="mt-1">Default</Badge>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteFieldMapping(mapping.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label>New Template</Label>
                <Input
                  placeholder="Template name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="mt-1"
                />
                <Textarea
                  placeholder="Description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  className="mt-2"
                />
                <Textarea
                  placeholder='{"category": "...", "subcategory": "...", ...}'
                  value={JSON.stringify(newTemplate.config, null, 2)}
                  onChange={(e) => {
                    try {
                      setNewTemplate({ ...newTemplate, config: JSON.parse(e.target.value) })
                    } catch {}
                  }}
                  className="mt-2 font-mono text-sm"
                  rows={6}
                />
                <Button onClick={saveTemplate} className="mt-2">
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Existing Templates</Label>
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{template.name}</div>
                          {template.description && (
                            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTemplate(template.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4 mt-4">
            <div className="space-y-4">
              {syncStats && (
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Total Syncs</div>
                      <div className="text-2xl font-bold">{syncStats.total_syncs || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Successful</div>
                      <div className="text-2xl font-bold text-green-600">{syncStats.successful_syncs || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Failed</div>
                      <div className="text-2xl font-bold text-red-600">{syncStats.failed_syncs || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Unique Tickets</div>
                      <div className="text-2xl font-bold">{syncStats.unique_tickets || 0}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="space-y-2">
                <Label>Recent Sync Activity</Label>
                {syncLogs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={log.success ? 'default' : 'destructive'}>
                              {log.sync_type}
                            </Badge>
                            <span className="text-sm">{log.event_type}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button variant="outline" onClick={loadSyncLogs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="webhook" className="space-y-4 mt-4">
            <div className="space-y-4">
              <Alert>
                <Webhook className="h-4 w-4" />
                <AlertDescription>
                  Configure webhook URL in ServiceDesk to receive real-time updates.
                  <br />
                  <strong>Webhook URL:</strong> {typeof window !== 'undefined' 
                    ? `${window.location.origin}/api/integrations/manageengine-servicedesk/webhook`
                    : '/api/integrations/manageengine-servicedesk/webhook'}
                </AlertDescription>
              </Alert>

              <div>
                <Label>Webhook Secret (Optional)</Label>
                <Input
                  placeholder="Set SERVICEDESK_WEBHOOK_SECRET environment variable"
                  disabled
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Configure webhook secret in environment variables for signature verification
                </p>
              </div>

              <div>
                <Label>Supported Events</Label>
                <div className="mt-2 space-y-1 text-sm">
                  <div>• request.created</div>
                  <div>• request.updated</div>
                  <div>• request.status_changed</div>
                  <div>• request.comment_added</div>
                  <div>• request.attachment_added</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

