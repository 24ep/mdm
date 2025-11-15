'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Loader, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface GrafanaIntegrationUIProps {
  installationId?: string
  config?: Record<string, any>
  onConfigUpdate?: (config: Record<string, any>) => void
}

export function GrafanaIntegrationUI({
  installationId,
  config = {},
  onConfigUpdate,
}: GrafanaIntegrationUIProps) {
  const [baseUrl, setBaseUrl] = useState(config.baseUrl || '')
  const [apiKey, setApiKey] = useState(config.apiKey || '')
  const [folder, setFolder] = useState(config.folder || '')
  const [isConfigured, setIsConfigured] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; count?: number } | null>(null)

  useEffect(() => {
    checkConfiguration()
  }, [config])

  const checkConfiguration = async () => {
    if (!installationId) return

    try {
      const response = await fetch(`/api/marketplace/installations/${installationId}`)
      if (response.ok) {
        const data = await response.json()
        setIsConfigured(data.installation?.status === 'active' && !!data.installation?.credentials)
      }
    } catch (error) {
      console.error('Error checking configuration:', error)
    }
  }

  const handleSave = async () => {
    if (!baseUrl || !apiKey) {
      setTestResult({ success: false, message: 'Base URL and API Key are required' })
      return
    }

    const newConfig = {
      baseUrl,
      apiKey,
      folder: folder || undefined,
    }

    if (onConfigUpdate) {
      onConfigUpdate(newConfig)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/reports/integrations/grafana/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl,
          apiKey,
          folder: folder || undefined,
        }),
      })

      const data = await response.json()
      setTestResult({
        success: response.ok,
        message: data.message || (response.ok ? 'Connection successful' : 'Connection failed'),
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/reports/integrations/grafana/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()
      setSyncResult({
        success: response.ok,
        message: data.message || (response.ok ? 'Sync completed' : 'Sync failed'),
        count: data.count,
      })
    } catch (error) {
      setSyncResult({
        success: false,
        message: 'Failed to sync dashboards',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Grafana Configuration</CardTitle>
          <CardDescription>
            Configure your Grafana integration settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Grafana Base URL *</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://your-grafana-instance.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key *</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Grafana API key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder">Folder (Optional)</Label>
            <Input
              id="folder"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="Enter folder name to filter dashboards"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={!baseUrl || !apiKey}>
              Save Configuration
            </Button>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={isTesting || !baseUrl || !apiKey}
            >
              {isTesting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>

          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>{testResult.message}</AlertDescription>
              </div>
            </Alert>
          )}

          {isConfigured && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Configured
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Dashboards
                  </>
                )}
              </Button>
            </div>
          )}

          {syncResult && (
            <Alert variant={syncResult.success ? 'default' : 'destructive'}>
              <AlertDescription>
                {syncResult.message}
                {syncResult.count !== undefined && ` (${syncResult.count} dashboards)`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

