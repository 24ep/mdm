/**
 * Storage Feature
 * Main export file for the storage feature
 */

// Components
export { StorageManagement } from './components/StorageManagement'
export { CacheManagement } from './components/CacheManagement'
export { BackupRecovery } from './components/BackupRecovery'
export { StorageManagement as FileSystemManagement } from './components/FileSystemManagement'

// Types
export type {
  Bucket,
  StorageFile,
  CacheInstance,
  CacheKey,
  CacheStats,
  CacheConfig,
  Backup,
  BackupSchedule,
  RestorePoint,
} from './types'

// Utils
export {
  formatFileSize,
  getFileIcon,
  isImageFile,
  isVideoFile,
  getCacheStatusColor,
  calculateCacheHitRate,
  getBackupStatusColor,
  filterFiles,
  filterFilesByType,
  sortFiles,
  calculateBucketSize,
  isBackupScheduled,
  isBackupRunning,
  isBackupCompleted,
  isScheduleActive,
  formatBackupType,
  formatScheduleFrequency,
} from './utils'

