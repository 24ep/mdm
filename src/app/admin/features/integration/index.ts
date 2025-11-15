/**
 * Integration Feature
 * Main export file for the integration feature
 */

// Components
export { IntegrationHub } from './components/IntegrationHub'
export { IntegrationList } from './components/IntegrationList'
export { APIManagement } from './components/APIManagement'

// Types
export type {
  Integration,
  OAuthProvider,
  WebhookIntegration,
  APIKey,
  Webhook,
  APIUsage,
  RateLimit,
} from './types'

// Utils
export {
  getIntegrationStatusColor,
  formatIntegrationType,
  isIntegrationActive,
  filterIntegrationsByType,
  filterIntegrationsByStatus,
  isAPIKeyActive,
  isAPIKeyExpired,
  isWebhookActive,
  calculateWebhookSuccessRate,
  formatRateLimitWindow,
  sortIntegrationsByName,
  sortAPIKeysByDate,
} from './utils'

