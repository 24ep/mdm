/**
 * Shared file utilities
 * Centralized file-related helper functions
 */

/**
 * Get file icon based on MIME type
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive'
  if (mimeType.includes('text') || mimeType.includes('code')) return 'code'
  return 'file'
}

/**
 * Check if file is an image based on MIME type
 */
export function isImageFile(mimeType?: string): boolean {
  return mimeType?.startsWith('image/') || false
}

/**
 * Check if file is a video based on MIME type
 */
export function isVideoFile(mimeType?: string): boolean {
  return mimeType?.startsWith('video/') || false
}

/**
 * Check if file is an audio file based on MIME type
 */
export function isAudioFile(mimeType?: string): boolean {
  return mimeType?.startsWith('audio/') || false
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

/**
 * Check if file type is supported for preview
 */
export function isPreviewable(mimeType?: string): boolean {
  if (!mimeType) return false
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/') ||
    mimeType === 'application/pdf' ||
    mimeType.includes('text')
  )
}

