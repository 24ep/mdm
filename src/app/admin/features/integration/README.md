# Integration Feature

This feature contains all integration, API management, and webhook functionality.

## Structure

```
integration/
├── components/
│   ├── IntegrationHub.tsx      # Integration management
│   └── APIManagement.tsx      # API keys and webhooks
├── types.ts                    # Shared type definitions
├── utils.ts                    # Utility functions
├── index.ts                    # Public exports
└── README.md                   # This file
```

## Components

### IntegrationHub
- OAuth provider integrations
- Webhook integrations
- Database integrations
- SSO integrations
- Integration status monitoring
- Integration configuration

### APIManagement
- API key management
- Webhook management
- API usage statistics
- Rate limiting configuration
- API key permissions
- Webhook event configuration

## Usage

```typescript
// Import components
import {
  IntegrationHub,
  APIManagement,
} from '@/app/admin/features/integration'

// Import types
import { Integration, APIKey, Webhook, OAuthProvider } from '@/app/admin/features/integration'

// Import utilities
import { getIntegrationStatusColor, isIntegrationActive, filterIntegrationsByType } from '@/app/admin/features/integration'
```

## Types

- `Integration` - Integration configuration
- `OAuthProvider` - OAuth provider information
- `WebhookIntegration` - Webhook integration configuration
- `APIKey` - API key configuration
- `Webhook` - Webhook configuration
- `APIUsage` - API usage statistics
- `RateLimit` - Rate limit configuration

## Utilities

- `getIntegrationStatusColor(status)` - Get badge color for integration status
- `formatIntegrationType(type)` - Format integration type display name
- `isIntegrationActive(integration)` - Check if integration is active
- `filterIntegrationsByType(integrations, type)` - Filter integrations by type
- `filterIntegrationsByStatus(integrations, status)` - Filter integrations by status
- `isAPIKeyActive(key)` - Check if API key is active
- `isAPIKeyExpired(key)` - Check if API key is expired
- `isWebhookActive(webhook)` - Check if webhook is active
- `calculateWebhookSuccessRate(webhook)` - Calculate webhook success rate
- `formatRateLimitWindow(window)` - Format rate limit window display name
- `sortIntegrationsByName(integrations, order)` - Sort integrations by name
- `sortAPIKeysByDate(keys, order)` - Sort API keys by creation date

## Migration Notes

This feature was migrated from `src/app/admin/components/` to demonstrate the new feature-based structure. All imports have been updated to use the new location.

Note: `APIConfiguration` component remains in `src/app/admin/components/` as it may be shared across multiple features.

