import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Migration script to update all themes in the database
 * Changes drawerStyle.type from "normal" to "modern" for all themes
 * This ensures model popup dialogs appear on the right-hand side
 */
async function migrateDrawerStyle() {
  console.log('🔄 Migrating drawer style for all themes...')

  try {
    // Get all themes from database
    const themes = await prisma.theme.findMany()

    if (themes.length === 0) {
      console.log('⚠️  No themes found in database')
      return
    }

    console.log(`Found ${themes.length} theme(s) to update`)

    let updatedCount = 0
    let skippedCount = 0

    for (const theme of themes) {
      try {
        const config = theme.config as any

        // Check if config has drawerStyle
        if (!config || typeof config !== 'object') {
          console.log(`  ⚠️  Skipping theme "${theme.name}" - invalid config`)
          skippedCount++
          continue
        }

        // Initialize drawerStyle if it doesn't exist
        if (!config.drawerStyle) {
          config.drawerStyle = {
            type: 'modern',
            margin: '16px',
            borderRadius: '12px',
            width: '500px'
          }
        } else {
          // Update existing drawerStyle.type from "normal" to "modern"
          if (config.drawerStyle.type === 'normal') {
            config.drawerStyle.type = 'modern'
          } else if (!config.drawerStyle.type) {
            // If type is missing, set it to modern
            config.drawerStyle.type = 'modern'
          }
        }

        // Update theme in database
        await prisma.theme.update({
          where: { id: theme.id },
          data: {
            config: config as any,
            updatedAt: new Date()
          }
        })

        console.log(`  ✓ Updated theme: ${theme.name}`)
        updatedCount++

        // If this is the active theme, also sync to system_settings
        if (theme.isActive) {
          try {
            await prisma.$executeRawUnsafe(
              `INSERT INTO system_settings (id, key, value, created_at, updated_at)
               VALUES (gen_random_uuid(), $1, $2::jsonb, NOW(), NOW())
               ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
              'branding_config',
              JSON.stringify(config)
            )
            console.log(`  ✓ Synced active theme "${theme.name}" to system_settings`)
          } catch (error) {
            console.error(`  ⚠️  Failed to sync "${theme.name}" to system_settings:`, error)
          }
        }
      } catch (error) {
        console.error(`  ❌ Error updating theme "${theme.name}":`, error)
        skippedCount++
      }
    }

    console.log('\n✓ Migration completed!')
    console.log(`  - Updated: ${updatedCount} theme(s)`)
    if (skippedCount > 0) {
      console.log(`  - Skipped: ${skippedCount} theme(s)`)
    }
    console.log('\n💡 Tip: If the active theme was updated, you may need to refresh the page to see changes.')
  } catch (error) {
    console.error('❌ Error during migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrateDrawerStyle()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { migrateDrawerStyle }

