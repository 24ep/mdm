/**
 * Script to update badge styling in all theme configs in the database
 * Adds badge component styling with fully rounded design and reduced padding
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

const badgeConfig = {
  borderRadius: "9999px",
  borderWidth: "0px",
  padding: "0.125rem 0.375rem",
  fontSize: "0.75rem",
  fontWeight: "600",
  transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)"
}

async function updateBadgeThemeConfig() {
  console.log('🔄 Updating badge styling in database themes...')

  try {
    // Get all themes from database
    const themes = await prisma.theme.findMany()

    console.log(`Found ${themes.length} theme(s) in database`)

    for (const theme of themes) {
      try {
        const config = theme.config || {}
        
        if (!config.componentStyling) {
          config.componentStyling = {}
        }

        // Add or update badge styling
        config.componentStyling.badge = badgeConfig

        // Update theme in database
        await prisma.theme.update({
          where: { id: theme.id },
          data: { config }
        })

        console.log(`✅ Updated badge styling for theme: ${theme.name}`)
      } catch (error) {
        console.error(`❌ Error updating theme ${theme.name}:`, error)
      }
    }

    console.log('✅ Badge styling update complete!')
  } catch (error) {
    console.error('❌ Error updating badge theme config:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateBadgeThemeConfig()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

