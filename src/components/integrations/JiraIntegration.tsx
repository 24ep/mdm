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
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { showError, showSuccess, showInfo } from '@/lib/toast-utils'

interface JiraConfig {
  id?: string
  name?: string
  baseUrl?: string
  isActive?: boolean
  isConfigured?: boolean
  createdAt?: string
  updatedAt?: string
}

interface JiraIntegrationProps {
  spaceId: string
}

export function JiraIntegration({ spaceId }: JiraIntegrationProps) {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [config, setConfig] = useState<JiraConfig | null>(null)
  const [formData, setFormData] = useState({
    baseUrl: '',
    email: '',
    apiToken: '',
    projectKey: '',
    name: 'Jira Integration'
  })
  const [showApiToken, setShowApiToken] = useState(false)
  const [projects, setProjects] = useState<Array<{ key: string; name: string }>>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [issueTypes, setIssueTypes] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    loadConfig()
  }, [spaceId])

  const loadConfig = async () => {
    try {
      const response = await fetch(`/api/integrations/jira?space_id=${spaceId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setConfig(data.config)
          setFormData(prev => ({
            ...prev,
            baseUrl: data.config.baseUrl || '',
            name: data.config.name || 'Jira Integration'
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load Jira config:', error)
    }
  }

  const handleTestConnection = async () => {
    if (!formData.baseUrl || !formData.email || !formData.apiToken) {
      showError('Please provide baseUrl, email, and API token to test connection')
      return
    }

    setTesting(true)
    try {
      const response = await fetch('/api/integrations/jira', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          baseUrl: formData.baseUrl,
          email: formData.email,
          apiToken: formData.apiToken
        })
      })

      const result = await response.json()

      if (result.success) {
        showSuccess(result.message || 'Successfully connected to Jira')
        // Load projects after successful connection
        await loadProjects()
      } else {
        showError(result.error || 'Failed to connect to Jira')
      }
    } catch (error) {
      showError('Failed to test connection')
    } finally {
      setTesting(false)
    }
  }

  const loadProjects = async () => {
    if (!formData.baseUrl || !formData.email || !formData.apiToken) return

    setLoadingProjects(true)
    try {
      // We'll need to create an endpoint for this or use the service directly
      // For now, we'll use a test endpoint
      const response = await fetch('/api/integrations/jira/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          baseUrl: formData.baseUrl,
          email: formData.email,
          apiToken: formData.apiToken
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.projects) {
          setProjects(data.projects.map((p: any) => ({
            key: p.key,
            name: p.name
          })))
          
          // Load issue types for selected project
          if (formData.projectKey) {
            await loadIssueTypes(formData.projectKey)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoadingProjects(false)
    }
  }

  const loadIssueTypes = async (projectKey: string) => {
    if (!formData.baseUrl || !formData.email || !formData.apiToken || !projectKey) return

    try {
      const response = await fetch('/api/integrations/jira/issue-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          baseUrl: formData.baseUrl,
          email: formData.email,
          apiToken: formData.apiToken,
          projectKey
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.issueTypes) {
          setIssueTypes(data.issueTypes.map((it: any) => ({
            id: it.id,
            name: it.name
          })))
        }
      }
    } catch (error) {
      console.error('Failed to load issue types:', error)
    }
  }

  const handleSave = async () => {
    if (!formData.baseUrl || !formData.email || !formData.apiToken) {
      showError('baseUrl, email, and API token are required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/integrations/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          baseUrl: formData.baseUrl,
          email: formData.email,
          apiToken: formData.apiToken,
          projectKey: formData.projectKey || undefined,
          name: formData.name
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        showSuccess('Jira integration configured successfully')
        await loadConfig()
      } else {
        showError(result.error || 'Failed to save configuration')
      }
    } catch (error) {
      showError('Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Jira Integration
          </CardTitle>
          <CardDescription>
            Connect your Jira instance to sync tickets and issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config?.isConfigured && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Jira integration is configured and active
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
                placeholder="Jira Integration"
              />
            </div>

            <div>
              <Label htmlFor="baseUrl">Jira Base URL</Label>
              <Input
                id="baseUrl"
                type="url"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder="https://yourcompany.atlassian.net"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your Jira instance URL (e.g., https://company.atlassian.net)
              </p>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@company.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email address associated with your Jira account
              </p>
            </div>

            <div>
              <Label htmlFor="apiToken">API Token</Label>
              <div className="flex gap-2">
                <Input
                  id="apiToken"
                  type={showApiToken ? 'text' : 'password'}
                  value={formData.apiToken}
                  onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                  placeholder="Enter your Jira API token"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiToken(!showApiToken)}
                >
                  {showApiToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Create an API token at{' '}
                <a
                  href="https://id.atlassian.com/manage-profile/security/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  id.atlassian.com
                </a>
              </p>
            </div>

            <div>
              <Label htmlFor="projectKey">Default Project Key (Optional)</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.projectKey}
                  onValueChange={(value) => {
                    setFormData({ ...formData, projectKey: value })
                    loadIssueTypes(value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project or enter key" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.key} value={project.key}>
                        {project.name} ({project.key})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="projectKey"
                  value={formData.projectKey}
                  onChange={(e) => setFormData({ ...formData, projectKey: e.target.value })}
                  placeholder="PROJ"
                  className="w-32"
                />
                {projects.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loadProjects}
                    disabled={loadingProjects || !formData.baseUrl || !formData.email || !formData.apiToken}
                  >
                    {loadingProjects ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Default project for creating issues (can be overridden per ticket)
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleTestConnection}
              disabled={testing || !formData.baseUrl || !formData.email || !formData.apiToken}
              variant="outline"
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
              disabled={loading || !formData.baseUrl || !formData.email || !formData.apiToken}
            >
              {loading ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Configuration
            </Button>
            {config?.isConfigured && (
              <Button
                variant="outline"
                onClick={() => window.open(formData.baseUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Jira
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

