const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Ensuring Data Management Space ---');
        
        // 1. Check/Create Space
        let space = await prisma.space.findFirst({
            where: { slug: 'datamanagement' }
        });

        if (!space) {
            console.log('Space "datamanagement" not found. Creating...');
            // Need a creator. Use system admin if possible.
            const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
            if (!admin) throw new Error('No System Admin found to create space.');

            space = await prisma.space.create({
                data: {
                    name: 'Data Management',
                    slug: 'datamanagement',
                    description: 'Central space for data management',
                    isDefault: false, // careful with naming convention in prisma client
                    isActive: true,
                    createdBy: admin.id
                }
            });
            console.log('Created space:', space.id);
        } else {
            console.log('Found space:', space.id);
        }

        // 2. Ensure Admin is a member
        const systemAdmins = await prisma.user.findMany({
            where: { role: 'ADMIN' }
        });

        console.log(`Found ${systemAdmins.length} system admins.`);

        for (const admin of systemAdmins) {
            const member = await prisma.spaceMember.upsert({
                where: {
                    spaceId_userId: {
                        spaceId: space.id,
                        userId: admin.id
                    }
                },
                update: {
                    role: 'ADMIN'
                },
                create: {
                    spaceId: space.id,
                    userId: admin.id,
                    role: 'ADMIN'
                }
            });
            console.log(`Ensured Admin ${admin.email} is member of space ${space.slug}`);
        }

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
