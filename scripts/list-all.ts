
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const plugins = await prisma.serviceRegistry.findMany({
        select: { name: true, slug: true }
    });
    console.log('All Plugins:');
    plugins.forEach(p => console.log(`${p.name} (${p.slug})`));
    await prisma.$disconnect();
}
main();
