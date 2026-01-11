import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
    const slugsToDelete = [
        'knowledge-tool',
        'agents',
        'notebook',
        'projects',
        'ontology',
        'bigquery',
        'ai-chat-ui'
    ]

    console.log('🗑️ Cleaning up orphaned menu items:', slugsToDelete.join(', '))

    const result = await prisma.menuItem.deleteMany({
        where: {
            slug: {
                in: slugsToDelete
            },
            isBuiltin: true // Only delete if it was seeded as built-in
        }
    })

    console.log(`✅ Deleted ${result.count} orphaned built-in menu items.`)
}

cleanup()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
