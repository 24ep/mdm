const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const result = await prisma.$queryRawUnsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'data_models'");
        console.log('COLUMNS in data_models:');
        console.table(result);

        const result2 = await prisma.$queryRawUnsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'data_model_spaces'");
        console.log('COLUMNS in data_model_spaces:');
        console.table(result2);
        const result3 = await prisma.$queryRawUnsafe("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'data_model_spaces'");
        console.log('DEFAULTS in data_model_spaces:');
        console.table(result3);
        const result4 = await prisma.$queryRawUnsafe("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'data_models'");
        console.log('DEFAULTS in data_models:');
        console.table(result4);
        const result5 = await prisma.$queryRawUnsafe("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'space_members'");
        console.log('DEFAULTS in space_members:');
        console.table(result5);
    } catch (err) {
        console.error('ERROR:', err.message);
        if (err.code) console.error('Error Code:', err.code);
    } finally {
        await prisma.$disconnect();
    }
}

check();
