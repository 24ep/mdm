/**
 * Seed Menu Permissions by Role
 * 
 * This script updates menu_items with required_roles to control
 * which roles can see each menu item.
 * 
 * Role Hierarchy:
 * - SUPER_ADMIN: All access
 * - ADMIN: All access
 * - USER: Standard features (no system settings, security, etc.)
 * - VIEWER: Read-only, limited menu items
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Define which menu items are accessible by which roles
// Items not listed here will default to empty array (all roles, handled as special case)
const menuPermissions = {
    // Overview - accessible to all
    'overview': ['SUPER_ADMIN', 'ADMIN', 'USER', 'VIEWER'],

    // Tools - most accessible to USER and above
    'bi': ['SUPER_ADMIN', 'ADMIN', 'USER', 'VIEWER'],
    'ai-analyst': ['SUPER_ADMIN', 'ADMIN', 'USER'],
    'ai-chat-ui': ['SUPER_ADMIN', 'ADMIN', 'USER'],
    'pwa': ['SUPER_ADMIN', 'ADMIN', 'USER'],
    'bigquery': ['SUPER_ADMIN', 'ADMIN', 'USER'],
    'notebook': ['SUPER_ADMIN', 'ADMIN', 'USER'],
    'storage': ['SUPER_ADMIN', 'ADMIN', 'USER'],
    'data-governance': ['SUPER_ADMIN', 'ADMIN'],

    // System - mostly admin only
    'marketplace': ['SUPER_ADMIN', 'ADMIN'],
    'users': ['SUPER_ADMIN', 'ADMIN'],
    'space-layouts': ['SUPER_ADMIN', 'ADMIN'],
    'assets': ['SUPER_ADMIN', 'ADMIN'],
    'logs': ['SUPER_ADMIN', 'ADMIN'],
    'audit': ['SUPER_ADMIN', 'ADMIN'],
    'database': ['SUPER_ADMIN', 'ADMIN'],
    'change-requests': ['SUPER_ADMIN', 'ADMIN'],
    'sql-linting': ['SUPER_ADMIN', 'ADMIN'],
    'schema-migrations': ['SUPER_ADMIN', 'ADMIN'],
    'data-masking': ['SUPER_ADMIN', 'ADMIN'],
    'cache': ['SUPER_ADMIN', 'ADMIN'],
    'backup': ['SUPER_ADMIN', 'ADMIN'],
    'security': ['SUPER_ADMIN', 'ADMIN'],
    'performance': ['SUPER_ADMIN', 'ADMIN'],
    'settings': ['SUPER_ADMIN', 'ADMIN'],
    'themes': ['SUPER_ADMIN', 'ADMIN'],
    'integrations': ['SUPER_ADMIN', 'ADMIN'],
    'api': ['SUPER_ADMIN', 'ADMIN'],

    // Data Management
    'space-selection': ['SUPER_ADMIN', 'ADMIN', 'USER'],

    // Infrastructure - admin only
    'infrastructure': ['SUPER_ADMIN', 'ADMIN'],
};

async function seedMenuPermissions() {
    console.log('🔐 Seeding menu permissions...');

    let updated = 0;
    for (const [slug, roles] of Object.entries(menuPermissions)) {
        try {
            const result = await prisma.$executeRaw`
        UPDATE menu_items 
        SET required_roles = ${roles}::text[], updated_at = NOW()
        WHERE slug = ${slug}
      `;
            if (result > 0) {
                console.log(`  ✅ ${slug}: ${roles.join(', ')}`);
                updated++;
            }
        } catch (error) {
            console.error(`  ❌ Failed to update ${slug}:`, error.message);
        }
    }

    console.log(`\n🔐 Menu permissions seeded: ${updated} items updated.`);
}

async function seedRoles() {
    console.log('👥 Seeding roles...');

    const roles = [
        { name: 'SUPER_ADMIN', description: 'Super Administrator with all permissions' },
        { name: 'ADMIN', description: 'Administrator with full access to most features' },
        { name: 'USER', description: 'Standard user with access to common features' },
        { name: 'VIEWER', description: 'Read-only user with limited access' },
    ];

    for (const role of roles) {
        try {
            const existing = await prisma.$queryRaw`SELECT id FROM roles WHERE name = ${role.name}`;
            if (existing.length === 0) {
                await prisma.$executeRaw`
          INSERT INTO roles (id, name, description)
          VALUES (gen_random_uuid(), ${role.name}, ${role.description})
        `;
                console.log(`  ✅ Created role: ${role.name}`);
            } else {
                console.log(`  ⏭️  Role ${role.name} already exists`);
            }
        } catch (error) {
            console.error(`  ❌ Failed to create role ${role.name}:`, error.message);
        }
    }
}

async function run() {
    try {
        await seedRoles();
        await seedMenuPermissions();
        await prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding permissions:', error.message);
        await prisma.$disconnect();
        process.exit(1);
    }
}

run();
