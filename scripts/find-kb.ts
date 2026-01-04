
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const plugins = await prisma.$queryRaw`SELECT id, name, slug, ui_config FROM service_registry WHERE slug LIKE '%knowledge%'`;
        console.log('Knowledge Plugins:');
        // @ts-ignore
        plugins.forEach(p => {
            console.log(`- ${p.name} (slug: ${p.slug})`);
            // @ts-ignore
            console.log(`  Navigation: ${JSON.stringify(p.ui_config?.navigation)}`);
        });

    } catch (e) {
        console.error('List failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
