
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing Prisma connection...');
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('Prisma connection successful:', result);
    
    console.log('Testing "tags" column check query...');
    try {
      const tagsCheck = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'spaces' 
          AND column_name = 'tags'
        ) as exists
      `);
      console.log('Tags check successful:', tagsCheck);
    } catch (e) {
      console.error('Tags check failed:', e);
    }

    console.log('Checking for Chatbot table via Prisma Client...');
    try {
        const chatbots = await prisma.chatbot.findMany({
            take: 1,
            include: {
                creator: { select: { id: true, name: true, email: true } }
            }
        });
        console.log('Chatbot findMany successful. Count:', chatbots.length);
    } catch (e) {
        console.error('Chatbot findMany failed:', e);
    }

  } catch (error) {
    console.error('General failure:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
