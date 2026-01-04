import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function verify() {
    console.log('🚀 Verifying Knowledge Base API fix...')

    const userId = '46af3a1a-73f5-4ee1-9ee3-eb9a2f7b3900'
    const schemaName = 'plugin_knowledge_base'

    try {
        // 1. Verify user exists
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (user) {
            console.log('  ✅ User exists in database')
        } else {
            throw new Error('User still missing!')
        }

        // 2. Verify schema migration
        const installation = await prisma.serviceInstallation.findFirst({
            where: { service: { slug: 'knowledge-base' } }
        })
        if (installation?.dbSchema === schemaName) {
            console.log('  ✅ Installation linked to isolated schema')
        } else {
            throw new Error(`Installation not linked correctly! Found: ${installation?.dbSchema}`)
        }

        // 3. Verify tables in isolated schema
        const tables: any[] = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'plugin_knowledge_base'
    `)
        const tableNames = tables.map(t => t.table_name)
        if (tableNames.includes('knowledge_collections')) {
            console.log('  ✅ knowledge_collections table exists in isolated schema')
        } else {
            throw new Error('knowledge_collections table missing in isolated schema!')
        }

        console.log('\n✨ All technical checks passed! The 500 error should be resolved.')
    } catch (error: any) {
        console.error('❌ Verification failed:', error.message)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

verify()
