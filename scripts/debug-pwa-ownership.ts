
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, role: true }
        })
        console.log('USERS:', JSON.stringify(users, null, 2))

        const pwas = await prisma.websitePWA.findMany({
            select: { id: true, name: true, createdBy: true }
        })
        console.log('PWAS:', JSON.stringify(pwas, null, 2))

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
