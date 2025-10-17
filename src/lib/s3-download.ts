/**
 * Utility functions for downloading files from S3 using presigned URLs
 */

export interface DownloadOptions {
  key: string
  bucket: string
  filename?: string
  expiresIn?: number
}

export interface PresignedUrlResponse {
  success: boolean
  url: string
  expiresIn: number
  error?: string
}

/**
 * Downloads a file from S3 using a presigned URL
 */
export async function downloadFromS3(options: DownloadOptions): Promise<void> {
  try {
    // Get presigned URL from server
    const response = await fetch('/api/s3/presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: options.key,
        bucket: options.bucket,
        expiresIn: options.expiresIn || 300, // 5 minutes default
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to get presigned URL')
    }

    const data: PresignedUrlResponse = await response.json()

    if (!data.success || !data.url) {
      throw new Error('Invalid response from server')
    }

    // Download the file using the presigned URL
    await downloadFile(data.url, options.filename || extractFilename(options.key))
  } catch (error) {
    console.error('Error downloading from S3:', error)
    throw error
  }
}

/**
 * Downloads a file from a URL and triggers browser download
 */
async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    // Fetch the file
    const response = await fetch(url, {
      method: 'GET',
      // Don't add any custom headers that might interfere with S3
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Get the blob
    const blob = await response.blob()

    // Create object URL and trigger download
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    link.style.display = 'none'

    // Add to DOM, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up object URL
    URL.revokeObjectURL(objectUrl)
  } catch (error) {
    console.error('Error downloading file:', error)
    throw error
  }
}

/**
 * Extracts filename from S3 key
 */
function extractFilename(key: string): string {
  const parts = key.split('/')
  return parts[parts.length - 1] || 'download'
}

/**
 * Downloads a PDF file from S3 (specific for PDF exports)
 */
export async function downloadPDFFromS3(
  key: string,
  bucket: string = 'studio-production',
  filename?: string
): Promise<void> {
  const defaultFilename = filename || `export_${Date.now()}.pdf`
  return downloadFromS3({
    key,
    bucket,
    filename: defaultFilename,
    expiresIn: 300, // 5 minutes for PDF downloads
  })
}

/**
 * Downloads an attachment from S3
 */
export async function downloadAttachmentFromS3(
  key: string,
  bucket: string = 'studio-production',
  filename?: string
): Promise<void> {
  const defaultFilename = filename || extractFilename(key)
  return downloadFromS3({
    key,
    bucket,
    filename: defaultFilename,
    expiresIn: 600, // 10 minutes for attachments
  })
}
