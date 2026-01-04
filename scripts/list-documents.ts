import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const schema = 'plugin_knowledge_base'

    console.log(`🔍 Checking all collections in schema: ${schema}\n`)

    try {
        // 1. List all collections
        const collections: any = await prisma.$queryRawUnsafe(`
        SELECT id, name FROM ${schema}.knowledge_collections
    `)

        console.log(`📚 Collections found: ${collections.length}`)

        for (const collection of collections) {
            console.log(`\n📂 Collection: ${collection.name} (${collection.id})`)

            // 2. List documents for this collection
            const documents: any = await prisma.$queryRawUnsafe(`
            SELECT id, title, "order", parent_id 
            FROM ${schema}.knowledge_documents
            WHERE collection_id::text = $1 AND deleted_at IS NULL
            ORDER BY created_at DESC
        `, collection.id)

            console.log(`   📄 Documents: ${documents.length}`)
            documents.forEach((doc: any) => {
                console.log(`     - [${doc.id}] ${doc.title} (Order: ${doc.order}, Parent: ${doc.parent_id})`)
            })
        }

    } catch (e: any) {
        console.error('❌ Error:', e.message)
    } finally {
        await prisma.$disconnect()
    }
}

main()
