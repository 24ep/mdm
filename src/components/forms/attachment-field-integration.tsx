"use client"

import { useState, useEffect } from 'react'
import { AttachmentManager } from '@/components/ui/attachment-manager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Image, Download, Trash2 } from 'lucide-react'
import { useAttachments } from '@/hooks/use-attachments'

interface AttachmentFieldIntegrationProps {
  spaceId: string
  dataModelId: string
  attributeId: string
  recordId?: string
  attribute: {
    id: string
    code: string
    label: string
    type: string
    allowed_file_types?: string[]
    max_file_size?: number
    allow_multiple_files?: boolean
  }
  value?: any
  onChange?: (value: any) => void
  readOnly?: boolean
}

export function AttachmentFieldIntegration({
  spaceId,
  dataModelId,
  attributeId,
  recordId,
  attribute,
  value,
  onChange,
  readOnly = false
}: AttachmentFieldIntegrationProps) {
  const [attachments, setAttachments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    uploadFile,
    downloadFile,
    deleteFile,
    listAttachments,
    loading: attachmentsLoading
  } = useAttachments(spaceId, dataModelId, attributeId, recordId)

  // Load existing attachments
  useEffect(() => {
    if (recordId) {
      loadAttachments()
    }
  }, [recordId])

  const loadAttachments = async () => {
    try {
      setLoading(true)
      const files = await listAttachments()
      setAttachments(files)
    } catch (err) {
      setError('Failed to load attachments')
      console.error('Error loading attachments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (files: File[]) => {
    try {
      setError(null)
      const uploadPromises = files.map(file => uploadFile(file))
      const uploadedFiles = await Promise.all(uploadPromises)
      
      const newAttachments = [...attachments, ...uploadedFiles]
      setAttachments(newAttachments)
      
      // Update parent form
      if (onChange) {
        onChange(newAttachments)
      }
    } catch (err) {
      setError('Failed to upload files')
      console.error('Error uploading files:', err)
    }
  }

  const handleFileDelete = async (fileId: string) => {
    try {
      setError(null)
      await deleteFile(fileId)
      
      const newAttachments = attachments.filter(att => att.id !== fileId)
      setAttachments(newAttachments)
      
      // Update parent form
      if (onChange) {
        onChange(newAttachments)
      }
    } catch (err) {
      setError('Failed to delete file')
      console.error('Error deleting file:', err)
    }
  }

  const handleFileDownload = async (fileId: string, fileName: string) => {
    try {
      setError(null)
      await downloadFile(fileId, fileName)
    } catch (err) {
      setError('Failed to download file')
      console.error('Error downloading file:', err)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />
    }
    return <FileText className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (readOnly) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {attribute.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attachments</p>
          ) : (
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    {getFileIcon(attachment.mime_type)}
                    <div>
                      <p className="text-sm font-medium">{attachment.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.file_size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileDownload(attachment.id, attachment.file_name)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {attribute.label}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">Attachment</Badge>
          {attribute.allow_multiple_files && (
            <Badge variant="outline">Multiple Files</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <AttachmentManager
          spaceId={spaceId}
          dataModelId={dataModelId}
          attributeId={attributeId}
          recordId={recordId}
          allowedFileTypes={attribute.allowed_file_types}
          maxFileSize={attribute.max_file_size}
          allowMultiple={attribute.allow_multiple_files}
          onUpload={handleFileUpload}
          onDelete={handleFileDelete}
          onDownload={handleFileDownload}
          existingFiles={attachments}
        />
      </CardContent>
    </Card>
  )
}
