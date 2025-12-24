
import { PluginDefinition } from '@/features/marketplace/types'

export const dataSciencePlugin: PluginDefinition = {
  id: 'data-science',
  name: 'Data Science & Notebooks',
  slug: 'data-science',
  description: 'Interactive Jupyter-style notebooks and kernel management for data science.',
  version: '1.0.0',
  provider: 'Platform',
  category: 'analytics',
  status: 'approved',
  verified: true,
  iconUrl: '/icons/data-science.svg',
  capabilities: {
    notebooks: true,
    kernels: true,
    python: true,
  },
  uiType: 'react_component',
  uiConfig: {
    componentPath: '@plugins/data-science/src/components/DataScienceNotebook',
  },
  navigation: {
    group: 'tools',
    label: 'Data Science',
    icon: 'FileText', // Or Notebook/Flask if available
    href: '/tools/notebook',
    priority: 20,
  },
  installationCount: 0,
  reviewCount: 0,
}
