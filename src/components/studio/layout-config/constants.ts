import React from 'react'
import { LayoutDashboard, ClipboardList, Settings, Workflow, Layers } from 'lucide-react'
import { ComponentConfig } from './types'

// Built-in pages configuration
export const builtInPagesMap: Record<string, { name: string; icon: React.ComponentType<{ className?: string }> }> = {
  'dashboard': { name: 'Dashboard', icon: LayoutDashboard },
  'assignment': { name: 'Assignment', icon: ClipboardList },
  'space-settings': { name: 'Space Settings', icon: Settings },
  'workflows': { name: 'Workflows', icon: Workflow },
  'bulk-action': { name: 'Bulk Action', icon: Layers },
}

export const layoutPresets: Record<string, Partial<Record<string, Partial<ComponentConfig>>>> = {
  'blank': {
    sidebar: { visible: false, position: 'left', width: 250 },
    top: { visible: false, position: 'top', height: 64 },
    footer: { visible: false, height: 60 }
  },
  'sidebar-left-header-top': {
    sidebar: { visible: true, position: 'left', width: 250 },
    top: { visible: true, position: 'top', height: 64 },
    footer: { visible: false, height: 60 }
  },
  'header-top-of-sidebar': {
    sidebar: { visible: true, position: 'left', width: 260 },
    top: { visible: true, position: 'topOfSidebar', height: 56 },
    footer: { visible: false, height: 60 }
  },
  'sidebar-right-footer': {
    sidebar: { visible: true, position: 'right', width: 260 },
    top: { visible: false, height: 64 },
    footer: { visible: true, height: 56 }
  }
}

