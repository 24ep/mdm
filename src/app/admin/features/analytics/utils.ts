/**
 * Analytics Feature Utilities
 * Helper functions for analytics operations
 */

import { SystemMetrics, HealthStatus, LogEntry, Alert, PerformanceMetric } from './types'

/**
 * Format health status badge color
 */
export function getHealthStatusColor(status: HealthStatus['status']): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-600'
    case 'degraded':
      return 'bg-yellow-600'
    case 'down':
      return 'bg-red-600'
    case 'unknown':
      return 'bg-gray-600'
    default:
      return 'bg-gray-600'
  }
}

/**
 * Format log level badge color
 */
export function getLogLevelColor(level: LogEntry['level']): string {
  switch (level) {
    case 'FATAL':
    case 'ERROR':
      return 'bg-red-600'
    case 'WARN':
      return 'bg-yellow-600'
    case 'INFO':
      return 'bg-blue-600'
    case 'DEBUG':
      return 'bg-gray-600'
    default:
      return 'bg-gray-600'
  }
}

/**
 * Format alert severity badge color
 */
export function getAlertSeverityColor(severity: Alert['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-600'
    case 'high':
      return 'bg-orange-600'
    case 'medium':
      return 'bg-yellow-600'
    case 'low':
      return 'bg-blue-600'
    default:
      return 'bg-gray-600'
  }
}

/**
 * Format uptime in human-readable format
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

/**
 * Format response time
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  } else {
    return `${(ms / 1000).toFixed(2)}s`
  }
}

/**
 * Calculate storage percentage
 */
export function calculateStoragePercentage(used: number, limit: number): number {
  if (limit === 0) return 0
  return Math.round((used / limit) * 100)
}

/**
 * Format storage size
 */
export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Filter log entries by search query
 */
export function filterLogs(logs: LogEntry[], query: string): LogEntry[] {
  if (!query.trim()) return logs
  
  const lowerQuery = query.toLowerCase()
  return logs.filter(log =>
    log.message?.toLowerCase().includes(lowerQuery) ||
    log.service?.toLowerCase().includes(lowerQuery) ||
    log.level?.toLowerCase().includes(lowerQuery) ||
    log.userId?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Filter log entries by level
 */
export function filterLogsByLevel(logs: LogEntry[], level: LogEntry['level'] | 'all'): LogEntry[] {
  if (level === 'all') return logs
  return logs.filter(log => log.level === level)
}

/**
 * Filter log entries by service
 */
export function filterLogsByService(logs: LogEntry[], service: string): LogEntry[] {
  if (!service || service === 'all') return logs
  return logs.filter(log => log.service === service)
}

/**
 * Sort log entries by timestamp
 */
export function sortLogsByTimestamp(logs: LogEntry[], order: 'asc' | 'desc' = 'desc'): LogEntry[] {
  return [...logs].sort((a, b) => {
    const aTime = new Date(a.timestamp).getTime()
    const bTime = new Date(b.timestamp).getTime()
    return order === 'desc' ? bTime - aTime : aTime - bTime
  })
}

/**
 * Check if alert is active
 */
export function isAlertActive(alert: Alert): boolean {
  return alert.isActive === true
}

/**
 * Get performance metric trend
 */
export function getMetricTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const diff = current - previous
  const threshold = previous * 0.05 // 5% threshold
  
  if (Math.abs(diff) < threshold) return 'stable'
  return diff > 0 ? 'up' : 'down'
}

/**
 * Calculate error rate percentage
 */
export function calculateErrorRate(errors: number, total: number): number {
  if (total === 0) return 0
  return Math.round((errors / total) * 100)
}

