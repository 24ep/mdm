import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
    const schema = 'plugin_knowledge_base'
    console.log(`🔍 Checking tables in schema: ${schema}\n`)

    try {
        const tables: any = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1
    `, schema)

        console.log('📦 Tables found:')
        tables.forEach((t: any) => console.log(` - ${t.table_name}`))

        const versionTable = tables.find((t: any) => t.table_name === 'knowledge_document_versions')
        if (versionTable) {
            console.log('\n✅ knowledge_document_versions table exists.')
        } else {
            console.log('\n❌ knowledge_document_versions table IS MISSING!')
        }

    } catch (e: any) {
        console.error('❌ Error:', e.message)
    } finally {
        await prisma.$disconnect()
    }
}

test()
