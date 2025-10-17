const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres',
});

async function createManagerUser() {
  try {
    console.log('Creating manager user...');
    
    // Check if manager user already exists
    const existingUser = await pool.query('SELECT id FROM public.users WHERE email = $1', ['manager@example.com']);
    
    if (existingUser.rows.length > 0) {
      console.log('Manager user already exists');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('manager123', 12);
    
    // Create manager user
    const result = await pool.query(
      `INSERT INTO public.users (email, name, password, role, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, name, role`,
      ['manager@example.com', 'Manager User', hashedPassword, 'MANAGER', true]
    );
    
    console.log('✅ Manager user created successfully:', result.rows[0]);
    console.log('📧 Email: manager@example.com');
    console.log('🔑 Password: manager123');
    console.log('👤 Role: MANAGER');
    console.log('');
    console.log('You can now login with these credentials to access the users section.');
    
  } catch (error) {
    console.error('❌ Error creating manager user:', error);
    console.error('Error details:', error.message);
  } finally {
    await pool.end();
  }
}

createManagerUser();
