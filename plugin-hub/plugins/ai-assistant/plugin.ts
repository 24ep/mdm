
import { PluginDefinition } from '@/features/marketplace/types'

export const aiAssistantPlugin: PluginDefinition = {
  id: 'ai-assistant',
  name: 'AI Assistant & Chat',
  slug: 'ai-assistant',
  description: 'AI-powered data analyst and chat widget configuration.',
  version: '1.0.0',
  provider: 'Platform',
  category: 'automation',
  status: 'approved',
  verified: true,
  iconUrl: '/icons/ai-assistant.svg',
  capabilities: {
    chat: true,
    analysis: true,
    embed: true,
  },
  uiType: 'react_component',
  uiConfig: {
    componentPath: '@plugins/ai-assistant/src/components/AIAnalyst',
  },
  navigation: {
    group: 'tools',
    label: 'Chat with AI',
    icon: 'MessageCircle',
    href: '/tools/ai-analyst',
    priority: 30,
  },
  installationCount: 0,
  reviewCount: 0,
}
