import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
    console.log('🔍 Checking collections in both schemas...\n')

    try {
        const pluginCollections: any = await prisma.$queryRawUnsafe(
            'SELECT id, name FROM "plugin_knowledge_base".knowledge_collections WHERE deleted_at IS NULL LIMIT 5'
        )
        console.log('📦 plugin_knowledge_base.knowledge_collections:')
        console.log(pluginCollections)

        const publicCollections: any = await prisma.$queryRawUnsafe(
            'SELECT id, name FROM public.knowledge_collections WHERE deleted_at IS NULL LIMIT 5'
        )
        console.log('\n📦 public.knowledge_collections:')
        console.log(publicCollections)
    } catch (e: any) {
        console.error('Error:', e.message)
    } finally {
        await prisma.$disconnect()
    }
}

test()
