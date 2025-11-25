/**
 * Script to remove built-in plugins after migration to hub
 * 
 * Usage: node scripts/remove-built-in-plugins.js
 * 
 * WARNING: This will delete all plugins from src/features/marketplace/plugins/
 * Make sure you've migrated them to the hub first!
 */

const fs = require('fs').promises
const path = require('path')
const readline = require('readline')

const PLUGINS_DIR = path.join(__dirname, '..', 'src', 'features', 'marketplace', 'plugins')
const INDEX_FILE = path.join(PLUGINS_DIR, 'index.ts')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function removeBuiltInPlugins() {
  try {
    console.log('⚠️  WARNING: This will remove all built-in plugins!')
    console.log('Make sure you have:')
    console.log('1. Migrated plugins to hub')
    console.log('2. Tested that hub is working')
    console.log('3. Set USE_PLUGIN_HUB=true in .env\n')

    const answer = await question('Are you sure you want to continue? (yes/no): ')
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Cancelled')
      rl.close()
      return
    }

    console.log('\n🗑️  Removing built-in plugins...\n')

    // Read plugin directories
    const entries = await fs.readdir(PLUGINS_DIR, { withFileTypes: true })
    const pluginDirs = entries.filter(entry => entry.isDirectory() && entry.name !== '_template')

    // Remove each plugin directory
    for (const dir of pluginDirs) {
      const pluginPath = path.join(PLUGINS_DIR, dir.name)
      try {
        await fs.rm(pluginPath, { recursive: true, force: true })
        console.log(`✅ Removed ${dir.name}/`)
      } catch (error) {
        console.error(`❌ Failed to remove ${dir.name}: ${error.message}`)
      }
    }

    // Update index.ts to be empty
    const emptyIndex = `/**
 * Marketplace Plugin Registry
 * 
 * All plugins are now loaded from the plugin hub.
 * See plugin-hub/plugins/ for available plugins.
 */

import { PluginDefinition } from '../types'

/**
 * All available marketplace plugins (loaded from hub)
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
`

    await fs.writeFile(INDEX_FILE, emptyIndex, 'utf-8')
    console.log(`✅ Updated index.ts to empty array\n`)

    console.log('✨ Built-in plugins removed!')
    console.log('\n📝 Remember to:')
    console.log('1. Set USE_PLUGIN_HUB=true in .env')
    console.log('2. Start hub server: cd plugin-hub && npm run dev')
    console.log('3. Restart main app')

  } catch (error) {
    console.error('❌ Removal failed:', error)
  } finally {
    rl.close()
  }
}

removeBuiltInPlugins()

