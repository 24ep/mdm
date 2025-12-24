/**
 * Marketplace Plugin Registry
 * 
 * All plugins are now loaded from the plugin hub.
 * See plugin-hub/plugins/ for available plugins.
 * 
 * To use hub plugins, set USE_PLUGIN_HUB=true in .env
 */

import { PluginDefinition } from '@/features/marketplace/types'

/**
 * All available marketplace plugins
 * 
 * NOTE: Plugins are loaded from the hub, not built-in.
 * This array is kept for backward compatibility but will be empty.
 * Use the hub API to fetch plugins: /api/plugin-hub/plugins
 */
import { knowledgeBasePlugin } from './knowledge-base/plugin'
import { projectManagementPlugin } from './project-management/plugin'
import { dataSciencePlugin } from './data-science/plugin'
import { sqlQueryPlugin } from './sql-query/plugin'
import { aiAssistantPlugin } from './ai-assistant/plugin'
import { grafanaPlugin } from './grafana/plugin'
import { grafanaManagementPlugin } from './grafana-management/plugin'
import { kongManagementPlugin } from './kong-management/plugin'
import { lookerStudioPlugin } from './looker-studio/plugin'
import { minioManagementPlugin } from './minio-management/plugin'
import { postgresqlManagementPlugin } from './postgresql-management/plugin'
import { powerBiPlugin } from './power-bi/plugin'
import { prometheusManagementPlugin } from './prometheus-management/plugin'
import { redisManagementPlugin } from './redis-management/plugin'

/**
 * All available marketplace plugins
 * 
 * NOTE: Plugins are loaded from the hub, not built-in.
 * This array is kept for backward compatibility but will be empty.
 * Use the hub API to fetch plugins: /api/plugin-hub/plugins
 */
export const marketplacePlugins: PluginDefinition[] = [
  knowledgeBasePlugin,
  projectManagementPlugin,
  dataSciencePlugin,
  sqlQueryPlugin,
  aiAssistantPlugin,
  grafanaPlugin,
  grafanaManagementPlugin,
  kongManagementPlugin,
  lookerStudioPlugin,
  minioManagementPlugin,
  postgresqlManagementPlugin,
  powerBiPlugin,
  prometheusManagementPlugin,
  redisManagementPlugin,
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

