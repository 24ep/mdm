(async()=>{
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  try {
    await p.$queryRawUnsafe('SELECT 1');
    console.log('DB OK');
  } catch (e) {
    console.error('DB FAIL:', e.message);
    process.exit(1);
  } finally {
    await p.$disconnect();
  }
})();
