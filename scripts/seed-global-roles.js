/**
 * Seed Default Global Roles
 * 
 * This script seeds the roles table with default global roles.
 * Run this during application startup or as a migration script.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Default global roles to seed
const defaultRoles = [
  {
    name: 'SUPER_ADMIN',
    description: 'Super Administrator with full system access. Can manage all features, users, and settings across the entire platform.',
  },
  {
    name: 'ADMIN',
    description: 'Administrator with elevated privileges. Can manage users, spaces, and most system settings.',
  },
  {
    name: 'MANAGER',
    description: 'Manager role with team leadership capabilities. Can manage team members and access reporting features.',
  },
  {
    name: 'USER',
    description: 'Standard user role with basic access. Can access assigned spaces and perform regular operations.',
  },
];

async function seedGlobalRoles() {
  console.log('🔐 Seeding default global roles...');

  let seeded = 0;
  let skipped = 0;

  for (const role of defaultRoles) {
    try {
      // Check if role already exists
      const existing = await prisma.role.findUnique({
        where: { name: role.name }
      });

      if (existing) {
        console.log(`  ⏭️  Role "${role.name}" already exists, skipping...`);
        skipped++;
        continue;
      }

      // Create the role
      await prisma.role.create({
        data: {
          name: role.name,
          description: role.description,
        }
      });

      console.log(`  ✅ Created role: ${role.name}`);
      seeded++;
    } catch (error) {
      console.error(`  ❌ Failed to seed role ${role.name}:`, error.message);
      // Continue with other roles
    }
  }

  console.log(`\n🔐 Global role seeding complete: ${seeded} seeded, ${skipped} skipped`);
}

async function run() {
  try {
    await seedGlobalRoles();
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding global roles:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

run();
