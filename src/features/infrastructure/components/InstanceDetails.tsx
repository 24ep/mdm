'use client'

import { useState, useEffect } from 'react'
import { InfrastructureInstance, InstanceService } from '../types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ServicesList } from './ServicesList'
import { ServiceManagement } from './ServiceManagement'
import { Loader } from 'lucide-react'

export interface InstanceDetailsProps {
  instance: InfrastructureInstance
  onClose: () => void
}

export function InstanceDetails({ instance, onClose }: InstanceDetailsProps) {
  const [services, setServices] = useState<InstanceService[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<InstanceService | null>(null)

  useEffect(() => {
    fetchServices()
  }, [instance.id])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/infrastructure/instances/${instance.id}/services`)
      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{instance.name}</DialogTitle>
          <DialogDescription>
            {instance.host}:{instance.port || 'N/A'} • {instance.type}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <Badge>{instance.status}</Badge>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Type</h3>
                <Badge variant="outline">{instance.type}</Badge>
              </div>
              {instance.osType && (
                <div>
                  <h3 className="font-semibold mb-2">OS</h3>
                  <div className="text-sm">{instance.osType} {instance.osVersion}</div>
                </div>
              )}
              {instance.resources && (
                <div>
                  <h3 className="font-semibold mb-2">Resources</h3>
                  <div className="text-sm space-y-1">
                    {instance.resources.cpu && <div>CPU: {instance.resources.cpu} cores</div>}
                    {instance.resources.memory && (
                      <div>Memory: {instance.resources.memory} MB</div>
                    )}
                    {instance.resources.disk && (
                      <div>Disk: {instance.resources.disk} MB</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="services">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ServicesList
                services={services}
                instance={instance}
                onServiceClick={setSelectedService}
                onRefresh={fetchServices}
              />
            )}
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Connection Configuration</h3>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(instance.connectionConfig, null, 2)}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {selectedService && (
          <ServiceManagement
            service={selectedService}
            instance={instance}
            onClose={() => setSelectedService(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

