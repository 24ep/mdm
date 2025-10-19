#!/usr/bin/env node

/**
 * Script to check database schema
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkDBSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database schema...');
    
    // Check tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check if users table exists and its structure
    const usersTableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    if (usersTableCheck.rows.length > 0) {
      console.log('\n👤 Users table structure:');
      usersTableCheck.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log('\n❌ Users table does not exist!');
    }
    
    // Check if we need to run more migrations
    console.log('\n🔧 Checking migration status...');
    const migrationCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'spaces', 'space_members')
    `);
    
    const essentialTables = parseInt(migrationCheck.rows[0].count);
    console.log(`📊 Essential tables found: ${essentialTables}/3`);
    
    if (essentialTables < 3) {
      console.log('⚠️  Missing essential tables. Need to run more migrations.');
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the check
if (require.main === module) {
  checkDBSchema()
    .then(() => {
      console.log('✅ Schema check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Schema check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkDBSchema };
