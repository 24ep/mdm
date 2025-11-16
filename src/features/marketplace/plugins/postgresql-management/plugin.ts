import { PluginDefinition } from '../../types'

export const postgresqlManagementPlugin: PluginDefinition = {
  id: 'postgresql-management',
  name: 'PostgreSQL Management',
  slug: 'postgresql-management',
  version: '1.0.0',
  provider: 'PostgreSQL Global Development Group',
  providerUrl: 'https://www.postgresql.org',
  category: 'service-management',
  status: 'approved',
  verified: true,
  description: 'Manage PostgreSQL databases, view tables, run queries, and monitor database performance.',
  capabilities: {
    databaseManagement: true,
    queryExecution: true,
    tableManagement: true,
    monitoring: true,
  },
  apiBaseUrl: '',
  apiAuthType: 'none',
  apiAuthConfig: {},
  uiType: 'react_component',
  uiConfig: {
    componentPath: '@/features/marketplace/plugins/postgresql-management/components/PostgreSQLManagementUI',
    configFields: {
      host: {
        label: 'PostgreSQL Host',
        type: 'text',
        placeholder: 'localhost',
        required: true,
      },
      port: {
        label: 'PostgreSQL Port',
        type: 'number',
        placeholder: '5432',
        required: true,
      },
      database: {
        label: 'Database Name',
        type: 'text',
        placeholder: 'postgres',
        required: true,
      },
      username: {
        label: 'Username',
        type: 'text',
        placeholder: 'postgres',
        required: true,
      },
      password: {
        label: 'Password',
        type: 'password',
        placeholder: 'Enter database password',
        required: true,
      },
    },
  },
  webhookSupported: false,
  webhookEvents: [],
  iconUrl: '/icons/postgresql.svg',
  screenshots: [],
  documentationUrl: 'https://www.postgresql.org/docs/',
  supportUrl: 'https://www.postgresql.org/support',
  pricingInfo: {
    type: 'open-source',
    note: 'PostgreSQL is open-source and free to use',
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

