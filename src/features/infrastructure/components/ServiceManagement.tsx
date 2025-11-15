'use client'

import { useState, useEffect } from 'react'
import { InfrastructureInstance, InstanceService } from '../types'
import { useMarketplacePlugins } from '@/features/marketplace/hooks/useMarketplacePlugins'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ManagementPluginSelector } from './ManagementPluginSelector'
import { Loader } from 'lucide-react'

export interface ServiceManagementProps {
  service: InstanceService
  instance: InfrastructureInstance
  onClose: () => void
}

export function ServiceManagement({
  service,
  instance,
  onClose,
}: ServiceManagementProps) {
  const [managementUI, setManagementUI] = useState<any>(null)
  const [loadingUI, setLoadingUI] = useState(false)

  const { plugins } = useMarketplacePlugins({
    category: 'service-management',
    filters: { serviceType: service.type },
  })

  const assignedPlugin = plugins.find((p) => p.id === service.managementPluginId)

  useEffect(() => {
    if (assignedPlugin && assignedPlugin.uiConfig?.componentPath) {
      loadManagementUI()
    }
  }, [assignedPlugin])

  const loadManagementUI = async () => {
    if (!assignedPlugin?.uiConfig?.componentPath) return

    try {
      setLoadingUI(true)
      // Use plugin loader which has static import map for Next.js compatibility
      const { pluginLoader } = await import('@/features/marketplace')
      const Component = await pluginLoader.loadComponent(assignedPlugin)
      const ComponentToRender = Component.default || Component
      
      setManagementUI(
        <ComponentToRender
          service={service}
          instance={instance}
          config={service.managementConfig || {}}
        />
      )
    } catch (error) {
      console.error('Error loading management UI:', error)
      setManagementUI(
        <div className="text-center py-8 text-muted-foreground">
          Failed to load management UI: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )
    } finally {
      setLoadingUI(false)
    }
  }

  const handleAssignPlugin = async (pluginId: string) => {
    try {
      const response = await fetch(`/api/infrastructure/services/${service.id}/assign-plugin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pluginId }),
      })

      if (response.ok) {
        // Refresh service data
        window.location.reload()
      }
    } catch (error) {
      console.error('Error assigning plugin:', error)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage {service.name}</DialogTitle>
          <DialogDescription>
            {instance.name} • {service.type}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="management">
          <TabsList>
            <TabsTrigger value="management">Management</TabsTrigger>
            <TabsTrigger value="assign">Assign Plugin</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="management">
            {assignedPlugin ? (
              <div>
                <div className="mb-4">
                  <Badge variant="outline">{assignedPlugin.name}</Badge>
                </div>
                {loadingUI ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  managementUI || (
                    <div className="text-center py-8 text-muted-foreground">
                      Management UI not available
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No management plugin assigned
                </p>
                <Button onClick={() => {
                  // Switch to assign tab
                  const assignTab = document.querySelector('[value="assign"]') as HTMLElement
                  assignTab?.click()
                }}>
                  Assign Management Plugin
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="assign">
            <ManagementPluginSelector
              service={service}
              plugins={plugins}
              onAssign={handleAssignPlugin}
            />
          </TabsContent>

          <TabsContent value="config">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Service Configuration</h3>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(service.serviceConfig, null, 2)}
                </pre>
              </div>
              {service.endpoints && service.endpoints.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Endpoints</h3>
                  <div className="space-y-2">
                    {service.endpoints.map((endpoint, index) => (
                      <div key={index} className="text-sm">
                        {endpoint.protocol}://{endpoint.url}:{endpoint.port}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

