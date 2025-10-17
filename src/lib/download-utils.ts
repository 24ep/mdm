/**
 * Download utility functions for handling file downloads with presigned URLs
 */

export interface DownloadOptions {
  filename?: string
  contentType?: string
}

/**
 * Download a file using a presigned URL
 */
export async function downloadFromPresignedUrl(
  presignedUrl: string,
  options: DownloadOptions = {}
): Promise<void> {
  try {
    // Fetch the file from the presigned URL
    const response = await fetch(presignedUrl, {
      method: 'GET',
      // Don't add any custom headers that might interfere with the signature
    })

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`)
    }

    // Get the blob data
    const blob = await response.blob()
    
    // Create object URL and trigger download
    const objectUrl = URL.createObjectURL(blob)
    
    // Create a temporary anchor element for download
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = options.filename || 'download'
    
    // Append to body, click, and remove
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
 * Get a presigned URL from the server and download the file
 */
export async function downloadAttachment(
  bucket: string,
  key: string,
  options: DownloadOptions = {}
): Promise<void> {
  try {
    // Get presigned URL from server
    const response = await fetch('/api/attachments/presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bucket,
        key,
        expiresIn: 300, // 5 minutes
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to get download URL')
    }

    const { presignedUrl } = await response.json()
    
    // Download using the presigned URL
    await downloadFromPresignedUrl(presignedUrl, options)
  } catch (error) {
    console.error('Error downloading attachment:', error)
    throw error
  }
}

/**
 * Extract filename from S3 key
 */
export function extractFilenameFromKey(key: string): string {
  const parts = key.split('/')
  return parts[parts.length - 1] || 'download'
}

/**
 * Parse S3 URL to extract bucket and key
 */
export function parseS3Url(url: string): { bucket: string; key: string } | null {
  try {
    // Handle different S3 URL formats
    const patterns = [
      // https://bucket.s3.region.amazonaws.com/key
      /https:\/\/([^\.]+)\.s3[^\.]*\.amazonaws\.com\/(.+)/,
      // https://s3.region.amazonaws.com/bucket/key
      /https:\/\/s3[^\.]*\.amazonaws\.com\/([^\/]+)\/(.+)/,
      // https://bucket.s3.amazonaws.com/key
      /https:\/\/([^\.]+)\.s3\.amazonaws\.com\/(.+)/,
      // MinIO format: http://localhost:9000/bucket/key
      /https?:\/\/[^\/]+\/([^\/]+)\/(.+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return {
          bucket: match[1],
          key: match[2],
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error parsing S3 URL:', error)
    return null
  }
}
