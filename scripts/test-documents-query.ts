import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
    const schema = 'plugin_knowledge_base'
    const collectionId = '0c8edeab-6ba5-40e9-a988-228bad89c756'

    console.log('🧪 Testing documents query...')

    try {
        // Test the exact query pattern from documents/route.ts
        const whereConditions = ['kd.deleted_at IS NULL', 'kd.collection_id::text = $1', 'kd.parent_id IS NULL']
        const whereClause = whereConditions.join(' AND ')

        const result: any = await prisma.$queryRawUnsafe(`
      SELECT 
        kd.id,
        kd.title,
        kd.created_at
      FROM "${schema}".knowledge_documents kd
      WHERE ${whereClause}
      LIMIT 20 OFFSET 0
    `, collectionId)

        console.log('✅ Query successful!')
        console.log('Documents found:', result.length)
    } catch (e: any) {
        console.error('❌ Query failed:', e.message)
        console.error('Full error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

test()
