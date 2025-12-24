import { PluginDefinition } from '../../types'

export const powerBiPlugin: PluginDefinition = {
  source: 'hub',
  id: 'power-bi',
  name: 'Power BI',
  slug: 'power-bi',
  version: '1.0.0',
  provider: 'Microsoft',
  providerUrl: 'https://powerbi.microsoft.com',
  category: 'business-intelligence',
  status: 'approved',
  verified: true,
  description: 'Connect and embed Power BI reports and dashboards. Supports OAuth authentication, report syncing, and multiple access types (API, SDK, Embed, Public Link).',
  capabilities: {
    reportEmbedding: true,
    reportSyncing: true,
    oauth: true,
    apiAccess: true,
    sdkAccess: true,
    publicLinkAccess: true,
  },
  apiBaseUrl: 'https://api.powerbi.com',
  apiAuthType: 'oauth2',
  apiAuthConfig: {
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['https://analysis.windows.net/powerbi/api/.default'],
    clientId: '',
    clientSecret: '',
  },
  uiType: 'react_component',
  uiConfig: {
    componentPath: '@/features/marketplace/plugins/power-bi/components/PowerBIIntegrationUI',
    configFields: {
      tenantId: {
        label: 'Tenant ID',
        type: 'text',
        placeholder: 'Enter your Azure AD Tenant ID',
        required: true,
      },
      clientId: {
        label: 'Client ID',
        type: 'text',
        placeholder: 'Enter your Azure AD Application Client ID',
        required: true,
      },
      workspaceId: {
        label: 'Workspace ID',
        type: 'text',
        placeholder: 'Enter your Power BI Workspace ID (optional)',
        required: false,
      },
    },
  },
  webhookSupported: false,
  webhookEvents: [],
  iconUrl: '/icons/power-bi.svg',
  screenshots: [],
  documentationUrl: 'https://docs.microsoft.com/en-us/power-bi/developer/',
  supportUrl: 'https://powerbi.microsoft.com/support',
  pricingInfo: {
    type: 'subscription',
    tiers: [
      {
        name: 'Free',
        price: 0,
        features: ['Basic embedding', 'Limited reports'],
      },
      {
        name: 'Pro',
        price: 9.99,
        features: ['Full embedding', 'Unlimited reports', 'OAuth support'],
      },
    ],
  },
  installationCount: 0,
  rating: undefined,
  reviewCount: 0,
  securityAudit: {
    lastAudited: new Date().toISOString(),
    vulnerabilities: [],
    compliance: ['SOC 2', 'ISO 27001'],
  },
}

