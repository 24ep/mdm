/**
 * External Plugin Loader
 * Handles loading plugins from different project folders and external sources
 * 
 * NOTE: This module uses Node.js APIs and should only be used on the server side
 */

import { PluginDefinition, PluginSource } from '../types'

// Only import Node.js modules on server side
const isServer = typeof window === 'undefined'
let fs: any, path: any, crypto: any

if (isServer) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  fs = require('fs').promises
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  path = require('path')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  crypto = require('crypto')
}

export interface ExternalPluginConfig {
  projectRoot?: string  // Root of main project
  externalPluginDirs?: string[]  // Paths to external plugin directories
  pluginCacheDir?: string  // Where to cache downloaded plugins
}

export class ExternalPluginLoader {
  private config: ExternalPluginConfig
  private loadedPlugins: Map<string, any> = new Map()

  constructor(config: ExternalPluginConfig = {}) {
    if (!isServer) {
      throw new Error('ExternalPluginLoader can only be used on the server side')
    }
    
    this.config = {
      projectRoot: config.projectRoot || (typeof process !== 'undefined' ? process.cwd() : ''),
      externalPluginDirs: config.externalPluginDirs || [],
      pluginCacheDir: config.pluginCacheDir || path.join(typeof process !== 'undefined' ? process.cwd() : '', '.plugins'),
    }
  }

  /**
   * Load plugin from external source
   */
  async loadExternalPlugin(plugin: PluginDefinition): Promise<any> {
    if (!isServer) {
      throw new Error('ExternalPluginLoader can only be used on the server side')
    }
    
    if (!plugin.source || plugin.source === 'built-in') {
      throw new Error('Plugin is not an external plugin')
    }

    const cacheKey = `${plugin.id}:${plugin.version}`
    if (this.loadedPlugins.has(cacheKey)) {
      return this.loadedPlugins.get(cacheKey)
    }

    try {
      let pluginModule: any

      switch (plugin.source) {
        case 'local-folder':
          pluginModule = await this.loadFromLocalFolder(plugin)
          break
        case 'npm':
          pluginModule = await this.loadFromNpm(plugin)
          break
        case 'cdn':
          pluginModule = await this.loadFromCDN(plugin)
          break
        case 'git':
          pluginModule = await this.loadFromGit(plugin)
          break
        case 'external':
          pluginModule = await this.loadFromExternal(plugin)
          break
        default:
          throw new Error(`Unsupported plugin source: ${plugin.source}`)
      }

      this.loadedPlugins.set(cacheKey, pluginModule)
      return pluginModule
    } catch (error) {
      console.error(`Failed to load external plugin ${plugin.id}:`, error)
      throw error
    }
  }

  /**
   * Load plugin from different project folder
   */
  private async loadFromLocalFolder(plugin: PluginDefinition): Promise<any> {
    if (!plugin.sourcePath && !plugin.projectFolder) {
      throw new Error('sourcePath or projectFolder required for local-folder plugins')
    }

    let pluginPath: string

    if (plugin.installedPath) {
      // Use installed path if available
      pluginPath = path.resolve(plugin.installedPath)
    } else if (plugin.sourcePath) {
    // Resolve from sourcePath (can be relative or absolute)
    if (plugin.sourcePath.startsWith('/') || plugin.sourcePath.match(/^[A-Z]:/)) {
      // Absolute path
      pluginPath = path.resolve(plugin.sourcePath)
    } else {
      // Relative path - resolve from project root or external plugin dirs
      pluginPath = this.resolvePluginPath(plugin.sourcePath)
    }
    } else if (plugin.projectFolder) {
      // Resolve from project folder name
      pluginPath = this.resolveProjectFolder(plugin.projectFolder, plugin.slug)
    } else {
      throw new Error('No valid path found for plugin')
    }

    // Check if plugin file exists
    const pluginFile = path.join(pluginPath, 'plugin.ts')
    try {
      await fs.access(pluginFile)
    } catch {
      throw new Error(`Plugin file not found: ${pluginFile}`)
    }

    // Dynamically import from external path
    // Note: This requires the path to be accessible at runtime
    const pluginModule = await this.importFromPath(pluginFile)
    return pluginModule
  }

