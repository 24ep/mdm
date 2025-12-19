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
  
  // Remove comments and split by semicolons
  const cleanSql = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
  
  // Split into individual statements
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
  
  console.log(`✅ ${fileName} completed!`);
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

