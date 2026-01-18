
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Connecting to database...')
    const result = await prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    // console.log('Tables in public schema:', result)
    
    // Check for users table specifically
    const usersTable = (result as any[]).find((r: any) => r.table_name === 'users')
    if (usersTable) {
        console.log('✅ users table exists')
    } else {
        console.error('❌ users table MISSING')
    }

    // Check for themes table specifically
    const themesTable = (result as any[]).find((r: any) => r.table_name === 'themes')
    if (themesTable) {
        console.log('✅ themes table exists')
    } else {
        console.error('❌ themes table MISSING')
    }

  } catch (e) {
    console.error('Error querying database:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
