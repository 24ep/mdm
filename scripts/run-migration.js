const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// SQL files to execute in order (dependencies first)
const SQL_FILES = [
  'reports_schema.sql',           // Base reports tables (categories, folders, reports)
  'reports_audit_schema.sql',     // Audit tables that reference reports tables
  'platform_integrations_schema.sql'  // Platform integrations
];

async function executeSqlFile(filePath, fileName) {
  console.log(`\nRunning ${fileName} migration...`);
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  if (!sql.trim()) {
    console.log(`⚠️  ${fileName} is empty`);
    return;
  }

  try {
    console.log(`Executing ${fileName}...`);
    await prisma.$executeRawUnsafe(sql);
    console.log(`✅ ${fileName} completed!`);
  } catch (error) {
    // If multiple statements fail, we might want to try splitting as fallback? 
    // But for $$ blocks we must not split. 
    // Let's rely on Postgres handling multiple statements.
    throw error;
  }
}

async function runMigration() {
  try {
    for (const sqlFileName of SQL_FILES) {
      const sqlFile = path.join(__dirname, '../sql', sqlFileName);
      
      // Check if file exists before executing
      if (fs.existsSync(sqlFile)) {
        await executeSqlFile(sqlFile, sqlFileName);
      } else {
        console.log(`⚠️  Skipping ${sqlFileName} (file not found)`);
      }
    }
    
    console.log('\n✅ All migrations completed successfully!');
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

