
import { PluginDefinition } from '@/features/marketplace/types'

export const projectManagementPlugin: PluginDefinition = {
  id: 'project-management',
  name: 'Project Management',
  slug: 'project-management',
  description: 'Manage projects, tickets, and workflows with Kanban boards and lists.',
  version: '1.0.0',
  provider: 'Platform',
  category: 'service-management',
  status: 'approved',
  verified: true,
  iconUrl: '/icons/project-management.svg',
  capabilities: {
    kanban: true,
    tickets: true,
    workflows: true,
  },
  uiType: 'react_component',
  uiConfig: {
    componentPath: '@plugins/project-management/src/tickets/components/TicketsList',
  },
  navigation: {
    group: 'overview',
    label: 'Project Management',
    icon: 'Kanban',
    href: '/tools/projects',
    priority: 20,
  },
  installationCount: 0,
  reviewCount: 0,
}
