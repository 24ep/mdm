/**
 * Integration Feature Utilities
 * Helper functions for integration operations
 */

import { Integration, APIKey, Webhook, WebhookIntegration } from './types'

/**
 * Get integration status badge color
 */
export function getIntegrationStatusColor(status: Integration['status']): string {
  switch (status) {
    case 'active':
      return 'bg-green-600'
    case 'inactive':
      return 'bg-gray-600'
    case 'error':
      return 'bg-red-600'
    case 'pending':
      return 'bg-yellow-600'
    default:
      return 'bg-gray-600'
  }
}

/**
 * Format integration type display name
 */
export function formatIntegrationType(type: Integration['type']): string {
  const typeMap: Record<Integration['type'], string> = {
    oauth: 'OAuth',
    webhook: 'Webhook',
    api: 'API',
    database: 'Database',
    sso: 'SSO',
  }
  return typeMap[type] || type
}

/**
 * Check if integration is active
 */
export function isIntegrationActive(integration: Integration): boolean {
  return integration.isEnabled && integration.status === 'active'
}

/**
 * Filter integrations by type
 */
export function filterIntegrationsByType(
  integrations: Integration[],
  type: Integration['type'] | 'all'
): Integration[] {
  if (type === 'all') return integrations
  return integrations.filter(integration => integration.type === type)
}

/**
 * Filter integrations by status
 */
export function filterIntegrationsByStatus(
  integrations: Integration[],
  status: Integration['status'] | 'all'
): Integration[] {
  if (status === 'all') return integrations
  return integrations.filter(integration => integration.status === status)
}

/**
 * Check if API key is active
 */
export function isAPIKeyActive(key: APIKey): boolean {
  return key.isActive === true
}

/**
 * Check if API key is expired
 */
export function isAPIKeyExpired(key: APIKey): boolean {
  if (!key.expiresAt) return false
  return new Date(key.expiresAt) < new Date()
}

/**
 * Check if webhook is active
 */
export function isWebhookActive(webhook: Webhook | WebhookIntegration): boolean {
  return webhook.isActive === true
}

/**
 * Calculate webhook success rate
 */
export function calculateWebhookSuccessRate(webhook: Webhook | WebhookIntegration): number {
  const total = webhook.successCount + webhook.failureCount
  if (total === 0) return 0
  return Math.round((webhook.successCount / total) * 100)
}

/**
 * Format rate limit window display name
 */
export function formatRateLimitWindow(window: string): string {
  const windowMap: Record<string, string> = {
    second: 'Per Second',
    minute: 'Per Minute',
    hour: 'Per Hour',
    day: 'Per Day',
    week: 'Per Week',
    month: 'Per Month',
  }
  return windowMap[window] || window
}

/**
 * Sort integrations by name
 */
export function sortIntegrationsByName(
  integrations: Integration[],
  order: 'asc' | 'desc' = 'asc'
): Integration[] {
  return [...integrations].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name)
    return order === 'asc' ? comparison : -comparison
  })
}

/**
 * Sort API keys by creation date
 */
export function sortAPIKeysByDate(
  keys: APIKey[],
  order: 'asc' | 'desc' = 'desc'
): APIKey[] {
  return [...keys].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime()
    const bTime = new Date(b.createdAt).getTime()
    return order === 'desc' ? bTime - aTime : aTime - bTime
  })
}

