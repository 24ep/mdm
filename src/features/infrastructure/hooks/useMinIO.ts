'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface MinIOBucket {
  name: string
  creationDate: Date
  objectCount?: number
  size?: number
}

export interface UseMinIOResult {
  buckets: MinIOBucket[]
  loading: boolean
  error: string | null
  refetch: () => void
  createBucket: (name: string, region?: string) => Promise<void>
  deleteBucket: (name: string) => Promise<void>
}

export function useMinIO(instanceId: string | null | undefined): UseMinIOResult {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['minio', instanceId, 'buckets'],
    queryFn: async () => {
      if (!instanceId) {
        return { buckets: [] }
      }

      const response = await fetch(`/api/minio/${instanceId}/buckets`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch buckets')
      }
      const data = await response.json()
      return data
    },
    enabled: !!instanceId,
    staleTime: 30 * 1000, // Cache for 30 seconds
  })

  const createBucketMutation = useMutation({
    mutationFn: async ({ name, region }: { name: string; region?: string }) => {
      if (!instanceId) {
        throw new Error('Instance ID is required')
      }

      const response = await fetch(`/api/minio/${instanceId}/buckets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, region }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create bucket')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minio', instanceId, 'buckets'] })
    },
  })

  const deleteBucketMutation = useMutation({
    mutationFn: async (bucketName: string) => {
      if (!instanceId) {
        throw new Error('Instance ID is required')
      }

      const response = await fetch(`/api/minio/${instanceId}/buckets/${bucketName}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete bucket')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minio', instanceId, 'buckets'] })
    },
  })

  return {
    buckets: data?.buckets || [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['minio', instanceId, 'buckets'] })
    },
    createBucket: async (name: string, region?: string) => {
      await createBucketMutation.mutateAsync({ name, region })
    },
    deleteBucket: async (name: string) => {
      await deleteBucketMutation.mutateAsync(name)
    },
  }
}

