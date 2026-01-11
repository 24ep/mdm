
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function promoteUser() {
    try {
        // Get the first user
        const user = await prisma.user.findFirst()
        if (!user) {
            console.log('No user found.')
            return
        }

        console.log(`Promoting user ${user.email} from ${user.role} to ADMIN...`)

        await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' }
        })

        console.log('✅ User promoted successfully.')

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

promoteUser()
