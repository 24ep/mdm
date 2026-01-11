
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function debugMenuVisibility() {
    try {
        // 1. Check ALL Users
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true }
        })
        console.log('All Users:', JSON.stringify(users, null, 2))

        // 2. Check "System" Group and Items
        const systemGroup = await prisma.menuGroup.findFirst({
            where: { slug: 'system' },
            include: { items: true }
        })
        console.log('System Group Items:', systemGroup?.items.map(i => ({ name: i.name, requiredRoles: i.requiredRoles })))

        // 3. Check "Tools" Group and Items
        const toolsGroup = await prisma.menuGroup.findFirst({
            where: { slug: 'tools' },
            include: { items: true }
        })
        console.log('Tools Group Items:', toolsGroup?.items.map(i => ({ name: i.name, requiredRoles: i.requiredRoles })))

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

debugMenuVisibility()
