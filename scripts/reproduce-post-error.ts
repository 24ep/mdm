import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
    const schema = '"plugin_knowledge_base"'
    const collectionId = '4f4f2298-fb58-4f97-b613-212f44a8af82' // Using the ID from the user report
    const userId = '46af3a1a-73f5-4ee1-9ee3-eb9a2f7b3900' // The fixed session user

    console.log(`🧪 Testing document creation for collection: ${collectionId}\n`)

    try {
        // 1. Calculate order queries
        console.log('Testing Max Order Query...')
        const orderResult: any = await prisma.$queryRawUnsafe(`
        SELECT COALESCE(MAX("order"), 0) + 1 as next_order
        FROM ${schema}.knowledge_documents
        WHERE collection_id::text = $1 AND parent_id IS NULL AND deleted_at IS NULL
    `, collectionId)
        console.log('✅ Max Order Result:', orderResult)
        const nextOrder = orderResult[0]?.next_order || 0

        // 2. Insert Document
        console.log('\nTesting Document INSERT...')
        const title = 'Test Document ' + Date.now()
        const content = 'Test content'

        // Note: We need to use explicit casts for UUIDs just like the API
        const docResult: any = await prisma.$queryRawUnsafe(`
      INSERT INTO ${schema}.knowledge_documents (
        id, collection_id, title, content, content_html, parent_id, is_template,
        is_public, is_pinned, "order", created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, $2, $3, $4, $5::uuid, $6, $7, $8, $9, $10::uuid, NOW(), NOW()
      ) RETURNING *
    `,
            collectionId,
            title,
            content,
            null,
            null,
            false,
            false,
            false,
            nextOrder,
            userId
        )
        console.log('✅ Document Inserted:', docResult[0].id)
        const docId = docResult[0].id

        // 3. Insert Version
        console.log('\nTesting Version INSERT...')
        const verResult: any = await prisma.$queryRawUnsafe(`
      INSERT INTO ${schema}.knowledge_document_versions (
        id, document_id, title, content, content_html, created_by, created_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, $2, $3, $4, $5::uuid, NOW()
      )
    `,
            docId,
            title,
            content,
            null,
            userId
        )
        console.log('✅ Version Inserted')

    } catch (e: any) {
        console.error('❌ Error:', e.message)
        console.error('Code:', e.code)
        if (e.meta) console.error('Meta:', e.meta)
    } finally {
        await prisma.$disconnect()
    }
}

test()
