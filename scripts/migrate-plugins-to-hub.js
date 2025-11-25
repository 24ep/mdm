/**
 * Migration Script: Move all plugins from built-in to hub
 * 
 * Usage: node scripts/migrate-plugins-to-hub.js
 */

const fs = require('fs').promises
const path = require('path')

const SOURCE_DIR = path.join(__dirname, '..', 'src', 'features', 'marketplace', 'plugins')
const HUB_DIR = path.join(__dirname, '..', 'plugin-hub', 'plugins')

async function migratePlugins() {
  try {
    console.log('🚀 Starting plugin migration to hub...\n')

    // Check if source directory exists
    try {
      await fs.access(SOURCE_DIR)
    } catch {
      console.error(`❌ Source directory not found: ${SOURCE_DIR}`)
      process.exit(1)
    }

    // Create hub plugins directory if it doesn't exist
    await fs.mkdir(HUB_DIR, { recursive: true })
    console.log(`✅ Hub directory ready: ${HUB_DIR}\n`)

    // Read all plugin directories
    const entries = await fs.readdir(SOURCE_DIR, { withFileTypes: true })
    const pluginDirs = entries.filter(entry => entry.isDirectory() && entry.name !== '_template')

    if (pluginDirs.length === 0) {
      console.log('⚠️  No plugins found to migrate')
      return
    }

    console.log(`📦 Found ${pluginDirs.length} plugins to migrate:\n`)

    // Migrate each plugin
    for (const dir of pluginDirs) {
      const pluginName = dir.name
      const sourcePath = path.join(SOURCE_DIR, pluginName)
      const targetPath = path.join(HUB_DIR, pluginName)

      try {
        // Check if already exists in hub
        try {
          await fs.access(targetPath)
          console.log(`⏭️  ${pluginName} - Already exists in hub, skipping`)
          continue
        } catch {
          // Doesn't exist, proceed with copy
        }

        // Copy entire plugin directory
        await copyDirectory(sourcePath, targetPath)
        console.log(`✅ ${pluginName} - Migrated successfully`)

        // Update plugin.ts to mark as hub plugin
        const pluginFile = path.join(targetPath, 'plugin.ts')
        try {
          let pluginContent = await fs.readFile(pluginFile, 'utf-8')
          
          // Add source: 'hub' if not present
          if (!pluginContent.includes("source: 'hub'") && !pluginContent.includes('source: "hub"')) {
            // Find the plugin definition and add source
            pluginContent = pluginContent.replace(
              /(export const \w+Plugin: PluginDefinition = \{)/,
              `$1\n  source: 'hub',`
            )
            await fs.writeFile(pluginFile, pluginContent, 'utf-8')
            console.log(`   └─ Updated plugin.ts with source: 'hub'`)
          }
        } catch (error) {
          console.warn(`   ⚠️  Could not update plugin.ts: ${error.message}`)
        }

      } catch (error) {
        console.error(`❌ ${pluginName} - Failed: ${error.message}`)
      }
    }

    console.log('\n✨ Migration complete!')
    console.log('\n📝 Next steps:')
    console.log('1. Review plugins in plugin-hub/plugins/')
    console.log('2. Start hub server: cd plugin-hub && npm run dev')
    console.log('3. Update .env: USE_PLUGIN_HUB=true')
    console.log('4. (Optional) Remove built-in plugins after testing')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

async function copyDirectory(source, target) {
  await fs.mkdir(target, { recursive: true })
  const entries = await fs.readdir(source, { withFileTypes: true })

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name)
    const targetPath = path.join(target, entry.name)

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath)
    } else {
      await fs.copyFile(sourcePath, targetPath)
    }
  }
}

// Run migration
migratePlugins()

