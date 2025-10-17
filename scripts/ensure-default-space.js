const { Pool } = require('pg')
require('dotenv').config()

// Use the database URL from environment or default to local Supabase
const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres'

const pool = new Pool({
  connectionString: databaseUrl,
})

async function ensureDefaultSpace() {
  const client = await pool.connect()
  
  try {
    console.log('Ensuring default space exists...')

    // Check if a default space already exists
    const checkResult = await client.query(
      'SELECT * FROM spaces WHERE is_default = true AND deleted_at IS NULL'
    )

    if (checkResult.rows.length > 0) {
      console.log('✅ Default space already exists:', checkResult.rows[0].name)
      console.log('   ID:', checkResult.rows[0].id)
      return checkResult.rows[0]
    }

    console.log('⚠️  No default space found. Creating one...')

    // Get the first admin user to be the creator
    const userResult = await client.query(
      "SELECT * FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN') AND is_active = true LIMIT 1"
    )

    if (userResult.rows.length === 0) {
      console.error('❌ No admin users found. Please create an admin user first.')
      return null
    }

    const adminUser = userResult.rows[0]

    // Create the default space
    const spaceResult = await client.query(
      `INSERT INTO spaces (name, description, is_default, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      ['Default Space', 'The default workspace for organizing your data', true, true, adminUser.id]
    )

    const newSpace = spaceResult.rows[0]
    console.log('✅ Default space created successfully!')
    console.log('   Name:', newSpace.name)
    console.log('   ID:', newSpace.id)
    console.log('   Created by:', adminUser.name || adminUser.email)

    return newSpace

  } catch (error) {
    console.error('❌ Error ensuring default space:', error)
    return null
  } finally {
    client.release()
    await pool.end()
  }
}

// Run the script
ensureDefaultSpace()
