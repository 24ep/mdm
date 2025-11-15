'use client'

import { PluginDefinition } from '../types'
import { PluginUIRenderer } from '../lib/plugin-ui-renderer'

export interface PluginRendererProps {
  plugin: PluginDefinition
  installationId?: string
  config?: Record<string, any>
  [key: string]: any
}

/**
 * Plugin Renderer Component - Wrapper for PluginUIRenderer
 */
export function PluginRenderer({
  plugin,
  installationId,
  config = {},
  ...props
}: PluginRendererProps) {
  return (
    <PluginUIRenderer
      plugin={plugin}
      installationId={installationId}
      config={config}
      props={props}
    />
  )
}

