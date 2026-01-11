
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUserRole() {
    const email = 'admin@example.com' // Assuming this is the user
    const user = await prisma.user.findUnique({
        where: { email },
        include: { roles: true }
    })

    console.log('User:', user?.email)
    console.log('Roles:', user?.roles)
    console.log('Role field (if exists):', (user as any).role)
}

checkUserRole()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
