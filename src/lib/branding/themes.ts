import { BrandingConfig } from '@/app/admin/features/system/types'

export interface ThemePreset {
  id: string
  name: string
  description: string
  config: Partial<BrandingConfig>
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'light-default',
    name: 'Light Default',
    description: 'Clean light theme with black accents',
    config: {
      primaryColor: '#000000',
      secondaryColor: '#f4f4f5',
      warningColor: '#f59e0b',
      dangerColor: '#ef4444',
      uiBackgroundColor: '#ffffff',
      uiBorderColor: 'rgba(0, 0, 0, 0.1)',
      bodyBackgroundColor: '#ffffff',
      bodyTextColor: '#111827',
      platformSidebarBackgroundColor: '#ffffff',
      platformSidebarTextColor: '#111827',
      secondarySidebarBackgroundColor: '#fafafa',
      secondarySidebarTextColor: '#111827',
      topMenuBackgroundColor: '#ffffff',
      topMenuTextColor: '#111827',
    }
  },
  {
    id: 'dark-default',
    name: 'Dark Default',
    description: 'Deep slate dark theme',
    config: {
      primaryColor: '#ffffff',
      secondaryColor: '#27272a',
      warningColor: '#f59e0b',
      dangerColor: '#ef4444',
      uiBackgroundColor: '#09090b',
      uiBorderColor: 'rgba(255, 255, 255, 0.1)',
      bodyBackgroundColor: '#09090b',
      bodyTextColor: '#f8fafc',
      platformSidebarBackgroundColor: '#09090b',
      platformSidebarTextColor: '#f8fafc',
      secondarySidebarBackgroundColor: '#121212',
      secondarySidebarTextColor: '#f8fafc',
      topMenuBackgroundColor: '#09090b',
      topMenuTextColor: '#f8fafc',
    }
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    description: 'Elegant deep blue theme',
    config: {
      primaryColor: '#3b82f6',
      secondaryColor: '#1e293b',
      warningColor: '#f59e0b',
      dangerColor: '#ef4444',
      uiBackgroundColor: '#0f172a',
      uiBorderColor: 'rgba(59, 130, 246, 0.2)',
      bodyBackgroundColor: '#0f172a',
      bodyTextColor: '#f1f5f9',
      platformSidebarBackgroundColor: '#0f172a',
      platformSidebarTextColor: '#f1f5f9',
      secondarySidebarBackgroundColor: '#1e293b',
      secondarySidebarTextColor: '#f1f5f9',
      topMenuBackgroundColor: '#0f172a',
      topMenuTextColor: '#f1f5f9',
    }
  },
  {
    id: 'black-accent',
    name: 'Black Accent',
    description: 'High contrast black and white theme',
    config: {
      primaryColor: '#000000',
      secondaryColor: '#e5e7eb',
      warningColor: '#000000',
      dangerColor: '#ff0000',
      uiBackgroundColor: '#ffffff',
      uiBorderColor: '#000000',
      bodyBackgroundColor: '#ffffff',
      bodyTextColor: '#000000',
      platformSidebarBackgroundColor: '#000000',
      platformSidebarTextColor: '#ffffff',
      secondarySidebarBackgroundColor: '#f3f4f6',
      secondarySidebarTextColor: '#000000',
      topMenuBackgroundColor: '#ffffff',
      topMenuTextColor: '#000000',
    }
  }
]
