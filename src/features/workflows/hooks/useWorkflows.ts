'use client'

import { useState, useEffect } from 'react'
import { useSpaceFilter, SpaceFilterResult } from '@/shared/hooks/useSpaceFilter'
import { Workflow, WorkflowFilters } from '../types'

export interface UseWorkflowsOptions {
  spaceId?: string | null
  filters?: WorkflowFilters
  autoFetch?: boolean
}

export interface UseWorkflowsResult {
  workflows: Workflow[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  spaceFilter: SpaceFilterResult
}

/**
 * Hook for fetching workflows with space-aware filtering
 */
export function useWorkflows(options: UseWorkflowsOptions = {}): UseWorkflowsResult {
  const { spaceId, filters = {}, autoFetch = true } = options
  const spaceFilter = useSpaceFilter({ spaceId, allowAll: true })
  
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()

      if (spaceFilter.spaceId) {
        params.append('spaceId', spaceFilter.spaceId)
      }

      if (filters.status) {
        params.append('status', filters.status)
      }

      const response = await fetch(`/api/v1/workflows?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch workflows')
      }

      const data = await response.json()
      setWorkflows(data.workflows || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workflows'
      setError(errorMessage)
      console.error('Error fetching workflows:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchWorkflows()
    }
  }, [spaceFilter.spaceId, filters.status, autoFetch])

  return {
    workflows,
    loading,
    error,
    refetch: fetchWorkflows,
    spaceFilter,
  }
}

