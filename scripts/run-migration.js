const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    const sqlFile = path.join(__dirname, '../sql/platform_integrations_schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('Running platform_integrations migration...');
    
    // Remove comments and split by semicolons
    const cleanSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    // Split into individual statements (by semicolon, but keep CREATE INDEX statements together)
    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Execute each statement separately
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await prisma.$executeRawUnsafe(statement + ';');
      }
    }
    
    console.log('✅ Migration completed successfully!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.meta) {
      console.error('Error details:', error.meta);
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

runMigration();

