import { PluginDefinition } from '../../types'

export const grafanaPlugin: PluginDefinition = {
  source: 'hub',
  id: 'grafana',
  name: 'Grafana',
  slug: 'grafana',
  version: '1.0.0',
  provider: 'Grafana Labs',
  providerUrl: 'https://grafana.com',
  category: 'monitoring-observability',
  status: 'approved',
  verified: true,
  description: 'Connect and embed Grafana dashboards. Supports API key authentication, dashboard syncing, and multiple access types (SDK, Embed, Public Link).',
  capabilities: {
    dashboardEmbedding: true,
    dashboardSyncing: true,
    apiAccess: true,
    sdkAccess: true,
    publicLinkAccess: true,
  },
  apiBaseUrl: '',
  apiAuthType: 'api_key',
  apiAuthConfig: {
    headerName: 'Authorization',
    headerValue: 'Bearer {api_key}',
  },
  uiType: 'react_component',
  uiConfig: {
    componentPath: '@/features/marketplace/plugins/grafana/components/GrafanaIntegrationUI',
    configFields: {
      baseUrl: {
        label: 'Grafana Base URL',
        type: 'text',
        placeholder: 'https://your-grafana-instance.com',
        required: true,
      },
      apiKey: {
        label: 'API Key',
        type: 'password',
        placeholder: 'Enter your Grafana API key',
        required: true,
      },
      folder: {
        label: 'Folder (Optional)',
        type: 'text',
        placeholder: 'Enter folder name to filter dashboards',
        required: false,
      },
    },
  },
  webhookSupported: false,
  webhookEvents: [],
  iconUrl: '/icons/grafana.svg',
  screenshots: [],
  documentationUrl: 'https://grafana.com/docs/grafana/latest/developers/http_api/',
  supportUrl: 'https://grafana.com/support',
  pricingInfo: {
    type: 'open-source',
    note: 'Grafana is open-source and free to use',
  },
  installationCount: 0,
  rating: undefined,
  reviewCount: 0,
  securityAudit: {
    lastAudited: new Date().toISOString(),
    vulnerabilities: [],
    compliance: ['Open Source'],
  },
}

