#!/usr/bin/env node

/**
 * Script to fix users table constraints and create admin user
 */

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixUsersConstraints() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing users table constraints...');
    
    // Check constraints
    const constraintsResult = await client.query(`
      SELECT conname, contype, confrelid::regclass 
      FROM pg_constraint 
      WHERE conrelid = 'users'::regclass
    `);
    
    console.log('\n📋 Current constraints on users table:');
    constraintsResult.rows.forEach(row => {
      console.log(`  - ${row.conname} (${row.contype})`);
    });
    
    // Drop problematic foreign key constraint if it exists
    const fkConstraint = constraintsResult.rows.find(row => 
      row.conname === 'users_id_fkey' && row.contype === 'f'
    );
    
    if (fkConstraint) {
      console.log('\n🔧 Dropping problematic foreign key constraint...');
      await client.query('ALTER TABLE public.users DROP CONSTRAINT users_id_fkey');
      console.log('✅ Dropped users_id_fkey constraint');
    }
    
    // Check if admin user already exists
    const existingUser = await client.query(
      'SELECT id FROM public.users WHERE email = $1', 
      ['admin@example.com']
    );
    
    if (existingUser.rows.length > 0) {
      console.log('\nℹ️  Admin user already exists');
      return;
    }
    
    // Create admin user
    console.log('\n👤 Creating admin user...');
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const result = await client.query(
      `INSERT INTO public.users (id, email, name, password, role, is_active, first_name, last_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, email, name, role`,
      [userId, 'admin@example.com', 'Admin User', hashedPassword, 'ADMIN', true, 'Admin', 'User']
    );
    
    console.log('✅ Admin user created successfully:', result.rows[0]);
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error fixing users constraints:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the fix
if (require.main === module) {
  fixUsersConstraints()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixUsersConstraints };
