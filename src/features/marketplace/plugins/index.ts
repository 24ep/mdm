/**
 * Marketplace Plugin Registry
 * 
 * This file exports all available marketplace plugins.
 * Plugins are registered here and can be loaded dynamically.
 */

import { powerBIPlugin } from './power-bi/plugin'
import { grafanaPlugin } from './grafana/plugin'
import { lookerStudioPlugin } from './looker-studio/plugin'
import { minioManagementPlugin } from './minio-management/plugin'
import { kongManagementPlugin } from './kong-management/plugin'
import { grafanaManagementPlugin } from './grafana-management/plugin'
import { prometheusManagementPlugin } from './prometheus-management/plugin'
import { redisManagementPlugin } from './redis-management/plugin'
import { postgresqlManagementPlugin } from './postgresql-management/plugin'
import { PluginDefinition } from '../types'

/**
 * All available marketplace plugins
 */
export const marketplacePlugins: PluginDefinition[] = [
  powerBIPlugin,
  grafanaPlugin,
  lookerStudioPlugin,
  minioManagementPlugin,
  kongManagementPlugin,
  grafanaManagementPlugin,
  prometheusManagementPlugin,
  redisManagementPlugin,
  postgresqlManagementPlugin,
]

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

