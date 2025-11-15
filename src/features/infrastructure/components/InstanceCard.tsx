'use client'

import { InfrastructureInstance } from '../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Server, Activity, AlertCircle } from 'lucide-react'

export interface InstanceCardProps {
  instance: InfrastructureInstance
  onClick: () => void
}

export function InstanceCard({ instance, onClick }: InstanceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'default'
      case 'offline':
        return 'secondary'
      case 'error':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Activity className="h-4 w-4 text-green-500" />
      case 'offline':
        return <Activity className="h-4 w-4 text-gray-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{instance.name}</CardTitle>
          </div>
          {getStatusIcon(instance.status)}
        </div>
        <CardDescription>{instance.host}:{instance.port || 'N/A'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Badge variant={getStatusColor(instance.status)}>
            {instance.status}
          </Badge>
          <Badge variant="outline">{instance.type}</Badge>
        </div>
        {instance.osType && (
          <div className="mt-2 text-sm text-muted-foreground">
            {instance.osType} {instance.osVersion}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

