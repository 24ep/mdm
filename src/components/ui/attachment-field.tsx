"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/ui/file-upload'
import { Download, Trash2, File, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface AttachmentFieldProps {
  spaceId: string
  attributeId: string
  value?: any[] // Array of attachment objects
  onChange?: (attachments: any[]) => void
  maxFiles?: number
  disabled?: boolean
  className?: string
}

export function AttachmentField({
  spaceId,
  attributeId,
  value = [],
  onChange,
  maxFiles = 10,
  disabled = false,
  className = ''
}: AttachmentFieldProps) {
  const [attachments, setAttachments] = useState<any[]>(value)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setAttachments(value)
  }, [value])

  const handleUploadComplete = (file: any) => {
    const newAttachments = [...attachments, file]
    setAttachments(newAttachments)
    onChange?.(newAttachments)
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
  }

  const handleRemoveAttachment = async (attachmentId: string) => {
    if (disabled) return

    try {
      setLoading(true)
      
      // Call delete API endpoint
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Delete failed')
      }

      // Remove from local state
      const newAttachments = attachments.filter(att => att.id !== attachmentId)
      setAttachments(newAttachments)
      onChange?.(newAttachments)
      
      toast.success('File deleted successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadAttachment = async (attachmentId: string, fileName: string) => {
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
  }

  const canUploadMore = attachments.length < maxFiles

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Section */}
      {canUploadMore && (
        <FileUpload
          spaceId={spaceId}
          attributeId={attributeId}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          multiple={true}
          disabled={disabled}
        />
      )}

      {/* File Limit Warning */}
      {!canUploadMore && (
        <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            Maximum number of files ({maxFiles}) reached
          </span>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Attached Files ({attachments.length})</h4>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{attachment.originalName}</p>
                    <p className="text-xs text-gray-500">
                      {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadAttachment(attachment.id, attachment.originalName)}
                    disabled={loading}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    disabled={disabled || loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {attachments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No files attached</p>
          <p className="text-xs">Upload files using the area above</p>
        </div>
      )}
    </div>
  )
}
