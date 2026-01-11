
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: 'admin@example.com' }
    })
    console.log('Admin User:', user)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
