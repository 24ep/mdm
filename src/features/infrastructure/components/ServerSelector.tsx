'use client'

import { useState, useEffect } from 'react'
import { InfrastructureInstance } from '../types'
import { useInfrastructureInstances } from '../hooks/useInfrastructureInstances'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader } from 'lucide-react'

export type ServiceType = 'minio' | 'kong' | 'grafana' | 'prometheus'

export interface ServerSelectorProps {
  serviceType: ServiceType
  value?: string
  onValueChange: (instanceId: string) => void
  spaceId?: string | null
}

export function ServerSelector({ 
  serviceType, 
  value, 
  onValueChange,
  spaceId 
}: ServerSelectorProps) {
  const { instances, loading } = useInfrastructureInstances({ spaceId })
  const [filteredInstances, setFilteredInstances] = useState<InfrastructureInstance[]>([])
  const [checkingTags, setCheckingTags] = useState(false)
  
  // Filter instances that have the service type tag
  useEffect(() => {
    const checkTags = async () => {
      if (instances.length === 0) {
        setFilteredInstances([])
        return
      }

      setCheckingTags(true)
      try {
        // Batch fetch tags for all instances
        const tagPromises = instances.map(async (instance) => {
          try {
            const response = await fetch(`/api/infrastructure/instances/${instance.id}/tags`)
            const { tags } = await response.json()
            return { instance, tags: tags || [] }
          } catch {
            return { instance, tags: [] }
          }
        })

        const results = await Promise.all(tagPromises)
        const instancesWithTag = results
          .filter(({ tags }) => tags.includes(serviceType))
          .map(({ instance }) => instance)

        setFilteredInstances(instancesWithTag)
      } catch (error) {
        console.error('Error checking tags:', error)
        setFilteredInstances([])
      } finally {
        setCheckingTags(false)
      }
    }
    
    checkTags()
  }, [instances, serviceType])

  const selectedInstance = filteredInstances.find(i => i.id === value)
  const isLoading = loading || checkingTags

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[300px]" disabled={isLoading}>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : (
          <SelectValue placeholder="Select server" />
        )}
      </SelectTrigger>
      <SelectContent>
        {filteredInstances.length === 0 && !isLoading ? (
          <SelectItem value="none" className="opacity-50 cursor-not-allowed pointer-events-none">
            No {serviceType} servers found
          </SelectItem>
        ) : (
          filteredInstances.map((instance) => (
            <SelectItem key={instance.id} value={instance.id}>
              {instance.name} ({instance.host})
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

