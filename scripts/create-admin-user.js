const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Check if admin user already exists
    const existingUser = await pool.query('SELECT id FROM public.users WHERE email = $1', ['admin@example.com']);
    
    if (existingUser.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create admin user
    const userId = uuidv4();
    const now = new Date();
    const result = await pool.query(
      `INSERT INTO public.users (id, email, name, password, role, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, email, name, role`,
      [userId, 'admin@example.com', 'Admin User', hashedPassword, 'ADMIN', now, now]
    );
    
    console.log('Admin user created successfully:', result.rows[0]);
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();
