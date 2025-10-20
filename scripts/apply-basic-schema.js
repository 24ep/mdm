#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');

console.log('🔧 Applying Basic Database Schema\n');

async function applySchema() {
  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management';
  const pool = new Pool({ connectionString });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Read and apply the main schema
    console.log('🔄 Applying main schema...');
    const schemaContent = fs.readFileSync('supabase/migrations/010_full_schema_postgres.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schemaContent.split(';').filter(stmt => stmt.trim());
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement && !statement.startsWith('--')) {
        try {
          await client.query(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (error) {
          console.log(`⚠️  Statement ${i + 1} failed (may be expected): ${error.message}`);
        }
      }
    }

    // Test if required tables exist
    console.log('\n🔍 Checking required tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const requiredTables = ['spaces', 'users', 'space_members', 'system_settings', 'notifications'];
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    console.log('📋 Table Status:');
    requiredTables.forEach(table => {
      if (existingTables.includes(table)) {
        console.log(`  ✅ ${table} - EXISTS`);
      } else {
        console.log(`  ❌ ${table} - MISSING`);
      }
    });

    client.release();
    await pool.end();
    
    console.log('\n🎉 Schema application completed!');
    
  } catch (error) {
    console.error('❌ Error applying schema:', error.message);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

applySchema();
