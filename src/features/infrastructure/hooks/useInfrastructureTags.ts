'use client'

import { useQuery } from '@tanstack/react-query'

export interface UseInfrastructureTagsResult {
  tags: string[]
  loading: boolean
  error: string | null
}

/**
 * Hook to fetch service tags for an infrastructure instance
 * Tags are derived from assigned management plugins (minio, kong, grafana, prometheus)
 */
export function useInfrastructureTags(instanceId: string | null | undefined): UseInfrastructureTagsResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['infrastructure', 'instances', instanceId, 'tags'],
    queryFn: async () => {
      if (!instanceId) {
        return { tags: [] }
      }

      const response = await fetch(`/api/infrastructure/instances/${instanceId}/tags`)
      if (!response.ok) {
        throw new Error('Failed to fetch tags')
      }
      const data = await response.json()
      return data
    },
    enabled: !!instanceId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  return {
    tags: data?.tags || [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  }
}

