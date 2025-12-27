const { PrismaClient } = require('@prisma/client');

async function main() {
    const db = new PrismaClient();

    try {
        const chatbot = await db.chatbot.findUnique({
            where: { id: 'd94af672-fee9-4ec3-b76a-74032cb4021e' },
            include: {
                versions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!chatbot) {
            console.log('Chatbot not found!');
            return;
        }

        console.log('=== Chatbot Record ===');
        console.log('Engine Type:', chatbot.engineType);
        console.log('openaiAgentSdkAgentId:', chatbot.openaiAgentSdkAgentId || 'NOT SET');
        console.log('chatkitAgentId:', chatbot.chatkitAgentId || 'NOT SET');

        if (chatbot.versions && chatbot.versions.length > 0) {
            const v = chatbot.versions[0];
            const config = v.config || {};
            console.log('\n=== Latest Version Config (FULL) ===');
            console.log('Engine Type in version:', config.engineType);
            console.log('openaiAgentSdkAgentId in version:', config.openaiAgentSdkAgentId);
            console.log('chatkitAgentId in version:', config.chatkitAgentId);

            // Print all keys that contain 'agent' or 'sdk' or 'wf_'
            console.log('\n=== All Agent-related keys in version config ===');
            for (const [key, value] of Object.entries(config)) {
                const strVal = String(value);
                if (key.toLowerCase().includes('agent') ||
                    key.toLowerCase().includes('sdk') ||
                    strVal.includes('wf_') ||
                    strVal.includes('asst_')) {
                    console.log(`${key}: ${strVal}`);
                }
            }
        }
    } finally {
        await db.$disconnect();
    }
}

main().catch(console.error);
