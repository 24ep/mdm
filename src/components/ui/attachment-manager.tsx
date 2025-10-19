"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/ui/file-upload'
import { FilePreview } from '@/components/ui/file-preview'
import { useAttachments } from '@/hooks/use-attachments'
import { Upload, File, AlertCircle, Loader2 } from 'lucide-react'
import { FILE_UPLOAD_LIMITS, validateFileSize, isFileTypeAllowed } from '@/lib/storage-config'

interface AttachmentManagerProps {
  spaceId: string
  attributeId: string
  maxFiles?: number
  maxFileSizeMB?: number
  allowedFileTypes?: string[]
  disabled?: boolean
  className?: string
  onAttachmentsChange?: (attachments: any[]) => void
}

export function AttachmentManager({
  spaceId,
  attributeId,
  maxFiles = FILE_UPLOAD_LIMITS.MAX_FILES_PER_ATTRIBUTE,
  maxFileSizeMB = FILE_UPLOAD_LIMITS.MAX_FILE_SIZE_MB,
  allowedFileTypes = FILE_UPLOAD_LIMITS.ALLOWED_FILE_TYPES,
  disabled = false,
  className = '',
  onAttachmentsChange
}: AttachmentManagerProps) {
  const {
    attachments,
    loading,
    uploading,
    uploadFile,
    deleteAttachment,
    downloadAttachment
  } = useAttachments({
    spaceId,
    attributeId,
    autoLoad: true
  })

  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    
    // Validate files
    for (const file of fileArray) {
      // Check file size
      if (!validateFileSize(file.size, maxFileSizeMB)) {
        throw new Error(`File ${file.name} exceeds maximum size of ${maxFileSizeMB}MB`)
      }

      // Check file type
      if (!isFileTypeAllowed(file.name, allowedFileTypes)) {
        const fileExtension = file.name.split('.').pop()
        throw new Error(`File type .${fileExtension} is not allowed`)
      }
    }

    // Check file count limit
    if (attachments.length + fileArray.length > maxFiles) {
      throw new Error(`Cannot upload more than ${maxFiles} files`)
    }

    // Upload files
    for (const file of fileArray) {
      await uploadFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    handleFileSelect(files).catch(error => {
      console.error('Upload error:', error)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const canUploadMore = attachments.length < maxFiles

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {canUploadMore && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-1">
            {dragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-gray-500">
            Max file size: {maxFileSizeMB}MB
            {allowedFileTypes.length > 0 && (
              <span> • Allowed types: {allowedFileTypes.join(', ')}</span>
            )}
          </p>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading files...</span>
        </div>
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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading attachments...</span>
        </div>
      )}

      {/* Attachments List */}
      {!loading && attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Attached Files ({attachments.length})</h4>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <FilePreview
                key={attachment.id}
                file={{
                  id: attachment.id,
                  originalName: attachment.originalName,
                  contentType: attachment.contentType,
                  fileSize: attachment.fileSize,
                  url: attachment.storageUrl
                }}
                onDownload={downloadAttachment}
                onDelete={deleteAttachment}
                showActions={!disabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && attachments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No files attached</p>
          <p className="text-xs">Upload files using the area above</p>
        </div>
      )}
    </div>
  )
}
