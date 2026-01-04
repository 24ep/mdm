'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { KnowledgeDocument } from '../types'
import toast from 'react-hot-toast'

interface UseKnowledgeDocumentsOptions {
  collectionId: string
  spaceId?: string
  parentId?: string
  search?: string
  page?: number
  limit?: number
}

interface UseKnowledgeDocumentsReturn {
  documents: KnowledgeDocument[]
  loading: boolean
  error: string | null
  total: number
  page: number
  limit: number
  totalPages: number
  refetch: () => Promise<void>
  createDocument: (data: {
    title: string
    content?: string
    contentHtml?: string
    parentId?: string
    isTemplate?: boolean
    isPublic?: boolean
    isPinned?: boolean
    order?: number
    spaceId?: string
  }) => Promise<KnowledgeDocument | null>
  updateDocument: (id: string, data: Partial<KnowledgeDocument>) => Promise<boolean>
  deleteDocument: (id: string) => Promise<boolean>
  getDocument: (id: string, spaceId?: string) => Promise<KnowledgeDocument | null>
}

export function useKnowledgeDocuments(
  options: UseKnowledgeDocumentsOptions
): UseKnowledgeDocumentsReturn {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(options.page || 1)
  const [limit, setLimit] = useState(options.limit || 20)
  const [totalPages, setTotalPages] = useState(0)

  const fetchDocuments = useCallback(async () => {
    if (!session?.user || !options.collectionId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('collectionId', options.collectionId)
      if (options.spaceId) params.set('spaceId', options.spaceId)
      if (options.parentId) params.set('parentId', options.parentId)
      if (options.search) params.set('search', options.search)
      params.set('page', page.toString())
      params.set('limit', limit.toString())

      const response = await fetch(`/api/knowledge/documents?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch documents')
      }

      const data = await response.json()
      setDocuments(data.documents || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 0)
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [session, options.collectionId, options.spaceId, options.parentId, options.search, page, limit])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const createDocument = useCallback(async (data: {
    title: string
    content?: string
    contentHtml?: string
    parentId?: string
    isTemplate?: boolean
    isPublic?: boolean
    isPinned?: boolean
    order?: number
    spaceId?: string
  }): Promise<KnowledgeDocument | null> => {
    try {
      const response = await fetch('/api/knowledge/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          collectionId: options.collectionId,
          spaceId: data.spaceId || options.spaceId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create document')
      }

      const result = await response.json()
      toast.success('Document created')
      await fetchDocuments()
      return result.document
    } catch (err: any) {
      toast.error(err.message)
      return null
    }
  }, [options.collectionId, fetchDocuments])

  const updateDocument = useCallback(async (
    id: string,
    data: Partial<KnowledgeDocument> & { spaceId?: string }
  ): Promise<boolean> => {
    try {
      const params = new URLSearchParams()
      if (data.spaceId || options.spaceId) params.set('spaceId', data.spaceId || options.spaceId || '')
      const response = await fetch(`/api/knowledge/documents/${id}?${params.toString()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update document')
      }

      toast.success('Document updated')
      await fetchDocuments()
      return true
    } catch (err: any) {
      toast.error(err.message)
      return false
    }
  }, [fetchDocuments])

  const deleteDocument = useCallback(async (id: string, spaceId?: string): Promise<boolean> => {
    try {
      const params = new URLSearchParams()
      if (spaceId || options.spaceId) params.set('spaceId', spaceId || options.spaceId || '')
      const response = await fetch(`/api/knowledge/documents/${id}?${params.toString()}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete document')
      }

      toast.success('Document deleted')
      await fetchDocuments()
      return true
    } catch (err: any) {
      toast.error(err.message)
      return false
    }
  }, [fetchDocuments])

  const getDocument = useCallback(async (id: string, spaceId?: string): Promise<KnowledgeDocument | null> => {
    try {
      const params = new URLSearchParams()
      if (spaceId || options.spaceId) params.set('spaceId', spaceId || options.spaceId || '')
      const response = await fetch(`/api/knowledge/documents/${id}?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch document')
      }

      const data = await response.json()
      return data.document
    } catch (err: any) {
      toast.error(err.message)
      return null
    }
  }, [])

  return {
    documents,
    loading,
    error,
    total,
    page,
    limit,
    totalPages,
    refetch: fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    getDocument,
  }
}

