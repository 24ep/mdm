
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const plugins = await prisma.$queryRaw`
      SELECT id, name, slug, ui_config 
      FROM service_registry 
      WHERE (slug LIKE '%public%' OR slug LIKE '%knowledge%') 
      AND slug != 'knowledge-base'
    `;
        console.log('Other Knowledge/Public Plugins:');
        // @ts-ignore
        plugins.forEach(p => {
            console.log(`- ${p.name} (slug: ${p.slug})`);
            // @ts-ignore
            console.log(`  Navigation: ${JSON.stringify(p.ui_config?.navigation)}`);
        });
        // @ts-ignore
        if (plugins.length === 0) {
            console.log("No other matching plugins found.");
        }

    } catch (e) {
        console.error('Search failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
