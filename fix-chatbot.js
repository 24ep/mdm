const { PrismaClient } = require('@prisma/client');

async function main() {
    const db = new PrismaClient();

    try {
        // Get the chatbot with versions
        const chatbot = await db.chatbot.findUnique({
            where: { id: 'd94af672-fee9-4ec3-b76a-74032cb4021e' },
            include: {
                versions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!chatbot || !chatbot.versions || chatbot.versions.length === 0) {
            console.log('Chatbot or versions not found!');
            return;
        }

        const version = chatbot.versions[0];
        const config = version.config || {};

        console.log('Current chatkitAgentId:', config.chatkitAgentId);

        // Clear the invalid workflow ID
        const updatedConfig = { ...config };
        delete updatedConfig.chatkitAgentId;

        // Update the version
        await db.chatbotVersion.update({
            where: { id: version.id },
            data: { config: updatedConfig }
        });

        console.log('Successfully cleared chatkitAgentId from version config!');
        console.log('Please refresh the test page and update the chatbot with a valid agent ID in the admin panel.');

    } finally {
        await db.$disconnect();
    }
}

main().catch(console.error);
