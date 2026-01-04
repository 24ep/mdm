
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // Check if roles table exists and list roles
        const roles = await prisma.$queryRaw`SELECT * FROM roles LIMIT 10`;
        console.log('Roles:', roles);
    } catch (e) {
        console.log('Roles table error:', e.message);
    }

    try {
        // Check if permissions table exists
        const permissions = await prisma.$queryRaw`SELECT * FROM permissions LIMIT 10`;
        console.log('Permissions:', permissions);
    } catch (e) {
        console.log('Permissions table error:', e.message);
    }

    try {
        // Check if role_permissions table exists
        const rolePerms = await prisma.$queryRaw`SELECT * FROM role_permissions LIMIT 10`;
        console.log('Role Permissions:', rolePerms);
    } catch (e) {
        console.log('Role Permissions table error:', e.message);
    }

    await prisma.$disconnect();
}

main();
