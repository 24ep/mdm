import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

/**
 * Update existing themes in the database with the latest config from JSON files
 * This ensures all themes have the new config structure with all required fields
 */
async function updateThemes() {
  console.log('🔄 Updating themes in database...')

  try {
    // Load theme files
    const themesDir = path.join(process.cwd(), 'src', 'config', 'themes')
    const themeFiles = fs.readdirSync(themesDir).filter(file => file.endsWith('.json'))

    console.log(`Found ${themeFiles.length} theme file(s)`)

    for (const file of themeFiles) {
      const filePath = path.join(themesDir, file)
      const themeData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

      // Find existing theme by name using raw SQL (works even if theme_mode column doesn't exist)
      let existingThemes: Array<{ id: string; is_active: boolean }>
      try {
        existingThemes = await prisma.$queryRawUnsafe<Array<{ id: string; is_active: boolean }>>(
          `SELECT id, is_active FROM themes WHERE name = $1 LIMIT 1`,
          themeData.name
        )
      } catch (e: any) {
        existingThemes = []
      }
      const existingTheme = existingThemes[0] ? { id: existingThemes[0].id, isActive: existingThemes[0].is_active } : null

      if (existingTheme) {
        // Update existing theme with new config using raw SQL
        const themeMode = themeData.themeMode || 'light'
        const tags = themeData.tags || []
        const isDefault = file === 'default.json' || file === 'default-dark.json'
        
        // Try to update with all columns, fallback if columns don't exist
        try {
          // Try with theme_mode and tags
          await prisma.$executeRawUnsafe(
            `UPDATE themes 
             SET description = $1,
                 theme_mode = $2,
                 tags = $3::text[],
                 config = $4::jsonb,
                 is_default = $5,
                 updated_at = NOW()
             WHERE id = $6::uuid`,
            themeData.description || '',
            themeMode,
            JSON.stringify(tags),
            JSON.stringify(themeData.config),
            isDefault,
            existingTheme.id
          )
        } catch (e: any) {
          try {
            // Try with tags but without theme_mode
            await prisma.$executeRawUnsafe(
              `UPDATE themes 
               SET description = $1,
                   tags = $2::text[],
                   config = $3::jsonb,
                   is_default = $4,
                   updated_at = NOW()
               WHERE id = $5::uuid`,
              themeData.description || '',
              JSON.stringify(tags),
              JSON.stringify(themeData.config),
              isDefault,
              existingTheme.id
            )
          } catch (e2: any) {
            // Last resort: Update only config and description (most important)
            await prisma.$executeRawUnsafe(
              `UPDATE themes 
               SET description = $1,
                   config = $2::jsonb,
                   is_default = $3,
                   updated_at = NOW()
               WHERE id = $4::uuid`,
              themeData.description || '',
              JSON.stringify(themeData.config),
              isDefault,
              existingTheme.id
            )
          }
        }

        console.log(`  ✓ Updated theme: ${themeData.name} ${file === 'default.json' ? '(default)' : ''}`)

        // Check if theme is active using raw SQL
        const activeCheck = await prisma.$queryRawUnsafe<Array<{ is_active: boolean }>>(
          `SELECT is_active FROM themes WHERE id = $1::uuid`,
          existingTheme.id
        )
        const isActiveAfterUpdate = activeCheck[0]?.is_active || false

        // If this is the active theme, also sync to system_settings
        if (isActiveAfterUpdate) {
          try {
            await prisma.$executeRawUnsafe(
              `INSERT INTO system_settings (id, key, value, created_at, updated_at)
               VALUES (gen_random_uuid(), $1, $2::jsonb, NOW(), NOW())
               ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
              'branding_config',
              JSON.stringify(themeData.config)
            )
            console.log(`  ✓ Synced active theme to system_settings`)
          } catch (error) {
            console.error(`  ⚠️ Failed to sync to system_settings:`, error)
          }
        }
      } else {
        // Create new theme if it doesn't exist using raw SQL
        const isDefault = file === 'default.json' || file === 'default-dark.json'
        const activeCount = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
          `SELECT COUNT(*)::int as count FROM themes WHERE is_active = true`
        )
        const isActive = (file === 'default.json' || file === 'default-dark.json') && (Number(activeCount[0]?.count || 0) === 0)

        // Try to insert with all columns, fallback if columns don't exist
        try {
          // Try with theme_mode and tags
          await prisma.$executeRawUnsafe(
            `INSERT INTO themes (id, name, description, theme_mode, tags, config, is_active, is_default, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4::text[], $5::jsonb, $6, $7, NOW(), NOW())`,
            themeData.name,
            themeData.description || '',
            themeData.themeMode || 'light',
            JSON.stringify(themeData.tags || []),
            JSON.stringify(themeData.config),
            isActive,
            isDefault
          )
        } catch (e: any) {
          try {
            // Try with tags but without theme_mode
            await prisma.$executeRawUnsafe(
              `INSERT INTO themes (id, name, description, tags, config, is_active, is_default, created_at, updated_at)
               VALUES (gen_random_uuid(), $1, $2, $3::text[], $4::jsonb, $5, $6, NOW(), NOW())`,
              themeData.name,
              themeData.description || '',
              JSON.stringify(themeData.tags || []),
              JSON.stringify(themeData.config),
              isActive,
              isDefault
            )
          } catch (e2: any) {
            // Last resort: Insert without theme_mode and tags (most important is config)
            await prisma.$executeRawUnsafe(
              `INSERT INTO themes (id, name, description, config, is_active, is_default, created_at, updated_at)
               VALUES (gen_random_uuid(), $1, $2, $3::jsonb, $4, $5, NOW(), NOW())`,
              themeData.name,
              themeData.description || '',
              JSON.stringify(themeData.config),
              isActive,
              isDefault
            )
          }
        }

        console.log(`  ✓ Created new theme: ${themeData.name} ${isDefault ? '(default)' : ''} ${isActive ? '(active)' : ''}`)
      }
    }

    console.log('✓ Themes updated successfully!')
    console.log('💡 Tip: If the active theme was updated, you may need to refresh the page to see changes.')
  } catch (error) {
    console.error('❌ Error updating themes:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run update if executed directly
if (require.main === module) {
  updateThemes()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { updateThemes }

