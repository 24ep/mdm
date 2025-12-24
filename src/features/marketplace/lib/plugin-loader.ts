import { PluginDefinition, PluginSource } from '../types'

// Only import external plugin loader on server side
const isServer = typeof window === 'undefined'
let externalPluginLoader: any = null

if (isServer) {
  try {
    externalPluginLoader = require('./external-plugin-loader').externalPluginLoader
  } catch (error) {
    console.warn('External plugin loader not available:', error)
  }
}

// Static import map for plugin components (required by Next.js)
// NOTE: All plugins are now in the hub, so this map is empty.
// Components are loaded dynamically from installed plugins in .plugins/installed/
const PLUGIN_COMPONENT_MAP: Record<string, () => Promise<any>> = {
  // All plugins are now loaded from the hub
  // Components are loaded from installed plugin paths
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
   * Supports both built-in and external plugins
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

      // All plugins are now from hub - check if it's installed
      if (plugin.source && plugin.source !== 'built-in') {
        return await this.loadExternalComponent(plugin, path)
      }

      // For installed plugins, try to load from installed path
      if (plugin.installedPath) {
        return await this.loadFromInstalledPath(plugin, path)
      }

      // Try static import map (for backward compatibility, though it should be empty)
      const importFn = PLUGIN_COMPONENT_MAP[path]
      
      if (importFn) {
        const component = await importFn()
        this.loadedComponents.set(cacheKey, component)
        return component
      }

      // If no path found, try to load from hub-installed location
      throw new Error(
        `Component path "${path}" not found. ` +
        `Plugin may need to be installed from hub first. ` +
        `Source: ${plugin.source || 'unknown'}`
      )
    } catch (error) {
      console.error(`Failed to load component for plugin ${plugin.id}:`, error)
      throw new Error(`Failed to load plugin component: ${error}`)
    }
  }

  /**
   * Load component from external plugin (hub)
   */
  private async loadExternalComponent(plugin: PluginDefinition, componentPath: string): Promise<any> {
    // Try to load from installed path first (plugins installed from hub)
    if (plugin.installedPath) {
      return await this.loadFromInstalledPath(plugin, componentPath)
    }

    // For server-side loading from hub source
    if (isServer && externalPluginLoader) {
      try {
        // Load the external plugin module
        const pluginModule = await externalPluginLoader.loadExternalPlugin(plugin)
        
        // Extract component from module
        const componentName = componentPath.split('/').pop()?.replace('.tsx', '').replace('.ts', '') || 'default'
        
        // Try to find component in module
        if (pluginModule[componentName]) {
          return pluginModule[componentName]
        }
        
        if (pluginModule.default) {
          return pluginModule.default
        }
        
        // If component path is a file path, try to load it
        if (plugin.source === 'local-folder' && plugin.sourcePath) {
          // Resolve component path relative to plugin
          let componentFile: string
          if (componentPath.startsWith('@/') || componentPath.startsWith('./')) {
            // Relative to plugin root
            const pluginRoot = plugin.installedPath || plugin.sourcePath
            const path = require('path')
            componentFile = path.join(pluginRoot, componentPath.replace('@/', '').replace('./', ''))
          } else {
            const path = require('path')
            componentFile = path.join(plugin.sourcePath, componentPath)
          }
          
          // Load component file
          const componentModule = await externalPluginLoader.importFromPath(componentFile)
          return componentModule.default || componentModule
        }
      } catch (error) {
        console.warn(`Failed to load from external source, trying installed path:`, error)
      }
    }
    
    throw new Error(`Component not found for plugin: ${plugin.slug} at path: ${componentPath}`)
  }

  /**
   * Load component from installed plugin path
   */
  private async loadFromInstalledPath(plugin: PluginDefinition, componentPath: string): Promise<any> {
    if (!isServer) {
      throw new Error('Installed plugin components can only be loaded on the server side')
    }

    if (!externalPluginLoader) {
      throw new Error('External plugin loader not available')
    }

    try {
      // Resolve component path relative to installed plugin
      let componentFile: string
      
      if (componentPath.startsWith('@plugins/')) {
        // Convert @plugins/ path to relative path from installed plugin
        // For local hub plugins, installedPath usually points to the plugin directory
        // e.g. .../plugin-hub/plugins/sql-query
        // componentPath is @plugins/sql-query/src/components/BigQueryInterface
        // We need to strip @plugins/ and the plugin id?
        // Actually, let's assume installedPath is correct and just use require/import if generic.
        // But here we are constructing a file path.
        
        // If we treat @plugins alias as absolute, we can try resolving it directly?
        // But this loader is for "installed path".
        
        // Let's assume installedPath is the plugin root. 
        // We need to strip '@plugins/<plugin-id>/' to get relative path within plugin.
        // Or better yet, just strip '@plugins/' and let navigation happen?
        // But installedPath is specific to ONE plugin.
        
        // Simple fix: if it starts with @plugins/, we don't know relative path easily without parsing ID.
        // But wait, if componentPath is passed, it is the Full Path.
        // If plugin definition has componentPath: '@plugins/sql-query/...',
        // And we are loading it.
        
        // If we just want to support the alias, maybe we don't need to join with installedPath?
        // NOTE: Dynamic import of aliased path might work in Next.js/Webpack if statically analyzable?
        // But this is dynamic string.
        
        // Let's just fix the logic to be safe:
        const relativePath = componentPath.replace('@plugins/', '')
         // This leaves 'sql-query/src/...'
         // If installedPath is '.../plugin-hub/plugins/sql-query'
         // Then joining them gives '.../plugin-hub/plugins/sql-query/sql-query/src/...' -> duplicate!
         
         // We should strip the plugin ID too?
         // relativePath = relativePath.split('/').slice(1).join('/')
         // This assumes ID is first segment.
         
         const parts = relativePath.split('/')
         const pathWithoutPluginId = parts.slice(1).join('/') 
         const path = require('path')
         componentFile = path.join(plugin.installedPath!, pathWithoutPluginId)
      } else if (componentPath.startsWith('@/')) {
        const path = require('path')
        componentFile = path.join(plugin.installedPath!, componentPath.replace('./', ''))
      } else {
        // Assume it's relative to plugin root
        const path = require('path')
        componentFile = path.join(plugin.installedPath!, componentPath)
      }

      // Load component file using external plugin loader
      const componentModule = await externalPluginLoader.importFromPath(componentFile)
      return componentModule.default || componentModule
    } catch (error) {
      console.error(`Failed to load component from installed path:`, error)
      throw error
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

