'use client'

import { useState, useEffect } from 'react'
import { useSpaceFilter, SpaceFilterResult } from '@/shared/hooks/useSpaceFilter'
import { Dashboard, DashboardFilters } from '../types'

export interface UseDashboardsOptions {
  spaceId?: string | null
  filters?: DashboardFilters
  autoFetch?: boolean
}

export interface UseDashboardsResult {
  dashboards: Dashboard[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  spaceFilter: SpaceFilterResult
}

/**
 * Hook for fetching dashboards with space-aware filtering
 */
export function useDashboards(options: UseDashboardsOptions = {}): UseDashboardsResult {
  const { spaceId, filters = {}, autoFetch = true } = options
  const spaceFilter = useSpaceFilter({ spaceId, allowAll: true })
  
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboards = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()

      // Add space filter if specified
      if (spaceFilter.spaceId) {
        params.append('spaceId', spaceFilter.spaceId)
      }

      const response = await fetch(`/api/v1/dashboards?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboards')
      }

      const data = await response.json()
      setDashboards(data.dashboards || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboards'
      setError(errorMessage)
      console.error('Error fetching dashboards:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchDashboards()
    }
  }, [spaceFilter.spaceId, autoFetch])

  return {
    dashboards,
    loading,
    error,
    refetch: fetchDashboards,
    spaceFilter,
  }
}