  /**
   * Load plugin from npm package
   */
  private async loadFromNpm(plugin: PluginDefinition): Promise<any> {
    if (!plugin.sourceUrl) {
      throw new Error('sourceUrl required for npm plugins')
    }

    // Parse npm package name and version
    const packageName = plugin.sourceUrl
    const version = plugin.version || 'latest'

    // Check cache first
    const cachePath = path.join(this.config.pluginCacheDir!, 'npm', packageName.replace('@', '').replace('/', '-'), version)
    
    try {
      await fs.access(cachePath)
      // Plugin already cached, load from cache
      const pluginFile = path.join(cachePath, 'plugin.ts')
      return await this.importFromPath(pluginFile)
    } catch {
      // Not cached, need to install
      console.log(`Installing npm package: ${packageName}@${version}`)
      // In production, you'd use npm install here
      // For now, we'll assume it's already installed or use a different mechanism
      throw new Error('NPM plugin installation not yet implemented. Please install the package manually.')
    }
  }

  /**
   * Load plugin from CDN
   */
  private async loadFromCDN(plugin: PluginDefinition): Promise<any> {
    if (!plugin.sourceUrl && !plugin.downloadUrl) {
      throw new Error('sourceUrl or downloadUrl required for CDN plugins')
    }

    const url = plugin.downloadUrl || plugin.sourceUrl!
    
    // Check cache
    const cacheKey = crypto.createHash('sha256').update(url).digest('hex')
    const cachePath = path.join(this.config.pluginCacheDir!, 'cdn', cacheKey)

    try {
      await fs.access(cachePath)
      // Load from cache
      const pluginFile = path.join(cachePath, 'plugin.ts')
      return await this.importFromPath(pluginFile)
    } catch {
      // Download and cache
      console.log(`Downloading plugin from CDN: ${url}`)
      await this.downloadAndCache(url, cachePath, plugin.checksum)
      const pluginFile = path.join(cachePath, 'plugin.ts')
      return await this.importFromPath(pluginFile)
    }
  }

  /**
   * Load plugin from Git repository
   */
  private async loadFromGit(plugin: PluginDefinition): Promise<any> {
    if (!plugin.sourceUrl) {
      throw new Error('sourceUrl required for git plugins')
    }

    // Parse git URL and version/tag
    const gitUrl = plugin.sourceUrl
    const version = plugin.version || 'main'

    const cacheKey = crypto.createHash('sha256').update(`${gitUrl}:${version}`).digest('hex')
    const cachePath = path.join(this.config.pluginCacheDir!, 'git', cacheKey)

    try {
      await fs.access(cachePath)
      // Load from cache
      const pluginFile = path.join(cachePath, plugin.sourcePath || 'plugin.ts')
      return await this.importFromPath(pluginFile)
    } catch {
      // Clone and cache
      console.log(`Cloning plugin from Git: ${gitUrl}@${version}`)
      await this.cloneAndCache(gitUrl, version, cachePath)
      const pluginFile = path.join(cachePath, plugin.sourcePath || 'plugin.ts')
      return await this.importFromPath(pluginFile)
    }
  }

  /**
   * Load plugin from external API/server
   */
  private async loadFromExternal(plugin: PluginDefinition): Promise<any> {
    if (!plugin.sourceUrl) {
      throw new Error('sourceUrl required for external plugins')
    }

    // Fetch plugin from external server
    const response = await fetch(`${plugin.sourceUrl}/api/plugin/${plugin.slug}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch plugin from ${plugin.sourceUrl}`)
    }

