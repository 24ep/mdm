/**
 * Integration Feature
 * Main export file for the integration feature
 */

// Components
export { IntegrationHub } from './components/IntegrationHub'
export { IntegrationList } from './components/IntegrationList'
export { APIManagement } from './components/APIManagement'
export { APIClient } from './components/APIClient'

// Types
export type {
  Integration,
  OAuthProvider,
  WebhookIntegration,
  APIKey,
  Webhook,
  APIUsage,
  RateLimit,
  HTTPMethod,
  AuthType,
  HTTPHeader,
  AuthConfig,
  RequestBody,
  APIRequest,
  APIResponse,
  RequestHistory,
  RequestCollection,
  Environment,
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

