import { PluginDefinition } from '@/features/marketplace/types'

export const grafanaManagementPlugin: PluginDefinition = {
  id: 'grafana-management',
  name: 'Grafana Management',
  slug: 'grafana-management',
  description: 'Manage Grafana monitoring and visualization instances',
  version: '1.0.0',
  provider: 'MDM Platform',
  category: 'service-management',
  status: 'approved',
  verified: true,
  capabilities: {
    serviceType: 'docker_container',
    supportedServices: ['grafana'],
  },
  uiType: 'react_component',
  uiConfig: {
    componentPath: '@/features/marketplace/plugins/grafana-management/components/GrafanaManagementUI',
  },
  iconUrl: '/icons/grafana.svg',
  installationCount: 0,
  reviewCount: 0,
}

