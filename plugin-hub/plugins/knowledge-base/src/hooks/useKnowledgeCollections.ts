'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { KnowledgeCollection } from '../types'
import toast from 'react-hot-toast'

interface UseKnowledgeCollectionsOptions {
  spaceId?: string
  search?: string
  page?: number
  limit?: number
}

interface UseKnowledgeCollectionsReturn {
  collections: KnowledgeCollection[]
  loading: boolean
  error: string | null
  total: number
  page: number
  limit: number
  totalPages: number
  refetch: () => Promise<void>
  createCollection: (data: {
    name: string
    description?: string
    icon?: string
    color?: string
    isPrivate?: boolean
    spaceId?: string
  }) => Promise<KnowledgeCollection | null>
  updateCollection: (id: string, data: Partial<KnowledgeCollection>) => Promise<boolean>
  deleteCollection: (id: string) => Promise<boolean>
}

export function useKnowledgeCollections(
  options: UseKnowledgeCollectionsOptions = {}
): UseKnowledgeCollectionsReturn {
  const { data: session } = useSession()
  const [collections, setCollections] = useState<KnowledgeCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(options.page || 1)
  const [limit, setLimit] = useState(options.limit || 20)
  const [totalPages, setTotalPages] = useState(0)

  const fetchCollections = useCallback(async () => {
    if (!session?.user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.spaceId) params.set('spaceId', options.spaceId)
      if (options.search) params.set('search', options.search)
      params.set('page', page.toString())
      params.set('limit', limit.toString())

      const response = await fetch(`/api/knowledge/collections?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch collections')
      }

      const data = await response.json()
      setCollections(data.collections || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 0)
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [session, options.spaceId, options.search, page, limit])

  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  const createCollection = useCallback(async (data: {
    name: string
    description?: string
    icon?: string
    color?: string
    isPrivate?: boolean
    spaceId?: string
  }): Promise<KnowledgeCollection | null> => {
    try {
      const response = await fetch('/api/knowledge/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create collection')
      }

      const result = await response.json()
      toast.success('Collection created')
      await fetchCollections()
      return result.collection
    } catch (err: any) {
      toast.error(err.message)
      return null
    }
  }, [fetchCollections])

  const updateCollection = useCallback(async (
    id: string,
    data: Partial<KnowledgeCollection>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/knowledge/collections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update collection')
      }

      toast.success('Collection updated')
      await fetchCollections()
      return true
    } catch (err: any) {
      toast.error(err.message)
      return false
    }
  }, [fetchCollections])

  const deleteCollection = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/knowledge/collections/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete collection')
      }

      toast.success('Collection deleted')
      await fetchCollections()
      return true
    } catch (err: any) {
      toast.error(err.message)
      return false
    }
  }, [fetchCollections])

  return {
    collections,
    loading,
    error,
    total,
    page,
    limit,
    totalPages,
    refetch: fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
  }
}

