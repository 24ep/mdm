import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
    console.log('Cleaning up orphaned data-management group...')

    // Delete menu items first (foreign key constraint)
    const deletedItems = await prisma.menuItem.deleteMany({
        where: {
            group: {
                slug: 'data-management'
            }
        }
    })
    console.log('Deleted items:', deletedItems.count)

    // Delete the group
    const deletedGroup = await prisma.menuGroup.deleteMany({
        where: {
            slug: 'data-management'
        }
    })
    console.log('Deleted group:', deletedGroup.count)

    console.log('✅ Cleanup complete')
}

cleanup()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
