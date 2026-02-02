const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Listing users...');
  try {
    const users = await prisma.user.findMany({
      take: 20,
      select: { id: true, email: true, name: true }
    });
    console.log('Users found:', users.length);
    users.forEach(u => console.log(`- ${u.id}: ${u.email} (${u.name})`));
  } catch (e) {
    console.error('Error listing users:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
