const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const result = await prisma.$queryRawUnsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'data_models'");
        console.log('COLUMNS in data_models:');
        console.table(result);
    } catch (err) {
        console.error('ERROR:', err.message);
        if (err.code) console.error('Error Code:', err.code);
    } finally {
        await prisma.$disconnect();
    }
}

check();
