'use client'

import { InfrastructureInstance, InstanceService } from '../types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, Settings } from 'lucide-react'

export interface ServicesListProps {
  services: InstanceService[]
  instance: InfrastructureInstance
  onServiceClick: (service: InstanceService) => void
  onRefresh: () => void
}

export function ServicesList({
  services,
  instance,
  onServiceClick,
  onRefresh,
}: ServicesListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'default'
      case 'stopped':
        return 'secondary'
      case 'error':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Services</h3>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No services discovered yet.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Management Plugin</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{service.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(service.status)}>
                    {service.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {service.managementPluginId ? (
                    <Badge variant="secondary">Assigned</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">None</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onServiceClick(service)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

