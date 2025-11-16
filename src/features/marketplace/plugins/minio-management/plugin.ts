import { PluginDefinition } from '@/features/marketplace/types'

export const minioManagementPlugin: PluginDefinition = {
  id: 'minio-management',
  name: 'MinIO Management',
  slug: 'minio-management',
  description: 'Manage MinIO object storage instances',
  version: '1.0.0',
  provider: 'MDM Platform',
  category: 'service-management',
  status: 'approved',
  verified: true,
  capabilities: {
    serviceType: 'docker_container',
    supportedServices: ['minio'],
  },
  uiType: 'react_component',
  uiConfig: {
    componentPath: '@/features/marketplace/plugins/minio-management/components/MinIOManagementUI',
  },
  iconUrl: '/icons/minio.svg',
  installationCount: 0,
  reviewCount: 0,
}

