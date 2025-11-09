const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function checkUser() {
  const client = await pool.connect()
  try {
    const result = await client.query(
      'SELECT id, email, name, role, is_active FROM public.users WHERE email = $1',
      ['admin@example.com']
    )
    
    if (result.rows.length === 0) {
      console.log('❌ User not found')
      return
    }
    
    const user = result.rows[0]
    console.log('User found:')
    console.log(JSON.stringify(user, null, 2))
    
    // Check if is_active column exists
    const columns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_active'
    `)
    
    if (columns.rows.length === 0) {
      console.log('\n⚠️  is_active column does not exist in users table')
      console.log('This might be causing authentication issues')
    } else {
      console.log(`\n✅ is_active column exists: ${user.is_active}`)
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

checkUser()

