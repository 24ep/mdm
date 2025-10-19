"use client"

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

interface Attachment {
  id: string
  originalName: string
  storedName: string
  fileSize: number
  contentType: string
  storageProvider: string
  storagePath: string
  storageUrl?: string
  uploadedBy: string
  uploadedAt: string
}

interface UseAttachmentsOptions {
  spaceId: string
  attributeId: string
  autoLoad?: boolean
}

interface UseAttachmentsReturn {
  attachments: Attachment[]
  loading: boolean
  uploading: boolean
  loadAttachments: () => Promise<void>
  uploadFile: (file: File) => Promise<Attachment | null>
  deleteAttachment: (attachmentId: string) => Promise<boolean>
  downloadAttachment: (attachmentId: string, fileName: string) => Promise<void>
  clearAttachments: () => void
}

export function useAttachments({
  spaceId,
  attributeId,
  autoLoad = true
}: UseAttachmentsOptions): UseAttachmentsReturn {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const loadAttachments = useCallback(async () => {
    if (!spaceId || !attributeId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/attachments?spaceId=${spaceId}&attributeId=${attributeId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load attachments')
      }

      const data = await response.json()
      setAttachments(data.attachments || [])
    } catch (error) {
      console.error('Error loading attachments:', error)
      toast.error('Failed to load attachments')
    } finally {
      setLoading(false)
    }
  }, [spaceId, attributeId])

  const uploadFile = useCallback(async (file: File): Promise<Attachment | null> => {
    if (!spaceId || !attributeId) {
      toast.error('Missing space or attribute information')
      return null
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('spaceId', spaceId)
      formData.append('attributeId', attributeId)

      const response = await fetch('/api/attachments/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      const newAttachment = data.attachment

      setAttachments(prev => [...prev, newAttachment])
      toast.success(`File ${file.name} uploaded successfully`)
      
      return newAttachment
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      toast.error(errorMessage)
      return null
    } finally {
      setUploading(false)
    }
  }, [spaceId, attributeId])

  const deleteAttachment = useCallback(async (attachmentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Delete failed')
      }

      setAttachments(prev => prev.filter(att => att.id !== attachmentId))
      toast.success('File deleted successfully')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed'
      toast.error(errorMessage)
      return false
    }
  }, [])

  const downloadAttachment = useCallback(async (attachmentId: string, fileName: string): Promise<void> => {
    try {
      const response = await fetch(`/api/attachments/${attachmentId}/download`)
      
      if (!response.ok) {
        throw new Error('Download failed')
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast.error('Download failed')
    }
  }, [])

  const clearAttachments = useCallback(() => {
    setAttachments([])
  }, [])

  // Auto-load attachments when dependencies change
  useEffect(() => {
    if (autoLoad && spaceId && attributeId) {
      loadAttachments()
    }
  }, [autoLoad, spaceId, attributeId, loadAttachments])

  return {
    attachments,
    loading,
    uploading,
    loadAttachments,
    uploadFile,
    deleteAttachment,
    downloadAttachment,
    clearAttachments
  }
}
