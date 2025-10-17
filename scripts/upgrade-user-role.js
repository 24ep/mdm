const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres',
});

async function upgradeUserRole() {
  try {
    console.log('Upgrading existing user role...');
    
    // Get current users
    const users = await pool.query('SELECT id, email, name, role FROM public.users ORDER BY created_at ASC LIMIT 5');
    console.log('📊 Current users:');
    users.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name}) - Role: ${user.role}`);
    });
    
    // Upgrade the first user to MANAGER role
    if (users.rows.length > 0) {
      const firstUser = users.rows[0];
      console.log(`\n🔄 Upgrading ${firstUser.email} from ${firstUser.role} to MANAGER...`);
      
      const result = await pool.query(
        'UPDATE public.users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING email, name, role',
        ['MANAGER', firstUser.id]
      );
      
      console.log('✅ User upgraded successfully:', result.rows[0]);
      console.log('🎉 You can now access the users section with your existing account!');
    } else {
      console.log('❌ No users found to upgrade');
    }
    
  } catch (error) {
    console.error('❌ Error upgrading user role:', error);
    console.error('Error details:', error.message);
  } finally {
    await pool.end();
  }
}

upgradeUserRole();
