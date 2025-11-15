'use client'

import { useState } from 'react'
import { useInfrastructureInstances } from '../hooks/useInfrastructureInstances'
import { InfrastructureOverviewProps, InfrastructureInstance } from '../types'
import { SpaceSelector } from '@/components/project-management/SpaceSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Server, Loader, Activity } from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { InstanceCard } from './InstanceCard'
import { InstanceDetails } from './InstanceDetails'
import { AddInstanceDialog } from './AddInstanceDialog'

/**
 * Single-source InfrastructureOverview component
 */
export function InfrastructureOverview({
  spaceId = null,
  showSpaceSelector = false,
}: InfrastructureOverviewProps) {
  const { currentSpace } = useSpace()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    spaceId || currentSpace?.id || 'all'
  )
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInstance, setSelectedInstance] = useState<InfrastructureInstance | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showAddDialog, setShowAddDialog] = useState(false)

  const effectiveSpaceId = showSpaceSelector
    ? selectedSpaceId === 'all'
      ? null
      : selectedSpaceId
    : spaceId

  const { instances, loading, refetch } = useInfrastructureInstances({
    spaceId: effectiveSpaceId,
    filters: {
      type: typeFilter === 'all' ? undefined : (typeFilter as any),
      status: statusFilter === 'all' ? undefined : (statusFilter as any),
    },
  })

  const filteredInstances = instances.filter((instance) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        instance.name?.toLowerCase().includes(query) ||
        instance.host?.toLowerCase().includes(query) ||
        instance.type?.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Infrastructure</h2>
          <p className="text-muted-foreground">Manage your infrastructure instances</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Instance
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        {showSpaceSelector && (
          <SpaceSelector
            value={selectedSpaceId}
            onValueChange={setSelectedSpaceId}
            className="w-[200px]"
            showAllOption={true}
          />
        )}

        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search instances..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="vm">VM</SelectItem>
              <SelectItem value="docker_host">Docker Host</SelectItem>
              <SelectItem value="kubernetes">Kubernetes</SelectItem>
              <SelectItem value="cloud_instance">Cloud Instance</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
          : 'space-y-4'
        }>
          {filteredInstances.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No instances found. Add your first infrastructure instance.
            </div>
          ) : (
            filteredInstances.map((instance) => (
              <InstanceCard
                key={instance.id}
                instance={instance}
                onClick={() => setSelectedInstance(instance)}
              />
            ))
          )}
        </div>
      )}

      {/* Instance Details */}
      {selectedInstance && (
        <InstanceDetails
          instance={selectedInstance}
          onClose={() => setSelectedInstance(null)}
        />
      )}

      {/* Add Instance Dialog */}
      <AddInstanceDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        spaceId={effectiveSpaceId}
        onSuccess={() => {
          refetch()
        }}
      />
    </div>
  )
}

