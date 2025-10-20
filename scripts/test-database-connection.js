#!/usr/bin/env node

const { Pool } = require('pg');

console.log('🔍 Testing Database Connection\n');

// Test database connection
async function testConnection() {
  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres';
  
  console.log('📡 Connection String:', connectionString);
  
  const pool = new Pool({ 
    connectionString,
    max: 1,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('🔄 Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test basic query
    console.log('🔄 Testing basic query...');
    const result = await client.query('SELECT version()');
    console.log('✅ Database version:', result.rows[0].version);
    
    // Check if required tables exist
    console.log('🔄 Checking for required tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check for specific tables that the API needs
    const requiredTables = ['spaces', 'users', 'space_members', 'system_settings', 'notifications'];
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    console.log('\n🔍 Checking required tables:');
    requiredTables.forEach(table => {
      if (existingTables.includes(table)) {
        console.log(`  ✅ ${table} - EXISTS`);
      } else {
        console.log(`  ❌ ${table} - MISSING`);
      }
    });
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Detail:', error.detail);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 SUGGESTION: PostgreSQL server is not running or not accessible');
      console.log('   Make sure PostgreSQL is running on the correct port');
    } else if (error.code === '28P01') {
      console.log('\n💡 SUGGESTION: Authentication failed');
      console.log('   Check your username and password in DATABASE_URL');
    } else if (error.code === '3D000') {
      console.log('\n💡 SUGGESTION: Database does not exist');
      console.log('   Create the database first');
    }
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testConnection().then(() => {
  console.log('\n🎯 Test completed');
}).catch(error => {
  console.error('Test failed:', error);
});
