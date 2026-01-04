/**
 * Remove plugin-dependent menu items from built-in seed
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // These items should only show when their plugins are installed
    const pluginDependentItems = ['bigquery', 'ai-analyst', 'notebook'];

    for (const slug of pluginDependentItems) {
        try {
            const result = await prisma.$executeRaw`DELETE FROM menu_items WHERE slug = ${slug}`;
            console.log(`Removed: ${slug}`);
        } catch (e) {
            console.log(`${slug}: already removed or not found`);
        }
    }

    await prisma.$disconnect();
}

main();
