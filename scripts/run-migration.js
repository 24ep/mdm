// Simple migration runner for a single SQL file
// Usage: node scripts/run-migration.js supabase/migrations/019_notification_system.sql

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Usage: node scripts/run-migration.js <path-to-sql>');
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(filePath)) {
    console.error(`SQL file not found: ${filePath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(filePath, 'utf8');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set in environment.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`Migration applied successfully: ${fileArg}`);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Migration failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();


