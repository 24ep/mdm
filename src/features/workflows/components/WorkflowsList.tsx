'use client'

import { useState } from 'react'
import { useWorkflows } from '../hooks/useWorkflows'
import { WorkflowsListProps, WorkflowFilters } from '../types'
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
import { Search, Plus, Play, Loader } from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { useRouter } from 'next/navigation'

/**
 * Single-source WorkflowsList component
 */
export function WorkflowsList({
  spaceId = null,
  showFilters = true,
  showSpaceSelector = false,
}: WorkflowsListProps) {
  const router = useRouter()
  const { currentSpace } = useSpace()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    spaceId || currentSpace?.id || 'all'
  )
  const [filters, setFilters] = useState<WorkflowFilters>({})
  const [searchQuery, setSearchQuery] = useState('')

  const effectiveSpaceId = showSpaceSelector
    ? selectedSpaceId === 'all'
      ? null
      : selectedSpaceId
    : spaceId

  const { workflows, loading, refetch } = useWorkflows({
    spaceId: effectiveSpaceId,
    filters,
  })

  const filteredWorkflows = workflows.filter((workflow) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return workflow.name?.toLowerCase().includes(query) ||
             workflow.description?.toLowerCase().includes(query)
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workflows</h2>
          <p className="text-muted-foreground">Manage your automation workflows</p>
        </div>
        <Button onClick={() => router.push('/workflows/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Workflow
        </Button>
      </div>

      {showFilters && (
        <div className="flex items-center gap-4">
          {showSpaceSelector && (
            <SpaceSelector
              value={selectedSpaceId}
              onValueChange={setSelectedSpaceId}
              className="w-[200px]"
              showAllOption={true}
            />
          )}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              setFilters({ ...filters, status: value === 'all' ? undefined : (value as any) })
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkflows.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No workflows found.
            </div>
          ) : (
            filteredWorkflows.map((workflow) => (
              <Card
                key={workflow.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/workflows/${workflow.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>{workflow.name}</CardTitle>
                    <Badge variant="outline">{workflow.status}</Badge>
                  </div>
                  {workflow.description && (
                    <CardDescription>{workflow.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/workflows/${workflow.id}`)
                    }}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}

