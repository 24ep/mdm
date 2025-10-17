const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres',
});

async function checkDatabaseAndCreateUser() {
  try {
    console.log('Checking database connection...');
    
    // Test database connection
    const testQuery = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful:', testQuery.rows[0]);
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    console.log('✅ Users table exists:', tableCheck.rows[0].exists);
    
    // Check current users
    const users = await pool.query('SELECT id, email, name, role, is_active FROM public.users ORDER BY created_at DESC LIMIT 10');
    console.log('📊 Current users in database:');
    console.log('Total users:', users.rows.length);
    users.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name}) - Role: ${user.role} - Active: ${user.is_active}`);
    });
    
    // If no users exist, create a test user
    if (users.rows.length === 0) {
      console.log('⚠️  No users found. Creating a test user...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('test123', 12);
      
      const result = await pool.query(
        `INSERT INTO public.users (email, name, password, role, is_active) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, email, name, role`,
        ['test@example.com', 'Test User', hashedPassword, 'MANAGER', true]
      );
      
      console.log('✅ Test user created:', result.rows[0]);
      console.log('📧 Email: test@example.com');
      console.log('🔑 Password: test123');
      console.log('👤 Role: MANAGER');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
    console.error('Error details:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabaseAndCreateUser();
