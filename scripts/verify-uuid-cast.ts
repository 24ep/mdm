import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function verify() {
    console.log('🚀 Verifying UUID casting fix for Knowledge Base...')

    const schema = 'plugin_knowledge_base'
    const collectionId = 'f6c8364e-09a6-4cc6-813c-09d0372344c8'
    const userId = '46af3a1a-73f5-4ee1-9ee3-eb9a2f7b3900'

    try {
        console.log(`  🧪 Environment: schema=${schema}, collectionId=${collectionId}, userId=${userId}`)

        // Clean up if exists
        await prisma.$queryRawUnsafe(`DELETE FROM "${schema}".knowledge_collection_members WHERE collection_id::text = $1 AND user_id::text = $2`, collectionId, userId)

        // Test INSERT with casts
        console.log('  🧪 Testing INSERT into knowledge_collection_members with ::uuid casts...')
        await prisma.$queryRawUnsafe(
            `INSERT INTO "${schema}".knowledge_collection_members (
        id, collection_id, user_id, role, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, $2::uuid, 'admin', NOW(), NOW()
      )`,
            collectionId,
            userId
        )
        console.log('  ✅ INSERT successful!')

        // Test SELECT with text casts (recommended pattern)
        console.log('  🧪 Testing SELECT with ::text casts...')
        const result: any[] = await prisma.$queryRawUnsafe(
            `SELECT * FROM "${schema}".knowledge_collection_members 
       WHERE collection_id::text = $1 AND user_id::text = $2`,
            collectionId,
            userId
        )

        if (result.length > 0) {
            console.log('  ✅ SELECT successful! Record found.')
        } else {
            throw new Error('Record not found after INSERT!')
        }

        console.log('\n✨ All UUID casting checks passed!')
    } catch (error: any) {
        console.error('❌ Verification failed:', error.message)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

verify()
