'use client'

import { useState } from 'react'
import { downloadAttachment, extractFilenameFromKey } from '@/lib/download-utils'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'

interface PdfDownloadProps {
  dashboardId: string
  dashboardName: string
  className?: string
}

export function PdfDownload({ dashboardId, dashboardName, className }: PdfDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setIsDownloading(true)
    setError(null)

    try {
      // Call the PDF export API
      const response = await fetch(`/api/dashboards/${dashboardId}/export/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate PDF')
      }

      const { key, bucket, filename } = await response.json()

      // Download using presigned URL
      await downloadAttachment(bucket, key, {
        filename: filename || `${dashboardName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
        contentType: 'application/pdf',
      })
    } catch (error) {
      console.error('Error downloading PDF:', error)
      setError(error instanceof Error ? error.message : 'Failed to download PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className={className}>
      <Button
        onClick={handleDownload}
        disabled={isDownloading}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        {isDownloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isDownloading ? 'Generating...' : 'Download PDF'}
      </Button>
      
      {error && (
        <p className="text-sm text-red-600 mt-2">
          {error}
        </p>
      )}
    </div>
  )
}
