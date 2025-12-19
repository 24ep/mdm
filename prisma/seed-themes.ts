import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()

async function seedThemes() {
  console.log('🎨 Seeding themes...')

  try {
    // Check if themes already exist
    const existingThemes = await prisma.theme.count()
    
    if (existingThemes > 0) {
      console.log(`✓ ${existingThemes} theme(s) already exist in database`)
      return
    }

    // Load theme files
    const themesDir = path.join(process.cwd(), 'src', 'config', 'themes')
    const themeFiles = fs.readdirSync(themesDir).filter(file => file.endsWith('.json'))

    console.log(`Found ${themeFiles.length} theme file(s)`)

    for (const [index, file] of themeFiles.entries()) {
      const filePath = path.join(themesDir, file)
      const themeData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

      const isDefault = file === 'default.json'
      const isActive = index === 0 // First theme is active by default

      await prisma.theme.create({
        data: {
          name: themeData.name,
          description: themeData.description || '',
          themeMode: themeData.themeMode || 'light',
          tags: themeData.tags || [], // Use tags directly from JSON file, or empty array
          config: themeData.config,
          isDefault,
          isActive
        }
      })

      console.log(`  ✓ Created theme: ${themeData.name} ${isDefault ? '(default)' : ''} ${isActive ? '(active)' : ''}`)
    }

    console.log('✓ Themes seeded successfully!')
  } catch (error) {
    console.error('Error seeding themes:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run seed if executed directly
if (require.main === module) {
  seedThemes()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { seedThemes }
