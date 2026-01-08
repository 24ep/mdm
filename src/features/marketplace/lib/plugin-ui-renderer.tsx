'use client'

import { useState, useEffect } from 'react'
import { PluginDefinition } from '../types'
import { pluginLoader } from './plugin-loader'
import { Loader } from 'lucide-react'
import DOMPurify from 'dompurify'

export interface PluginUIRendererProps {
  plugin: PluginDefinition
  installationId?: string
  config?: Record<string, any>
  props?: Record<string, any>
}

/**
 * Plugin UI Renderer - Dynamically renders plugin UI components
 */
export function PluginUIRenderer({
  plugin,
  installationId,
  config = {},
  props = {},
}: PluginUIRendererProps) {
  const [component, setComponent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadComponent()
  }, [plugin.id, plugin.uiConfig?.componentPath])

  const loadComponent = async () => {
    try {
      setLoading(true)
      setError(null)

      if (plugin.uiType === 'iframe' && plugin.uiConfig?.iframeUrl) {
        // Render iframe
        setComponent(
          <iframe
            src={plugin.uiConfig.iframeUrl}
            className="w-full h-full border-0"
            title={plugin.name}
          />
        )
      } else if (plugin.uiType === 'react_component' && plugin.uiConfig?.componentPath) {
        // Load React component
        const Component = await pluginLoader.loadComponent(
          plugin,
          plugin.uiConfig.componentPath
        )
        const ComponentToRender = Component.default || Component
        setComponent(
          <ComponentToRender
            installationId={installationId}
            config={config}
            {...props}
          />
        )
      } else if (plugin.uiType === 'web_component' && plugin.uiConfig?.webComponentTag) {
        // Render web component
        const rawHtml = `<${plugin.uiConfig.webComponentTag} 
          installation-id="${installationId || ''}"
          config='${JSON.stringify(config)}'
        ></${plugin.uiConfig.webComponentTag}>`

        const sanitizedHtml = typeof window !== 'undefined'
          ? DOMPurify.sanitize(rawHtml, { CUSTOM_ELEMENT_HANDLING: { tagNameCheck: () => true, attributeNameCheck: () => true } as any })
          : rawHtml

        setComponent(
          <div
            dangerouslySetInnerHTML={{
              __html: sanitizedHtml,
            }}
          />
        )
      } else {
        setError('No UI configuration found for plugin')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load plugin UI'
      setError(errorMessage)
      console.error('Error loading plugin UI:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-destructive rounded-lg">
        <p className="text-destructive">Error loading plugin UI: {error}</p>
      </div>
    )
  }

  return <div className="plugin-ui">{component}</div>
}

