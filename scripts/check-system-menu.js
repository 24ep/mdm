const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    const groups = await p.$queryRaw`SELECT slug, name FROM menu_groups`;
    console.log('Groups:', groups);

    const systemItems = await p.$queryRaw`
    SELECT mi.slug, mi.name, mi.section, mi.is_visible 
    FROM menu_items mi 
    JOIN menu_groups mg ON mg.id = mi.group_id 
    WHERE mg.slug = 'system'
  `;
    console.log('System items:', systemItems);

    await p.$disconnect();
}

main();
