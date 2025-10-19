"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Eye, X, File, Image, FileText, Video, Music, Archive } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface FilePreviewProps {
  file: {
    id: string
    originalName: string
    contentType: string
    fileSize: number
    url?: string
  }
  onDownload?: (fileId: string, fileName: string) => void
  onDelete?: (fileId: string) => void
  showActions?: boolean
  className?: string
}

export function FilePreview({
  file,
  onDownload,
  onDelete,
  showActions = true,
  className = ''
}: FilePreviewProps) {
  const [showPreview, setShowPreview] = useState(false)

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <Image className="h-4 w-4" />
    if (contentType.startsWith('video/')) return <Video className="h-4 w-4" />
    if (contentType.startsWith('audio/')) return <Music className="h-4 w-4" />
    if (contentType.includes('pdf') || contentType.includes('document') || contentType.includes('text')) {
      return <FileText className="h-4 w-4" />
    }
    if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('tar')) {
      return <Archive className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const canPreview = file.contentType.startsWith('image/') || 
                    file.contentType.startsWith('video/') || 
                    file.contentType.startsWith('audio/') ||
                    file.contentType.includes('pdf')

  const handlePreview = () => {
    if (canPreview) {
      setShowPreview(true)
    }
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload(file.id, file.originalName)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(file.id)
    }
  }

  return (
    <>
      <div className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${className}`}>
        <div className="flex items-center space-x-3">
          {getFileIcon(file.contentType)}
          <div>
            <p className="text-sm font-medium">{file.originalName}</p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.fileSize)} • {file.contentType}
            </p>
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-2">
            {canPreview && (
              <Button
                size="sm"
                variant="outline"
                onClick={handlePreview}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{file.originalName}</DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-center items-center">
            {file.contentType.startsWith('image/') && (
              <img
                src={file.url}
                alt={file.originalName}
                className="max-w-full max-h-[60vh] object-contain"
              />
            )}
            
            {file.contentType.startsWith('video/') && (
              <video
                src={file.url}
                controls
                className="max-w-full max-h-[60vh]"
              >
                Your browser does not support the video tag.
              </video>
            )}
            
            {file.contentType.startsWith('audio/') && (
              <audio
                src={file.url}
                controls
                className="w-full"
              >
                Your browser does not support the audio tag.
              </audio>
            )}
            
            {file.contentType.includes('pdf') && (
              <iframe
                src={file.url}
                className="w-full h-[60vh] border-0"
                title={file.originalName}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
