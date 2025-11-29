/**
 * Status Color Utilities
 * Shared utilities for getting badge/status colors across the application
 */

/**
 * Generic status color mapping
 * Maps status values to Tailwind CSS color classes
 */
export type StatusColorMap<T extends string> = Record<T, string>

/**
 * Get status color from a color map
 * @param status - The status value
 * @param colorMap - Map of status values to color classes
 * @param defaultColor - Default color if status not found (default: 'bg-gray-600')
 * @returns Tailwind CSS color class
 */
export function getStatusColor<T extends string>(
  status: T | string,
  colorMap: StatusColorMap<T>,
  defaultColor: string = 'bg-gray-600'
): string {
  return colorMap[status as T] || defaultColor
}

/**
 * Common status color mappings
 * These can be reused across features
 */

/**
 * Connection status colors (connected/disconnected/error)
 */
export const connectionStatusColors: StatusColorMap<'connected' | 'disconnected' | 'error'> = {
  connected: 'bg-green-600',
  disconnected: 'bg-gray-600',
  error: 'bg-red-600',
}

/**
 * Job/Process status colors (completed/running/failed/pending)
 */
export const jobStatusColors: StatusColorMap<'completed' | 'running' | 'failed' | 'pending'> = {
  completed: 'bg-green-600',
  running: 'bg-blue-600',
  failed: 'bg-red-600',
  pending: 'bg-yellow-600',
}

/**
 * Approval status colors (approved/rejected/pending)
 */
export const approvalStatusColors: StatusColorMap<'approved' | 'rejected' | 'pending' | 'merged'> = {
  approved: 'bg-green-600',
  merged: 'bg-green-600',
  rejected: 'bg-red-600',
  pending: 'bg-yellow-600',
}

/**
 * Health status colors (healthy/degraded/down/unknown)
 */
export const healthStatusColors: StatusColorMap<'healthy' | 'degraded' | 'down' | 'unknown'> = {
  healthy: 'bg-green-600',
  degraded: 'bg-yellow-600',
  down: 'bg-red-600',
  unknown: 'bg-gray-600',
}

/**
 * Integration status colors (active/inactive/error/pending)
 */
export const integrationStatusColors: StatusColorMap<'active' | 'inactive' | 'error' | 'pending'> = {
  active: 'bg-green-600',
  inactive: 'bg-gray-600',
  error: 'bg-red-600',
  pending: 'bg-yellow-600',
}

/**
 * Priority colors (high/medium/low)
 */
export const priorityColors: StatusColorMap<'high' | 'medium' | 'low' | 'critical'> = {
  high: 'bg-red-600',
  critical: 'bg-red-600',
  medium: 'bg-yellow-600',
  low: 'bg-blue-600',
}

/**
 * Severity colors (low/medium/high/critical)
 */
export const severityColors: StatusColorMap<'low' | 'medium' | 'high' | 'critical'> = {
  low: 'bg-blue-600',
  medium: 'bg-yellow-600',
  high: 'bg-orange-600',
  critical: 'bg-red-600',
}

/**
 * Success/Error/Warning colors
 */
export const resultStatusColors: StatusColorMap<'success' | 'error' | 'warning'> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-yellow-600',
}

/**
 * Convenience functions for common patterns
 */

/**
 * Get connection status color
 */
export function getConnectionStatusColor(
  status: 'connected' | 'disconnected' | 'error'
): string {
  return getStatusColor(status, connectionStatusColors)
}

/**
 * Get job status color
 */
export function getJobStatusColor(
  status: 'completed' | 'running' | 'failed' | 'pending'
): string {
  return getStatusColor(status, jobStatusColors)
}

/**
 * Get approval status color
 */
export function getApprovalStatusColor(
  status: 'approved' | 'rejected' | 'pending' | 'merged'
): string {
  return getStatusColor(status, approvalStatusColors)
}

/**
 * Get health status color
 */
export function getHealthStatusColor(
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
): string {
  return getStatusColor(status, healthStatusColors)
}

/**
 * Get integration status color
 */
export function getIntegrationStatusColor(
  status: 'active' | 'inactive' | 'error' | 'pending'
): string {
  return getStatusColor(status, integrationStatusColors)
}

/**
 * Get priority color
 */
export function getPriorityColor(
  priority: 'high' | 'medium' | 'low' | 'critical'
): string {
  return getStatusColor(priority.toLowerCase() as any, priorityColors)
}

/**
 * Get severity color
 */
export function getSeverityColor(
  severity: 'low' | 'medium' | 'high' | 'critical'
): string {
  return getStatusColor(severity, severityColors)
}

/**
 * Get result status color (success/error/warning)
 */
export function getResultStatusColor(
  status: 'success' | 'error' | 'warning'
): string {
  return getStatusColor(status, resultStatusColors)
}

