const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TARGET_USER_ID = '46af3a1a-73f5-4ee1-9ee3-eb9a2f7b3900';

async function fixUser() {
    console.log(`🛠️ Checking for user consistency (Target ID: ${TARGET_USER_ID})...`);

    try {
        // 1. Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: TARGET_USER_ID }
        });

        if (user) {
            console.log(`✅ User ${TARGET_USER_ID} already exists.`);
        } else {
            console.log(`✨ Creating user ${TARGET_USER_ID}...`);
            // We'll try to create with minimal fields first
            const userData = {
                id: TARGET_USER_ID,
                name: 'Admin User',
                email: 'admin@example.com',
                role: 'ADMIN'
            };

            try {
                await prisma.user.create({ data: { ...userData, password: 'password123' } });
            } catch (e) {
                if (e.message.includes('Unknown argument')) {
                    console.log('  ⚠️ password field missing in schema, trying without it...');
                    await prisma.user.create({ data: userData });
                } else {
                    throw e;
                }
            }
            console.log('✅ User created successfully.');
        }

        // 2. Ensure the user has the ADMIN role assigned
        if (user && user.role !== 'ADMIN') {
            console.log(`🆙 Updating user ${TARGET_USER_ID} to ADMIN role...`);
            await prisma.user.update({
                where: { id: TARGET_USER_ID },
                data: { role: 'ADMIN' }
            });
            console.log('✅ Role updated.');
        }

        console.log('\n🚀 User consistency check complete.');
    } catch (error) {
        console.error('❌ Error fixing user:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

fixUser();
