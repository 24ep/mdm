"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, File, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useFileDragDrop } from '@/hooks/use-file-drag-drop'

interface FileUploadProps {
  spaceId: string
  attributeId: string
  onUploadComplete?: (file: any) => void
  onUploadError?: (error: string) => void
  maxFileSize?: number // in MB
  allowedFileTypes?: string[] // file extensions
  multiple?: boolean
  disabled?: boolean
  className?: string
}

export function FileUpload({
  spaceId,
  attributeId,
  onUploadComplete,
  onUploadError,
  maxFileSize = 10,
  allowedFileTypes = [],
  multiple = false,
  disabled = false,
  className = ''
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])

  const handleFileSelect = async (files: FileList) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    
    // Validate files
    for (const file of fileArray) {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds maximum size of ${maxFileSize}MB`)
        onUploadError?.(`File ${file.name} exceeds maximum size of ${maxFileSize}MB`)
        return
      }

      // Check file type
      if (allowedFileTypes.length > 0) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase()
        if (!fileExtension || !allowedFileTypes.includes(fileExtension)) {
          toast.error(`File type .${fileExtension} is not allowed`)
          onUploadError?.(`File type .${fileExtension} is not allowed`)
          return
        }
      }
    }

    setUploading(true)

    try {
      const uploadPromises = fileArray.map(async (file) => {
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

        const result = await response.json()
        return result.attachment
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      setUploadedFiles(prev => [...prev, ...uploadedFiles])
      
      uploadedFiles.forEach(file => {
        onUploadComplete?.(file)
        toast.success(`File ${file.originalName} uploaded successfully`)
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      toast.error(errorMessage)
      onUploadError?.(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const {
    dragOver,
    fileInputRef,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileInputChange,
    openFileDialog
  } = useFileDragDrop({
    disabled,
    onFilesSelected: handleFileSelect,
    multiple
  })

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 mb-1">
          {dragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-xs text-gray-500">
          Max file size: {maxFileSize}MB
          {allowedFileTypes.length > 0 && (
            <span> • Allowed types: {allowedFileTypes.join(', ')}</span>
          )}
        </p>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Uploading files...</span>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Uploaded Files</Label>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{file.originalName}</p>
                    <p className="text-xs text-gray-500">
                      {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {file.url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      View
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeFile(file.id)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
