#!/usr/bin/env node

/**
 * Script to fix the users table by adding missing columns
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixUsersTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing users table...');
    
    // Check current structure
    const currentColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current users table structure:');
    currentColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Add missing columns
    const columnsToAdd = [
      { name: 'email', type: 'TEXT', nullable: true },
      { name: 'password', type: 'TEXT', nullable: true },
      { name: 'phone', type: 'TEXT', nullable: true },
      { name: 'first_name', type: 'TEXT', nullable: true },
      { name: 'last_name', type: 'TEXT', nullable: true }
    ];
    
    console.log('\n🔧 Adding missing columns...');
    
    for (const column of columnsToAdd) {
      const columnExists = currentColumns.rows.some(row => row.column_name === column.name);
      
      if (!columnExists) {
        try {
          await client.query(`
            ALTER TABLE public.users 
            ADD COLUMN ${column.name} ${column.type}${column.nullable ? '' : ' NOT NULL'}
          `);
          console.log(`✅ Added column: ${column.name}`);
        } catch (error) {
          console.log(`⚠️  Could not add column ${column.name}: ${error.message}`);
        }
      } else {
        console.log(`ℹ️  Column ${column.name} already exists`);
      }
    }
    
    // Create indexes
    console.log('\n🔧 Creating indexes...');
    
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email)');
      console.log('✅ Created email index');
    } catch (error) {
      console.log(`⚠️  Could not create email index: ${error.message}`);
    }
    
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role)');
      console.log('✅ Created role index');
    } catch (error) {
      console.log(`⚠️  Could not create role index: ${error.message}`);
    }
    
    // Check final structure
    const finalColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Final users table structure:');
    finalColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    console.log('\n🎉 Users table fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing users table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the fix
if (require.main === module) {
  fixUsersTable()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixUsersTable };
