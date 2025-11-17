import { PluginDefinition } from '../types'

// Static import map for plugin components (required by Next.js)
// Next.js requires static paths for dynamic imports
const PLUGIN_COMPONENT_MAP: Record<string, () => Promise<any>> = {
  // Power BI
  '@/features/marketplace/plugins/power-bi/components/PowerBIIntegrationUI': () =>
    import('@/features/marketplace/plugins/power-bi/components/PowerBIIntegrationUI'),
  
  // Grafana
  '@/features/marketplace/plugins/grafana/components/GrafanaIntegrationUI': () =>
    import('@/features/marketplace/plugins/grafana/components/GrafanaIntegrationUI'),
  
  // Looker Studio
  '@/features/marketplace/plugins/looker-studio/components/LookerStudioIntegrationUI': () =>
    import('@/features/marketplace/plugins/looker-studio/components/LookerStudioIntegrationUI'),
  
  // MinIO Management
  '@/features/marketplace/plugins/minio-management/components/MinIOManagementUI': () =>
    import('@/features/marketplace/plugins/minio-management/components/MinIOManagementUI'),
  
  // Kong Management
  '@/features/marketplace/plugins/kong-management/components/KongManagementUI': () =>
    import('@/features/marketplace/plugins/kong-management/components/KongManagementUI'),
  
  // Grafana Management
  '@/features/marketplace/plugins/grafana-management/components/GrafanaManagementUI': () =>
    import('@/features/marketplace/plugins/grafana-management/components/GrafanaManagementUI'),
  
  // Prometheus Management
  '@/features/marketplace/plugins/prometheus-management/components/PrometheusManagementUI': () =>
    import('@/features/marketplace/plugins/prometheus-management/components/PrometheusManagementUI'),
  
  // Redis Management
  '@/features/marketplace/plugins/redis-management/components/RedisManagementUI': () =>
    import('@/features/marketplace/plugins/redis-management/components/RedisManagementUI'),
  
  // PostgreSQL Management
  '@/features/marketplace/plugins/postgresql-management/components/PostgreSQLManagementUI': () =>
    import('@/features/marketplace/plugins/postgresql-management/components/PostgreSQLManagementUI'),
}

/**
 * Plugin Loader - Handles dynamic loading of plugin SDKs and components
 */
export class PluginLoader {
  private loadedSDKs: Map<string, any> = new Map()
  private loadedComponents: Map<string, any> = new Map()

  /**
   * Load plugin SDK dynamically
   */
  async loadSDK(plugin: PluginDefinition): Promise<any> {
    if (this.loadedSDKs.has(plugin.id)) {
      return this.loadedSDKs.get(plugin.id)
    }

    try {
      // If plugin has SDK path, load it
      if (plugin.uiConfig?.sdkPath) {
        // For SDK paths, we can use dynamic imports if they're external URLs
        // For local paths, we'd need a similar static map
        if (plugin.uiConfig.sdkPath.startsWith('http://') || plugin.uiConfig.sdkPath.startsWith('https://')) {
          // External SDK - would need different loading mechanism
          console.warn('External SDK loading not yet implemented')
          return null
        } else {
          // Local SDK path - would need static map similar to components
          console.warn(`SDK path ${plugin.uiConfig.sdkPath} requires static import map`)
          return null
        }
      }

      // Otherwise, return null (no SDK needed)
      return null
    } catch (error) {
      console.error(`Failed to load SDK for plugin ${plugin.id}:`, error)
      throw new Error(`Failed to load plugin SDK: ${error}`)
    }
  }

  /**
   * Load plugin UI component dynamically
   * Uses static import map to satisfy Next.js build requirements
   */
  async loadComponent(plugin: PluginDefinition, componentPath?: string): Promise<any> {
    const cacheKey = `${plugin.id}:${componentPath || 'default'}`
    
    if (this.loadedComponents.has(cacheKey)) {
      return this.loadedComponents.get(cacheKey)
    }

    try {
      const path = componentPath || plugin.uiConfig?.componentPath
      
      if (!path) {
        throw new Error(`No component path specified for plugin ${plugin.id}`)
      }

      // Check if path exists in static import map
      const importFn = PLUGIN_COMPONENT_MAP[path]
      
      if (!importFn) {
        throw new Error(
          `Component path "${path}" not found in static import map. ` +
          `Please add it to PLUGIN_COMPONENT_MAP in plugin-loader.ts`
        )
      }

      // Use static import function
      const component = await importFn()
      this.loadedComponents.set(cacheKey, component)
      return component
    } catch (error) {
      console.error(`Failed to load component for plugin ${plugin.id}:`, error)
      throw new Error(`Failed to load plugin component: ${error}`)
    }
  }

  /**
   * Clear loaded SDKs and components
   */
  clear(): void {
    this.loadedSDKs.clear()
    this.loadedComponents.clear()
  }

  /**
   * Clear specific plugin cache
   */
  clearPlugin(pluginId: string): void {
    this.loadedSDKs.delete(pluginId)
    // Clear all components for this plugin
    for (const key of this.loadedComponents.keys()) {
      if (key.startsWith(`${pluginId}:`)) {
        this.loadedComponents.delete(key)
      }
    }
  }
}

// Singleton instance
export const pluginLoader = new PluginLoader()

