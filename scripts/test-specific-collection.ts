import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
    const collectionId = '4f4f2298-fb58-4f97-b613-212f44a8af82'

    console.log(`🧪 Testing documents query for collection: ${collectionId}\n`)

    try {
        // First check: which schema has this collection?
        const publicCheck: any = await prisma.$queryRawUnsafe(
            `SELECT id, name FROM public.knowledge_collections WHERE id::text = $1 AND deleted_at IS NULL`,
            collectionId
        )
        console.log('📦 In public schema:', publicCheck)

        const pluginCheck: any = await prisma.$queryRawUnsafe(
            `SELECT id, name FROM "plugin_knowledge_base".knowledge_collections WHERE id::text = $1 AND deleted_at IS NULL`,
            collectionId
        )
        console.log('📦 In plugin_knowledge_base schema:', pluginCheck)

        // Now test the exact query from documents/route.ts
        const schema = '"plugin_knowledge_base"'
        const whereConditions = ['kd.deleted_at IS NULL', 'kd.collection_id::text = $1', 'kd.parent_id IS NULL']
        const whereClause = whereConditions.join(' AND ')

        console.log(`\n🔍 Testing documents query with schema: ${schema}`)
        const docs: any = await prisma.$queryRawUnsafe(`
      SELECT kd.id, kd.title
      FROM ${schema}.knowledge_documents kd
      WHERE ${whereClause}
      LIMIT 20
    `, collectionId)
        console.log('📄 Documents found:', docs)

    } catch (e: any) {
        console.error('❌ Error:', e.message)
        console.error('Code:', e.code)
    } finally {
        await prisma.$disconnect()
    }
}

test()