    const pluginData = await response.json()
    // Plugin data should include the plugin definition
    return pluginData
  }

  /**
   * Resolve plugin path from various sources
   */
  private resolvePluginPath(sourcePath: string): string {
    // Try external plugin directories first
    for (const dir of this.config.externalPluginDirs || []) {
      const fullPath = path.join(dir, sourcePath)
      try {
        const fsSync = require('fs')
        if (fsSync.existsSync(fullPath)) {
          return path.resolve(fullPath)
        }
      } catch {
        // Continue to next
      }
    }

    // Try relative to project root
    const rootPath = path.join(this.config.projectRoot!, sourcePath)
    const fsSync = require('fs')
    if (fsSync.existsSync(rootPath)) {
      return path.resolve(rootPath)
    }

    throw new Error(`Plugin path not found: ${sourcePath}`)
  }

  /**
   * Resolve plugin from project folder name
   */
  private resolveProjectFolder(projectFolder: string, pluginSlug: string): string {
    // Look for project folder in common locations
    const possiblePaths = [
      path.join(this.config.projectRoot!, '..', projectFolder, 'src', 'plugins', pluginSlug),
      path.join(this.config.projectRoot!, '..', projectFolder, 'plugins', pluginSlug),
      path.join(this.config.projectRoot!, '..', projectFolder, pluginSlug),
      path.join(typeof process !== 'undefined' && process.env.PLUGINS_DIR ? process.env.PLUGINS_DIR : '', projectFolder, pluginSlug),
    ]

    const fsSync = require('fs')
    for (const p of possiblePaths) {
      try {
        if (fsSync.existsSync(p)) {
          return path.resolve(p)
        }
      } catch {
        // Continue
      }
    }

    throw new Error(`Project folder not found: ${projectFolder}/${pluginSlug}`)
  }

  /**
   * Import plugin from file path
   */
  async importFromPath(filePath: string): Promise<any> {
    // Convert file path to module path
    // For Next.js, we need to use require or dynamic import
    // Since we're in server context, we can use require
    try {
      // Clear require cache to allow hot reloading
      // Webpack warning suppression: dynamic require is intentional for plugin loading
      // @ts-ignore - dynamic require for plugin loading
      const resolvedPath = require.resolve(filePath)
      delete require.cache[resolvedPath]
      // @ts-ignore - dynamic require for plugin loading
      const pluginModule = require(filePath)
      return pluginModule
    } catch (error) {
      console.error(`Failed to import plugin from ${filePath}:`, error)
      throw error
    }
  }

  /**
   * Download and cache plugin from URL
   */
  private async downloadAndCache(url: string, cachePath: string, checksum?: string): Promise<void> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download plugin: ${response.statusText}`)
    }

    const data = await response.arrayBuffer()
    const buffer = Buffer.from(data)

    // Verify checksum if provided
    if (checksum) {
      const hash = crypto.createHash('sha256').update(buffer).digest('hex')
      if (hash !== checksum) {
        throw new Error('Plugin checksum verification failed')
      }
    }

    // Extract if it's a zip/tar file
    // For now, assume it's a directory structure
    await fs.mkdir(cachePath, { recursive: true })
    
    // Save plugin files
    // This is simplified - in production you'd extract archives
    const pluginFile = path.join(cachePath, 'plugin.ts')
    await fs.writeFile(pluginFile, buffer.toString('utf-8'))
  }

  /**
   * Clone Git repository and cache
   */
  private async cloneAndCache(gitUrl: string, version: string, cachePath: string): Promise<void> {
    // This would use git clone in production
    // For now, we'll use a simplified approach
    // Only use child_process on server side
    if (!isServer) {
      throw new Error('Git clone can only be performed on the server side')
    }
    
    // Use dynamic require with string concatenation to prevent webpack from analyzing
    // Webpack can't statically analyze requires with dynamic strings
    const moduleNames = {
      child: 'child_' + 'process',
      util: 'util',
    }
    
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const childProcess = require(moduleNames.child)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const util = require(moduleNames.util)
    
    const { exec } = childProcess
    const { promisify } = util
    const execAsync = promisify(exec)

    await fs.mkdir(cachePath, { recursive: true })

    try {
      // Clone repository
      const cwd = typeof process !== 'undefined' ? process.cwd() : ''
      await execAsync(`git clone ${gitUrl} ${cachePath}`, { cwd })
      
      // Checkout specific version if not main
      if (version !== 'main') {
        await execAsync(`git checkout ${version}`, { cwd: cachePath })
      }
    } catch (error) {
      console.error('Git clone failed:', error)
      throw new Error(`Failed to clone plugin repository: ${error}`)
    }
  }

  /**
   * Clear plugin cache
   */
  async clearCache(pluginId?: string): Promise<void> {
    if (pluginId) {
      // Clear specific plugin
      for (const key of this.loadedPlugins.keys()) {
        if (key.startsWith(`${pluginId}:`)) {
          this.loadedPlugins.delete(key)
        }
      }
    } else {
      // Clear all
      this.loadedPlugins.clear()
    }
  }
}

// Singleton instance
export const externalPluginLoader = new ExternalPluginLoader({
  externalPluginDirs: process.env.EXTERNAL_PLUGIN_DIRS?.split(',') || [],
  pluginCacheDir: process.env.PLUGIN_CACHE_DIR,
})

