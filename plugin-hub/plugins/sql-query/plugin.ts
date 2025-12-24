
import { PluginDefinition } from '@/features/marketplace/types'

export const sqlQueryPlugin: PluginDefinition = {
  id: 'sql-query',
  name: 'SQL Query Studio',
  slug: 'sql-query',
  description: 'Execute SQL queries, analyze results, and visualize data.',
  version: '1.0.0',
  provider: 'Platform',
  category: 'analytics',
  status: 'approved',
  verified: true,
  iconUrl: '/icons/sql-query.svg',
  capabilities: {
    sql: true,
    visualization: true,
  },
  uiType: 'react_component',
  uiConfig: {
    componentPath: '@plugins/sql-query/src/components/BigQueryInterface',
  },
  navigation: {
    group: 'tools',
    label: 'SQL Query',
    icon: 'Code',
    href: '/tools/bigquery',
    priority: 10,
  },
  installationCount: 0,
  reviewCount: 0,
}
