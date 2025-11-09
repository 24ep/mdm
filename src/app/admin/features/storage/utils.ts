/**
 * Storage Feature Utilities
 * Helper functions for storage operations
 */

import { Bucket, StorageFile, CacheInstance, Backup, BackupSchedule } from './types'
import { formatFileSize } from '@/lib/formatters'
import { getFileIcon } from '@/lib/file-utils'

// Re-export shared utilities
export { formatFileSize, getFileIcon }

/**
 * Check if file is an image
 */
export function isImageFile(file: StorageFile): boolean {
  return file.mimeType?.startsWith('image/') || false
}

/**
 * Check if file is a video
 */
export function isVideoFile(file: StorageFile): boolean {
  return file.mimeType?.startsWith('video/') || false
}

/**
 * Get cache instance status color
 */
export function getCacheStatusColor(status: CacheInstance['status']): string {
  switch (status) {
    case 'connected':
      return 'bg-green-600'
    case 'disconnected':
      return 'bg-gray-600'
    case 'error':
      return 'bg-red-600'
    default:
      return 'bg-gray-600'
  }
}

/**
 * Calculate cache hit rate percentage
 */
export function calculateCacheHitRate(hits: number, misses: number): number {
  const total = hits + misses
  if (total === 0) return 0
  return Math.round((hits / total) * 100)
}

/**
 * Get backup status color
 */
export function getBackupStatusColor(status: Backup['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-green-600'
    case 'running':
      return 'bg-blue-600'
    case 'failed':
      return 'bg-red-600'
    case 'scheduled':
      return 'bg-yellow-600'
    default:
      return 'bg-gray-600'
  }
}

/**
 * Filter files by search query
 */
export function filterFiles(files: StorageFile[], query: string): StorageFile[] {
  if (!query.trim()) return files
  
  const lowerQuery = query.toLowerCase()
  return files.filter(file =>
    file.name?.toLowerCase().includes(lowerQuery) ||
    file.mimeType?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Filter files by type
 */
export function filterFilesByType(files: StorageFile[], type: 'file' | 'folder' | 'all'): StorageFile[] {
  if (type === 'all') return files
  return files.filter(file => file.type === type)
}

/**
 * Sort files by name, size, or date
 */
export function sortFiles(
  files: StorageFile[],
  sortBy: 'name' | 'size' | 'date',
  order: 'asc' | 'desc' = 'asc'
): StorageFile[] {
  return [...files].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '')
        break
      case 'size':
        comparison = a.size - b.size
        break
      case 'date':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        break
    }
    
    return order === 'asc' ? comparison : -comparison
  })
}

/**
 * Calculate bucket total size
 */
export function calculateBucketSize(bucket: Bucket): string {
  return formatFileSize(bucket.totalSize)
}

/**
 * Check if backup is scheduled
 */
export function isBackupScheduled(backup: Backup): boolean {
  return backup.status === 'scheduled'
}

/**
 * Check if backup is running
 */
export function isBackupRunning(backup: Backup): boolean {
  return backup.status === 'running'
}

/**
 * Check if backup is completed
 */
export function isBackupCompleted(backup: Backup): boolean {
  return backup.status === 'completed'
}

/**
 * Check if schedule is active
 */
export function isScheduleActive(schedule: BackupSchedule): boolean {
  return schedule.isActive === true
}

/**
 * Format backup type display name
 */
export function formatBackupType(type: Backup['type']): string {
  const typeMap: Record<Backup['type'], string> = {
    full: 'Full Backup',
    incremental: 'Incremental',
    differential: 'Differential',
  }
  return typeMap[type] || type
}

/**
 * Format schedule frequency display name
 */
export function formatScheduleFrequency(frequency: BackupSchedule['frequency']): string {
  const freqMap: Record<BackupSchedule['frequency'], string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
  }
  return freqMap[frequency] || frequency
}

