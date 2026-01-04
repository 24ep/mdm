import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
    console.log('🔍 Testing getKnowledgeSchema behavior...\n')

    try {
        // Check service_installations for knowledge-base
        const installations: any = await prisma.$queryRawUnsafe(`
      SELECT si.id, si.db_schema, si.space_id, sr.slug 
      FROM service_installations si 
      JOIN service_registry sr ON sr.id = si.service_id 
      WHERE sr.slug = 'knowledge-base' AND si.deleted_at IS NULL
    `)
        console.log('📦 Knowledge Base installations:')
        console.log(installations)

        // This simulates what getKnowledgeSchema does without spaceId
        const schemaResult: any = await prisma.$queryRawUnsafe(`
      SELECT si.db_schema FROM service_installations si 
      JOIN service_registry sr ON sr.id = si.service_id 
      WHERE sr.slug = 'knowledge-base' AND si.space_id IS NULL AND si.deleted_at IS NULL
    `)
        console.log('\n📝 Schema for null spaceId:')
        console.log(schemaResult)

        const schema = schemaResult[0]?.db_schema || 'public'
        const formattedSchema = schema === 'public' ? 'public' : `"${schema}"`
        console.log(`\n✅ getKnowledgeSchema would return: ${formattedSchema}`)

        // Check what collections exist in each schema
        console.log('\n📦 Collections in formatted schema:')
        const collections: any = await prisma.$queryRawUnsafe(
            `SELECT id, name FROM ${formattedSchema}.knowledge_collections WHERE deleted_at IS NULL LIMIT 5`
        )
        console.log(collections)

    } catch (e: any) {
        console.error('❌ Error:', e.message)
    } finally {
        await prisma.$disconnect()
    }
}

test()
