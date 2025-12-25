'use client'

import { useState } from 'react'
import { PluginDefinition } from '../types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface InstallationWizardProps {
  plugin: PluginDefinition
  spaceId: string | null // Allow null for global installations
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (
    plugin: PluginDefinition,
    config: Record<string, any>,
    credentials?: Record<string, any>
  ) => Promise<void>
}

export function InstallationWizard({
  plugin,
  spaceId,
  open,
  onOpenChange,
  onComplete,
}: InstallationWizardProps) {
  const [config, setConfig] = useState<Record<string, any>>({})
  const [credentials, setCredentials] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  const handleInstall = async () => {
    setLoading(true)
    try {
      await onComplete(plugin, config, credentials)
    } catch (error) {
      console.error('Installation error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Install {plugin.name}</DialogTitle>
          <DialogDescription>
            Configure the plugin for your space
          </DialogDescription>
        </DialogHeader>

        <div className="w-full">
          <Tabs defaultValue="config">
            <TabsList>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            {plugin.apiAuthType && plugin.apiAuthType !== 'none' && (
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
            )}
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <div>
              <Label>Plugin Name</Label>
              <Input value={plugin.name} disabled />
            </div>
            <div>
              <Label>Version</Label>
              <Input value={plugin.version} disabled />
            </div>
            <div>
              <Label>Provider</Label>
              <Input value={plugin.provider} disabled />
            </div>
            {plugin.uiConfig?.configFields && (
              <div className="space-y-4">
                {Object.entries(plugin.uiConfig.configFields).map(([key, field]: [string, any]) => (
                  <div key={key}>
                    <Label>{field.label || key}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        value={config[key] || ''}
                        onChange={(e) =>
                          setConfig({ ...config, [key]: e.target.value })
                        }
                        placeholder={field.placeholder}
                      />
                    ) : (
                      <Input
                        type={field.type || 'text'}
                        value={config[key] || ''}
                        onChange={(e) =>
                          setConfig({ ...config, [key]: e.target.value })
                        }
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {plugin.apiAuthType && plugin.apiAuthType !== 'none' && (
            <TabsContent value="credentials" className="space-y-4">
              <div>
                <Label>Authentication Type</Label>
                <Input value={plugin.apiAuthType} disabled />
              </div>
              {plugin.apiAuthType === 'api_key' && (
                <div>
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={credentials.apiKey || ''}
                    onChange={(e) =>
                      setCredentials({ ...credentials, apiKey: e.target.value })
                    }
                    placeholder="Enter API key"
                  />
                </div>
              )}
              {plugin.apiAuthType === 'oauth2' && (
                <div className="space-y-4">
                  <div>
                    <Label>Client ID</Label>
                    <Input
                      value={credentials.clientId || ''}
                      onChange={(e) =>
                        setCredentials({ ...credentials, clientId: e.target.value })
                      }
                      placeholder="Enter client ID"
                    />
                  </div>
                  <div>
                    <Label>Client Secret</Label>
                    <Input
                      type="password"
                      value={credentials.clientSecret || ''}
                      onChange={(e) =>
                        setCredentials({ ...credentials, clientSecret: e.target.value })
                      }
                      placeholder="Enter client secret"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="review" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Plugin Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Name:</strong> {plugin.name}
                </div>
                <div>
                  <strong>Version:</strong> {plugin.version}
                </div>
                <div>
                  <strong>Provider:</strong> {plugin.provider}
                </div>
                <div>
                  <strong>Category:</strong> {plugin.category}
                </div>
              </div>
            </div>
            {Object.keys(config).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Configuration</h3>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(config, null, 2)}
                </pre>
              </div>
            )}
          </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInstall} disabled={loading}>
            {loading ? 'Installing...' : 'Install'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

