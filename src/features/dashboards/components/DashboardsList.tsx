'use client'

import { useState } from 'react'
import { useDashboards } from '../hooks/useDashboards'
import { DashboardsListProps } from '../types'
import { SpaceSelector } from '@/components/project-management/SpaceSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Plus, Eye, Loader } from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { useRouter } from 'next/navigation'

/**
 * Single-source DashboardsList component
 */
export function DashboardsList({
  spaceId = null,
  showFilters = true,
  showSpaceSelector = false,
}: DashboardsListProps) {
  const router = useRouter()
  const { currentSpace } = useSpace()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    spaceId || currentSpace?.id || 'all'
  )
  const [searchQuery, setSearchQuery] = useState('')

  const effectiveSpaceId = showSpaceSelector
    ? selectedSpaceId === 'all'
      ? null
      : selectedSpaceId
    : spaceId

  const { dashboards, loading, refetch } = useDashboards({
    spaceId: effectiveSpaceId,
  })

  const filteredDashboards = dashboards.filter((dashboard) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return dashboard.name?.toLowerCase().includes(query) ||
             dashboard.description?.toLowerCase().includes(query)
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboards</h2>
          <p className="text-muted-foreground">View and manage your dashboards</p>
        </div>
        <Button onClick={() => router.push('/dashboards/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Dashboard
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
              placeholder="Search dashboards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDashboards.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No dashboards found.
            </div>
          ) : (
            filteredDashboards.map((dashboard) => (
              <Card
                key={dashboard.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/dashboards/${dashboard.id}`)}
              >
                <CardHeader>
                  <CardTitle>{dashboard.name}</CardTitle>
                  {dashboard.description && (
                    <CardDescription>{dashboard.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/dashboards/${dashboard.id}`)
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
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

