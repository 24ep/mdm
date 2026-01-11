
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkMenuItems() {
    console.log('Checking Data Models menu item...')
    const item = await prisma.menuItem.findFirst({
        where: { slug: 'data-models' },
        include: { group: true }
    })

    if (item) {
        console.log('✅ Found item:', item)
    } else {
        console.log('❌ Item not found!')
    }

    console.log('Checking User Roles...')
    const users = await prisma.user.findMany({
        select: { email: true, role: true }
    })
    console.table(users)

    await prisma.$disconnect()
}

checkMenuItems()
