import { PluginDefinition } from '../../types'

export const redisManagementPlugin: PluginDefinition = {
  id: 'redis-management',
  name: 'Redis Management',
  slug: 'redis-management',
  version: '1.0.0',
  provider: 'Redis Labs',
  providerUrl: 'https://redis.io',
  category: 'service-management',
  status: 'approved',
  verified: true,
  description: 'Manage Redis instances, monitor keys, view statistics, and perform operations on your Redis cache.',
  capabilities: {
    keyManagement: true,
    statistics: true,
    monitoring: true,
    operations: true,
  },
  apiBaseUrl: '',
  apiAuthType: 'none',
  apiAuthConfig: {},
  uiType: 'react_component',
  uiConfig: {
    componentPath: '@/features/marketplace/plugins/redis-management/components/RedisManagementUI',
    configFields: {
      host: {
        label: 'Redis Host',
        type: 'text',
        placeholder: 'localhost',
        required: true,
      },
      port: {
        label: 'Redis Port',
        type: 'number',
        placeholder: '6379',
        required: true,
      },
      password: {
        label: 'Password (Optional)',
        type: 'password',
        placeholder: 'Enter Redis password if required',
        required: false,
      },
    },
  },
  webhookSupported: false,
  webhookEvents: [],
  iconUrl: '/icons/redis.svg',
  screenshots: [],
  documentationUrl: 'https://redis.io/docs/',
  supportUrl: 'https://redis.io/support',
  pricingInfo: {
    type: 'open-source',
    note: 'Redis is open-source and free to use',
  },
  installationCount: 0,
  rating: null,
  reviewCount: 0,
  securityAudit: {
    lastAudited: new Date().toISOString(),
    vulnerabilities: [],
    compliance: ['Open Source'],
  },
  createdAt: new Date(),
  updatedAt: new Date(),
}

