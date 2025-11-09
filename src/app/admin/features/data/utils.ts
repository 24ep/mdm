/**
 * Data Management Feature Utilities
 * Helper functions for data operations
 */

import { DatabaseConnection, ExportJob, ImportJob, Migration, LintResult, TableInfo } from './types'
import { formatFileSize } from '@/lib/formatters'

// Re-export shared utilities
export { formatFileSize }

/**
 * Format database connection status badge color
 */
export function getConnectionStatusColor(status: DatabaseConnection['status']): string {
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
 * Format export/import job status badge color
 */
export function getJobStatusColor(status: ExportJob['status'] | ImportJob['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-green-600'
    case 'running':
      return 'bg-blue-600'
    case 'failed':
      return 'bg-red-600'
    case 'pending':
      return 'bg-yellow-600'
    default:
      return 'bg-gray-600'
  }
}

/**
 * Format database type display name
 * Note: This function is kept for backward compatibility.
 * For new code, use getAsset() from @/lib/assets to get localized names.
 */
export function formatDatabaseType(type: DatabaseConnection['type']): string {
  const typeMap: Record<DatabaseConnection['type'], string> = {
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    sqlite: 'SQLite',
    mongodb: 'MongoDB',
    redis: 'Redis',
  }
  return typeMap[type] || type
}

/**
 * Check if database connection is active
 */
export function isConnectionActive(connection: DatabaseConnection): boolean {
  return connection.isActive && connection.status === 'connected'
}

/**
 * Filter database connections by search query
 */
export function filterConnections(connections: DatabaseConnection[], query: string): DatabaseConnection[] {
  if (!query.trim()) return connections
  
  const lowerQuery = query.toLowerCase()
  return connections.filter(conn =>
    conn.name?.toLowerCase().includes(lowerQuery) ||
    conn.database?.toLowerCase().includes(lowerQuery) ||
    conn.host?.toLowerCase().includes(lowerQuery) ||
    conn.type?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Filter export/import jobs by status
 */
export function filterJobsByStatus<T extends ExportJob | ImportJob>(
  jobs: T[],
  status: T['status'] | 'all'
): T[] {
  if (status === 'all') return jobs
  return jobs.filter(job => job.status === status)
}

/**
 * Sort migrations by version
 */
export function sortMigrationsByVersion(migrations: Migration[], order: 'asc' | 'desc' = 'desc'): Migration[] {
  return [...migrations].sort((a, b) => {
    const aVersion = a.version || ''
    const bVersion = b.version || ''
    return order === 'desc' ? bVersion.localeCompare(aVersion) : aVersion.localeCompare(bVersion)
  })
}

/**
 * Get lint result summary
 */
export function getLintSummary(result: LintResult | null): { errors: number; warnings: number; info: number } {
  if (!result) return { errors: 0, warnings: 0, info: 0 }
  
  return {
    errors: result.issues.filter(i => i.severity === 'error').length,
    warnings: result.issues.filter(i => i.severity === 'warning').length,
    info: result.issues.filter(i => i.severity === 'info').length,
  }
}

/**
 * Format table size in human-readable format
 */
export function formatTableSize(size: number): string {
  return formatFileSize(size)
}

/**
 * Check if migration is applied
 */
export function isMigrationApplied(migration: Migration): boolean {
  return migration.status === 'applied'
}

/**
 * Check if migration can be rolled back
 */
export function canRollbackMigration(migration: Migration): boolean {
  return migration.status === 'applied' && !!migration.downSql
}

