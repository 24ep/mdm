import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const plugins = await prisma.$queryRaw`SELECT id, name, slug FROM service_registry WHERE name ILIKE '%Knowledge%'`;
        // @ts-ignore
        for (const p of plugins) {
            const installs = await prisma.$queryRawUnsafe(
                'SELECT id, space_id, status FROM service_installations WHERE service_id = CAST($1 AS uuid) AND deleted_at IS NULL',
                p.id
            );
            // @ts-ignore
            if (installs.length > 0) {
                // @ts-ignore
                installs.forEach(i => {
                    const scope = i.space_id ? `Space (${i.space_id})` : 'GLOBAL';
                    console.log(`Plugin "${p.name}" (${p.slug}) is INSTALLED. Scope: ${scope}, Status: ${i.status}`);
                });
            } else {
                console.log(`Plugin "${p.name}" (${p.slug}) is NOT INSTALLED.`);
            }
        }
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
