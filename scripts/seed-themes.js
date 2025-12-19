/**
 * Seed Themes
 * 
 * This script seeds the theme table with default themes from JSON files.
 * Run this during application startup or as a migration script.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedThemes() {
  console.log('🎨 Seeding themes...');

  try {
    // Check if themes already exist
    const existingThemes = await prisma.theme.count();
    
    if (existingThemes > 0) {
      console.log(`✓ ${existingThemes} theme(s) already exist in database, skipping seed`);
      return;
    }

    // Load theme files - try multiple possible paths
    const possiblePaths = [
      path.join(process.cwd(), 'src', 'config', 'themes'),
      path.join(__dirname, '..', 'src', 'config', 'themes'),
      path.join('/app', 'src', 'config', 'themes'),
    ];

    let themesDir = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        themesDir = p;
        break;
      }
    }

    if (!themesDir) {
      console.log('⚠️  No themes directory found, skipping theme seed');
      console.log('   Searched paths:', possiblePaths);
      return;
    }

    const themeFiles = fs.readdirSync(themesDir).filter(file => file.endsWith('.json'));

    if (themeFiles.length === 0) {
      console.log('⚠️  No theme JSON files found in', themesDir);
      return;
    }

    console.log(`Found ${themeFiles.length} theme file(s) in ${themesDir}`);

    let seeded = 0;
    for (const [index, file] of themeFiles.entries()) {
      try {
        const filePath = path.join(themesDir, file);
        const themeData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        const isDefault = file === 'default.json';
        const isActive = index === 0; // First theme is active by default

        await prisma.theme.create({
          data: {
            name: themeData.name,
            description: themeData.description || '',
            themeMode: themeData.themeMode || 'light',
            tags: themeData.tags || [],
            config: themeData.config,
            isDefault,
            isActive
          }
        });

        console.log(`  ✓ Created theme: ${themeData.name} ${isDefault ? '(default)' : ''} ${isActive ? '(active)' : ''}`);
        seeded++;
      } catch (error) {
        console.error(`  ❌ Failed to seed theme from ${file}:`, error.message);
      }
    }

    console.log(`✓ Themes seeded successfully! (${seeded} themes)`);
  } catch (error) {
    console.error('Error seeding themes:', error.message);
    throw error;
  }
}

async function run() {
  try {
    await seedThemes();
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in theme seed script:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

run();
