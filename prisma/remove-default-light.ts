import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function removeDefaultLight() {
  console.log('🔍 Checking for "Default Light" theme...')

  try {
    // Find theme with name "Default Light" or similar
    const themes = await prisma.$queryRawUnsafe<Array<{ id: string; name: string }>>(
      `SELECT id, name FROM themes WHERE LOWER(name) LIKE '%default light%' OR LOWER(name) = 'default light'`
    )

    if (themes.length === 0) {
      console.log('✓ No "Default Light" theme found in database')
      return
    }

    console.log(`Found ${themes.length} theme(s) to remove:`)
    themes.forEach(theme => {
      console.log(`  - ${theme.name} (${theme.id})`)
    })

    // Delete the themes
    for (const theme of themes) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM themes WHERE id = $1::uuid`,
        theme.id
      )
      console.log(`  ✓ Deleted theme: ${theme.name}`)
    }

    console.log('✓ "Default Light" theme(s) removed successfully!')
  } catch (error) {
    console.error('Error removing "Default Light" theme:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  removeDefaultLight()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { removeDefaultLight }

