const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    // Find the system group
    const group = await p.menuGroup.findUnique({ where: { slug: 'system' } });
    if (!group) {
        console.log('System group not found!');
        await p.$disconnect();
        return;
    }

    // Check if menu item exists
    const existing = await p.menuItem.findUnique({ where: { slug: 'menu' } });
    if (existing) {
        console.log('Menu Management item already exists');
        await p.$disconnect();
        return;
    }

    // Create menu item using raw SQL to include requiredRoles
    await p.$executeRaw`
    INSERT INTO menu_items (id, group_id, slug, name, icon, href, section, priority, is_visible, is_builtin, required_roles, created_at, updated_at)
    VALUES (gen_random_uuid(), ${group.id}::uuid, 'menu', 'Menu Management', 'LayoutGrid', '/system/menu', 'Management', 45, true, true, ARRAY['SUPER_ADMIN', 'ADMIN']::text[], NOW(), NOW())
  `;

    console.log('Added Menu Management to sidebar!');
    await p.$disconnect();
}

main();
