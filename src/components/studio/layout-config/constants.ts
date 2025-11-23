import React from 'react'
import { ComponentConfig } from './types'

// Built-in pages configuration
export const builtInPagesMap: Record<string, { name: string; icon: React.ComponentType<{ className?: string }> }> = {
  // All built-in pages removed: dashboard, assignment, space-settings, workflows, bulk-action
}

export const layoutPresets: Record<string, Partial<Record<string, Partial<ComponentConfig>>>> = {
  // Layout presets removed - sidebar, top, and footer no longer configurable
  // Pages now use secondary platform sidebar instead
  'blank': {},
}

