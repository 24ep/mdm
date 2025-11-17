'use client'

import { InfrastructureInstance } from '../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Server, Activity, AlertCircle } from 'lucide-react'
import { useInfrastructureTags } from '../hooks/useInfrastructureTags'

export interface InstanceCardProps {
  instance: InfrastructureInstance
  onClick: () => void
}

export function InstanceCard({ instance, onClick }: InstanceCardProps) {
  const { tags } = useInfrastructureTags(instance.id)
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
        <div className="flex items-center justify-between mb-2">
          <Badge variant={getStatusColor(instance.status)}>
            {instance.status}
          </Badge>
          <Badge variant="outline">{instance.type}</Badge>
        </div>
        
        {/* Service Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => {
              let variant: 'default' | 'secondary' | 'outline' = 'outline'
              if (tag === 'minio') variant = 'default'
              else if (tag === 'kong') variant = 'secondary'
              else if (tag === 'grafana') variant = 'default'
              else if (tag === 'prometheus') variant = 'secondary'
              
              return (
                <Badge 
                  key={tag} 
                  variant={variant}
                  className="text-xs"
                >
                  {tag}
                </Badge>
              )
            })}
          </div>
        )}
        
        {instance.osType && (
          <div className="mt-2 text-sm text-muted-foreground">
            {instance.osType} {instance.osVersion}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

