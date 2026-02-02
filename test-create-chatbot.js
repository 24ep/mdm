const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminId = 'd9653d28-c90c-4405-9a52-b55d78566348'; // Admin user ID found earlier
  
  console.log('Testing chatbot creation with user:', adminId);
  try {
    const chatbot = await prisma.chatbot.create({
      data: {
        name: 'Test Chatbot',
        website: 'http://test.com',
        apiEndpoint: 'http://api.test.com',
        createdBy: adminId,
        versions: {
          create: {
            version: '1.0.0',
            config: { name: 'Test Chatbot' },
            createdBy: adminId
          }
        }
      }
    });
    console.log('Chatbot created successfully:', chatbot.id);
    
    // Cleanup
    await prisma.chatbot.delete({ where: { id: chatbot.id } });
    console.log('Cleanup: Chatbot deleted.');
  } catch (e) {
    console.error('Error creating chatbot:', e.message);
    if (e.code === 'P2003') {
       console.error('Foreign key constraint violation details:', e.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
