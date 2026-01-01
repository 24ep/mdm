
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        // Target user (admin@example.com)
        const targetUser = await prisma.user.findUnique({
            where: { email: 'admin@example.com' }
        })

        if (!targetUser) {
            console.log('Target user not found!')
            return
        }

        // Update PWA
        const pwa = await prisma.websitePWA.findFirst({
            where: { name: 'Test PWA Studio App' }
        })

        if (pwa) {
            await prisma.websitePWA.update({
                where: { id: pwa.id },
                data: { createdBy: targetUser.id }
            })
            console.log(`Transferred PWA ${pwa.id} to user ${targetUser.email}`)
        } else {
            console.log('PWA not found')
        }

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
