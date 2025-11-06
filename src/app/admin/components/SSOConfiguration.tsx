'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Shield, 
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Key,
  Lock,
  Globe
} from 'lucide-react'
import toast from 'react-hot-toast'

interface SSOConfig {
  // Enable/Disable toggles
  googleEnabled: boolean
  azureEnabled: boolean
  ldapEnabled: boolean
  
  // Google SSO
  googleClientId: string
  googleClientSecret: string
  
  // Azure AD SSO
  azureTenantId: string
  azureClientId: string
  azureClientSecret: string
  
  // LDAP Configuration
  ldapUrl: string
  ldapBaseDn: string
  ldapBindDn: string
  ldapBindPassword: string
  ldapSearchFilter: string
  ldapSearchBase: string
}

export function SSOConfiguration() {
  const [config, setConfig] = useState<SSOConfig>({
    googleEnabled: false,
    azureEnabled: false,
    ldapEnabled: false,
    googleClientId: '',
    googleClientSecret: '',
    azureTenantId: '',
    azureClientId: '',
    azureClientSecret: '',
    ldapUrl: '',
    ldapBaseDn: '',
    ldapBindDn: '',
    ldapBindPassword: '',
    ldapSearchFilter: '(uid={{username}})',
    ldapSearchBase: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/sso-config')
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setConfig({
            googleEnabled: data.config.googleEnabled || false,
            azureEnabled: data.config.azureEnabled || false,
            ldapEnabled: data.config.ldapEnabled || false,
            googleClientId: data.config.googleClientId || '',
            googleClientSecret: data.config.googleClientSecret || '',
            azureTenantId: data.config.azureTenantId || '',
            azureClientId: data.config.azureClientId || '',
            azureClientSecret: data.config.azureClientSecret || '',
            ldapUrl: data.config.ldapUrl || '',
            ldapBaseDn: data.config.ldapBaseDn || '',
            ldapBindDn: data.config.ldapBindDn || '',
            ldapBindPassword: data.config.ldapBindPassword || '',
            ldapSearchFilter: data.config.ldapSearchFilter || '(uid={{username}})',
            ldapSearchBase: data.config.ldapSearchBase || ''
          })
        }
      }
    } catch (error) {
      console.error('Error loading SSO config:', error)
      toast.error('Failed to load SSO configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfig = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/sso-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      })

      if (response.ok) {
        toast.success('SSO configuration saved successfully')
        // Reload to get updated config
        await loadConfig()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save SSO configuration')
      }
    } catch (error) {
      console.error('Error saving SSO config:', error)
      toast.error('Failed to save SSO configuration')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading SSO configuration...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            SSO Configuration
          </h2>
          <p className="text-muted-foreground">
            Configure Single Sign-On (SSO) providers for authentication
          </p>
        </div>
        <Button onClick={saveConfig} disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>

      {/* Google SSO */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Google SSO
              </CardTitle>
              <CardDescription>
                Configure Google OAuth authentication
              </CardDescription>
            </div>
            <Switch
              checked={config.googleEnabled}
              onCheckedChange={(checked) => 
                setConfig({ ...config, googleEnabled: checked })
              }
            />
          </div>
        </CardHeader>
        {config.googleEnabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="googleClientId">Client ID</Label>
                <Input
                  id="googleClientId"
                  value={config.googleClientId}
                  onChange={(e) => 
                    setConfig({ ...config, googleClientId: e.target.value })
                  }
                  placeholder="your-google-client-id.apps.googleusercontent.com"
                />
              </div>
              <div>
                <Label htmlFor="googleClientSecret">Client Secret</Label>
                <Input
                  id="googleClientSecret"
                  type="password"
                  value={config.googleClientSecret}
                  onChange={(e) => 
                    setConfig({ ...config, googleClientSecret: e.target.value })
                  }
                  placeholder="GOCSPX-..."
                />
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Note:</strong> When enabled, Google SSO will appear on all login pages. 
                Users can only log in if their email exists in the platform or space.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Azure AD SSO */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Azure AD SSO
              </CardTitle>
              <CardDescription>
                Configure Microsoft Azure Active Directory authentication
              </CardDescription>
            </div>
            <Switch
              checked={config.azureEnabled}
              onCheckedChange={(checked) => 
                setConfig({ ...config, azureEnabled: checked })
              }
            />
          </div>
        </CardHeader>
        {config.azureEnabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="azureTenantId">Tenant ID</Label>
                <Input
                  id="azureTenantId"
                  value={config.azureTenantId}
                  onChange={(e) => 
                    setConfig({ ...config, azureTenantId: e.target.value })
                  }
                  placeholder="your-tenant-id"
                />
              </div>
              <div>
                <Label htmlFor="azureClientId">Client ID (Application ID)</Label>
                <Input
                  id="azureClientId"
                  value={config.azureClientId}
                  onChange={(e) => 
                    setConfig({ ...config, azureClientId: e.target.value })
                  }
                  placeholder="your-azure-client-id"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="azureClientSecret">Client Secret</Label>
              <Input
                id="azureClientSecret"
                type="password"
                value={config.azureClientSecret}
                onChange={(e) => 
                  setConfig({ ...config, azureClientSecret: e.target.value })
                }
                placeholder="your-azure-client-secret"
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Note:</strong> When enabled, Azure AD SSO will appear on all login pages. 
                Users can only log in if their email exists in the platform or space.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* LDAP SSO */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                LDAP Authentication
              </CardTitle>
              <CardDescription>
                Configure LDAP/Active Directory authentication
              </CardDescription>
            </div>
            <Switch
              checked={config.ldapEnabled}
              onCheckedChange={(checked) => 
                setConfig({ ...config, ldapEnabled: checked })
              }
            />
          </div>
        </CardHeader>
        {config.ldapEnabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ldapUrl">LDAP URL</Label>
                <Input
                  id="ldapUrl"
                  value={config.ldapUrl}
                  onChange={(e) => 
                    setConfig({ ...config, ldapUrl: e.target.value })
                  }
                  placeholder="ldap://ldap.example.com:389"
                />
              </div>
              <div>
                <Label htmlFor="ldapBaseDn">Base DN</Label>
                <Input
                  id="ldapBaseDn"
                  value={config.ldapBaseDn}
                  onChange={(e) => 
                    setConfig({ ...config, ldapBaseDn: e.target.value })
                  }
                  placeholder="dc=example,dc=com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ldapBindDn">Bind DN (Service Account)</Label>
                <Input
                  id="ldapBindDn"
                  value={config.ldapBindDn}
                  onChange={(e) => 
                    setConfig({ ...config, ldapBindDn: e.target.value })
                  }
                  placeholder="cn=admin,dc=example,dc=com"
                />
              </div>
              <div>
                <Label htmlFor="ldapBindPassword">Bind Password</Label>
                <Input
                  id="ldapBindPassword"
                  type="password"
                  value={config.ldapBindPassword}
                  onChange={(e) => 
                    setConfig({ ...config, ldapBindPassword: e.target.value })
                  }
                  placeholder="Service account password"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ldapSearchBase">Search Base</Label>
              <Input
                id="ldapSearchBase"
                value={config.ldapSearchBase}
                onChange={(e) => 
                  setConfig({ ...config, ldapSearchBase: e.target.value })
                }
                placeholder="ou=users,dc=example,dc=com"
              />
            </div>
            <div>
              <Label htmlFor="ldapSearchFilter">Search Filter</Label>
              <Input
                id="ldapSearchFilter"
                value={config.ldapSearchFilter}
                onChange={(e) => 
                  setConfig({ ...config, ldapSearchFilter: e.target.value })
                }
                placeholder="(uid={{username}})"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Use {'{{username}}'} or {'{{email}}'} as placeholders
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Note:</strong> When enabled, LDAP authentication will appear on all login pages. 
                Users can only log in if their email exists in the platform or space.
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
