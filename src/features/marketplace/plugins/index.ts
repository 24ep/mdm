/**
 * Marketplace Plugin Registry
 * 
 * All plugins are now loaded from the plugin hub.
 * See plugin-hub/plugins/ for available plugins.
 * 
 * To use hub plugins, set USE_PLUGIN_HUB=true in .env
 */

import { PluginDefinition } from '../types'

/**
 * All available marketplace plugins
 * 
 * NOTE: Plugins are loaded from the hub, not built-in.
 * This array is kept for backward compatibility but will be empty.
 * Use the hub API to fetch plugins: /api/plugin-hub/plugins
 */
export const marketplacePlugins: PluginDefinition[] = []

/**
 * Get plugin by slug
 */
export function getPluginBySlug(slug: string): PluginDefinition | undefined {
  return marketplacePlugins.find((plugin) => plugin.slug === slug)
}

/**
 * Get plugins by category
 */
export function getPluginsByCategory(category: string): PluginDefinition[] {
  return marketplacePlugins.filter((plugin) => plugin.category === category)
}

/**
 * Get all plugin categories
 */
export function getPluginCategories(): string[] {
  return Array.from(new Set(marketplacePlugins.map((plugin) => plugin.category)))
}

