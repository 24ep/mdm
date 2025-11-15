import { PluginDefinition } from '../../types'

export const lookerStudioPlugin: PluginDefinition = {
  id: 'looker-studio',
  name: 'Looker Studio',
  slug: 'looker-studio',
  version: '1.0.0',
  provider: 'Google',
  providerUrl: 'https://lookerstudio.google.com',
  category: 'business-intelligence',
  status: 'approved',
  verified: true,
  description: 'Connect and embed Looker Studio reports. Supports OAuth authentication and report syncing.',
  capabilities: {
    reportEmbedding: true,
    reportSyncing: true,
    oauth: true,
    apiAccess: true,
    publicLinkAccess: true,
  },
  apiBaseUrl: 'https://lookerstudio.googleapis.com',
  apiAuthType: 'oauth2',
  apiAuthConfig: {
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/datastudio.readonly'],
    clientId: '',
    clientSecret: '',
  },
  uiType: 'react_component',
  uiConfig: {
    componentPath: '@/features/marketplace/plugins/looker-studio/components/LookerStudioIntegrationUI',
    configFields: {
      clientId: {
        label: 'Client ID',
        type: 'text',
        placeholder: 'Enter your Google OAuth Client ID',
        required: true,
      },
      clientSecret: {
        label: 'Client Secret',
        type: 'password',
        placeholder: 'Enter your Google OAuth Client Secret',
        required: true,
      },
    },
  },
  webhookSupported: false,
  webhookEvents: [],
  iconUrl: '/icons/looker-studio.svg',
  screenshots: [],
  documentationUrl: 'https://developers.google.com/looker-studio',
  supportUrl: 'https://support.google.com/looker-studio',
  pricingInfo: {
    type: 'free',
    note: 'Looker Studio is free to use',
  },
  installationCount: 0,
  rating: null,
  reviewCount: 0,
  securityAudit: {
    lastAudited: new Date().toISOString(),
    vulnerabilities: [],
    compliance: ['SOC 2', 'ISO 27001'],
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}

