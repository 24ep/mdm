/**
 * Security Feature Utilities
 * Helper functions for security operations
 */

import { AuditLog, SecurityEvent, SecurityPolicy } from './types'

/**
 * Format security event severity badge color
 */
export function getSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
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
 * Format audit log status badge color
 */
export function getStatusColor(status: 'success' | 'error' | 'warning'): string {
  switch (status) {
    case 'success':
      return 'bg-green-600'
    case 'error':
      return 'bg-red-600'
    case 'warning':
      return 'bg-yellow-600'
    default:
      return 'bg-gray-600'
  }
}

/**
 * Filter audit logs by search query
 */
export function filterAuditLogs(logs: AuditLog[], query: string): AuditLog[] {
  if (!query.trim()) return logs
  
  const lowerQuery = query.toLowerCase()
  return logs.filter(log =>
    log.userName?.toLowerCase().includes(lowerQuery) ||
    log.action?.toLowerCase().includes(lowerQuery) ||
    log.resource?.toLowerCase().includes(lowerQuery) ||
    log.resourceType?.toLowerCase().includes(lowerQuery) ||
    log.ipAddress?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Filter audit logs by severity
 */
export function filterBySeverity(logs: AuditLog[], severity: 'low' | 'medium' | 'high' | 'critical' | 'all'): AuditLog[] {
  if (severity === 'all') return logs
  return logs.filter(log => log.severity === severity)
}

/**
 * Filter audit logs by status
 */
export function filterByStatus(logs: AuditLog[], status: 'success' | 'error' | 'warning' | 'all'): AuditLog[] {
  if (status === 'all') return logs
  return logs.filter(log => log.status === status)
}

/**
 * Sort audit logs by timestamp
 */
export function sortAuditLogs(logs: AuditLog[], order: 'asc' | 'desc' = 'desc'): AuditLog[] {
  return [...logs].sort((a, b) => {
    const aTime = new Date(a.timestamp).getTime()
    const bTime = new Date(b.timestamp).getTime()
    return order === 'desc' ? bTime - aTime : aTime - bTime
  })
}

/**
 * Check if security policy is active
 */
export function isPolicyActive(policy: SecurityPolicy): boolean {
  return policy.isActive === true
}

/**
 * Format security policy type display name
 */
export function formatPolicyType(type: SecurityPolicy['type']): string {
  const typeMap: Record<SecurityPolicy['type'], string> = {
    password: 'Password Policy',
    session: 'Session Policy',
    ip: 'IP Whitelist',
    rate_limit: 'Rate Limiting',
    '2fa': 'Two-Factor Authentication',
  }
  return typeMap[type] || type
}

/**
 * Get security event icon based on type
 */
export function getSecurityEventIcon(type: SecurityEvent['type']): string {
  const iconMap: Record<SecurityEvent['type'], string> = {
    login_attempt: 'LogIn',
    permission_denied: 'Shield',
    data_access: 'Database',
    config_change: 'Settings',
    user_action: 'User',
    failed_login: 'XCircle',
    suspicious_activity: 'AlertTriangle',
    password_change: 'Key',
    '2fa_enabled': 'Shield'
  }
  return iconMap[type] || 'AlertCircle'
}

