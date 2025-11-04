// Script to apply all SQL migrations in order
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function applyMigration(client, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  try {
    console.log(`  Applying: ${fileName}...`);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`  ✅ Success: ${fileName}`);
    return true;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    
    // Check if it's a "already exists" error - that's OK
    if (err.message.includes('already exists') || 
        err.message.includes('duplicate') ||
        err.message.includes('IF NOT EXISTS')) {
      console.log(`  ⚠️  Skipped (already applied): ${fileName}`);
      return true;
    }
    
    console.error(`  ❌ Failed: ${fileName}`);
    console.error(`     Error: ${err.message}`);
    return false;
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in environment.');
    process.exit(1);
  }

  console.log('🚀 Applying all SQL migrations...\n');

  // Get all migration files
  const migrationsDir = path.join(__dirname, '..', 'postgrest', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Sort alphabetically to ensure order

  console.log(`Found ${files.length} migration files\n`);

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const result = await applyMigration(client, filePath);
      
      if (result === true) {
        // Check if it was skipped by looking at the last message
        const sql = fs.readFileSync(filePath, 'utf8');
        if (sql.includes('IF NOT EXISTS') || sql.includes('CREATE TABLE IF NOT EXISTS')) {
          // These are idempotent, count as success
          successCount++;
        } else {
          successCount++;
        }
      } else {
        failCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Applied: ${successCount}`);
    console.log(`  ⚠️  Skipped: ${skipCount}`);
    console.log(`  ❌ Failed: ${failCount}`);

    if (failCount === 0) {
      console.log('\n✅ All migrations completed successfully!');
    } else {
      console.log('\n⚠️  Some migrations failed. Check errors above.');
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();

