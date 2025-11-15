import { PluginDefinition } from '@/features/marketplace/types'

export const kongManagementPlugin: PluginDefinition = {
  id: 'kong-management',
  name: 'Kong Management',
  slug: 'kong-management',
  description: 'Manage Kong API Gateway instances',
  version: '1.0.0',
  provider: 'MDM Platform',
  category: 'service-management',
  status: 'approved',
  verified: true,
  capabilities: {
    serviceType: 'docker_container',
    supportedServices: ['kong'],
  },
  uiType: 'react_component',
  uiConfig: {
    componentPath: '@/features/marketplace/plugins/kong-management/components/KongManagementUI',
  },
  iconUrl: '/icons/kong.svg',
  installationCount: 0,
  reviewCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}

