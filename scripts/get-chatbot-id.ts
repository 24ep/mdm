import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()


async function main() {
    try {
        const chatbot = await prisma.chatbot.findFirst()
        if (chatbot) {
            fs.writeFileSync('scripts/id.txt', chatbot.id)
            console.log('Done')
        } else {
            console.log('NO_CHATBOT_FOUND')
        }
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
