import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Migration script to add iconButton configuration to all themes in the database
 * Adds separate iconButton styling configuration for icon buttons
 */
async function migrateIconButton() {
  console.log('🔄 Migrating iconButton configuration for all themes...')

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

    // Default iconButton configurations based on theme mode
    const lightIconButtonConfig = {
      iconButton: {
        backgroundColor: 'transparent',
        textColor: '#1D1D1F',
        borderRadius: '8px',
        borderWidth: '0px',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'none',
        padding: '0.5rem',
        fontSize: '1rem',
        fontWeight: '400'
      },
      'iconButton-hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        textColor: '#1D1D1F',
        boxShadow: 'none'
      },
      'iconButton-active': {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        textColor: '#1D1D1F',
        boxShadow: 'none'
      },
      'iconButton-focus': {
        backgroundColor: 'transparent',
        textColor: '#1D1D1F',
        boxShadow: '0 0 0 2px rgba(0, 122, 255, 0.2)'
      },
      'iconButton-disabled': {
        backgroundColor: 'transparent',
        textColor: 'rgba(29, 29, 31, 0.3)',
        opacity: '0.5'
      }
    }

    const darkIconButtonConfig = {
      iconButton: {
        backgroundColor: 'transparent',
        textColor: '#F5F5F7',
        borderRadius: '8px',
        borderWidth: '0px',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'none',
        padding: '0.5rem',
        fontSize: '1rem',
        fontWeight: '400'
      },
      'iconButton-hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        textColor: '#F5F5F7',
        boxShadow: 'none'
      },
      'iconButton-active': {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        textColor: '#F5F5F7',
        boxShadow: 'none'
      },
      'iconButton-focus': {
        backgroundColor: 'transparent',
        textColor: '#F5F5F7',
        boxShadow: '0 0 0 2px rgba(10, 132, 255, 0.3)'
      },
      'iconButton-disabled': {
        backgroundColor: 'transparent',
        textColor: 'rgba(245, 245, 247, 0.3)',
        opacity: '0.5'
      }
    }

    for (const theme of themes) {
      try {
        const config = theme.config as any

        // Check if config is valid
        if (!config || typeof config !== 'object') {
          console.log(`  ⚠️  Skipping theme "${theme.name}" - invalid config`)
          skippedCount++
          continue
        }

        // Initialize componentStyling if it doesn't exist
        if (!config.componentStyling) {
          config.componentStyling = {}
        }

        // Determine theme mode (default to 'light' if not specified)
        const themeMode = (theme.themeMode || 'light').toLowerCase()
        const isDark = themeMode === 'dark'

        // Check if iconButton already exists
        const hasIconButton = config.componentStyling.iconButton !== undefined

        if (hasIconButton) {
          console.log(`  ⊘ Skipping theme "${theme.name}" - iconButton already exists`)
          continue
        }

        // Add iconButton configuration based on theme mode
        const iconButtonConfig = isDark ? darkIconButtonConfig : lightIconButtonConfig

        // Merge iconButton config into componentStyling
        Object.assign(config.componentStyling, iconButtonConfig)

        // Update theme in database
        await prisma.theme.update({
          where: { id: theme.id },
          data: {
            config: config as any,
            updatedAt: new Date()
          }
        })

        console.log(`  ✓ Updated theme: ${theme.name} (${themeMode} mode)`)
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
  migrateIconButton()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { migrateIconButton }

