#!/usr/bin/env node

/**
 * Create a test user for authentication testing
 */

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createTestUser() {
  try {
    console.log('👤 Creating test user...');
    
    // Check if test user already exists
    const existingUser = await pool.query('SELECT id FROM public.users WHERE email = $1', ['test@example.com']);
    
    if (existingUser.rows.length > 0) {
      console.log('✅ Test user already exists');
      console.log('📧 Email: test@example.com');
      console.log('🔑 Password: test123');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('test123', 12);
    
    // Create test user
    const result = await pool.query(
      `INSERT INTO public.users (email, name, password, role, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, name, role`,
      ['test@example.com', 'Test User', hashedPassword, 'ADMIN', true]
    );
    
    console.log('✅ Test user created successfully:', result.rows[0]);
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: test123');
    console.log('👤 Role: ADMIN');
    console.log('');
    console.log('🌐 You can now login at: http://localhost:3000/auth/signin');
    console.log('📊 Then visit: http://localhost:3000/data/entities?model=3bf5084c-14a6-4e8d-a41b-625f136dbd2d');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    console.error('Error details:', error.message);
  } finally {
    await pool.end();
  }
}

createTestUser();
