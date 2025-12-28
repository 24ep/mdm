import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding test chatbot...')

    // 1. Get Admin User
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    })

    if (!admin) {
        throw new Error('Admin user not found. Please run seed script or create-admin-user script first.')
    }

    const chatbotId = 'd94af672-fee9-4ec3-b76a-74032cb4021e'

    // 2. Upsert Chatbot
    const chatbot = await prisma.chatbot.upsert({
        where: { id: chatbotId },
        update: {},
        create: {
            id: chatbotId,
            name: 'Test Chatbot',
            description: 'Chatbot for testing embed functionality',
            apiEndpoint: '/api/chat',
            createdBy: admin.id,
            engineType: 'chatkit',
            deploymentType: 'popover',
            isPublished: true,
            apiAuthType: 'none',
            conversationOpener: 'Hello! How can I help you today?',
            primaryColor: '#000000',
            fontFamily: 'Inter',
            fontSize: '14px',
            fontColor: '#000000',
            borderColor: '#e5e7eb',
            borderWidth: '1px',
            borderRadius: '12px',
            messageBoxColor: '#ffffff',
            shadowColor: 'rgba(0,0,0,0.1)',
            shadowBlur: '10px'
        }
    })

    console.log(`Created/Updated Chatbot: ${chatbot.id}`)

    // 3. Create Version with Config
    const config = {
        chatkitAgentId: 'test-agent-id', // Dummy ID
        theme: {
            primaryColor: '#000000'
        }
    }

    // Check if version exists to avoid constraint errors if running multiple times
    const existingVersion = await prisma.chatbotVersion.findFirst({
        where: { chatbotId: chatbot.id, version: '1.0.0' }
    })

    if (!existingVersion) {
        await prisma.chatbotVersion.create({
            data: {
                chatbotId: chatbot.id,
                version: '1.0.0',
                config: config,
                isPublished: true,
                createdBy: admin.id
            }
        })
    }

    // Also update currentVersion on Chatbot
    await prisma.chatbot.update({
        where: { id: chatbot.id },
        data: { currentVersion: '1.0.0' }
    })

    console.log('Seeded test chatbot version.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
