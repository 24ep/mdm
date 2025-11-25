import { PluginDefinition } from '@/features/marketplace/types'

export const prometheusManagementPlugin: PluginDefinition = {
  source: 'hub',
  id: 'prometheus-management',
  name: 'Prometheus Management',
  slug: 'prometheus-management',
  description: 'Manage Prometheus metrics and monitoring instances',
  version: '1.0.0',
  provider: 'MDM Platform',
  category: 'monitoring-observability',
  status: 'approved',
  verified: true,
  capabilities: {
    serviceType: 'docker_container',
    supportedServices: ['prometheus'],
  },
  uiType: 'react_component',
  uiConfig: {
    componentPath: '@/features/marketplace/plugins/prometheus-management/components/PrometheusManagementUI',
  },
  iconUrl: '/icons/prometheus.svg',
  installationCount: 0,
  reviewCount: 0,
}

