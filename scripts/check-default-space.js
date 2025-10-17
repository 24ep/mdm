const { Pool } = require('pg')
require('dotenv').config()

// Use the database URL from environment or default to local Supabase
const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres'

const pool = new Pool({
  connectionString: databaseUrl,
})

async function checkDefaultSpace() {
  const client = await pool.connect()
  
  try {
    console.log('Checking default space...')

    // Get the default space
    const spaceResult = await client.query(
      'SELECT * FROM spaces WHERE is_default = true AND deleted_at IS NULL'
    )

    if (spaceResult.rows.length === 0) {
      console.log('No default space found!')
      return
    }

    const defaultSpace = spaceResult.rows[0]
    console.log('Default space found:')
    console.log('- ID:', defaultSpace.id)
    console.log('- Name:', defaultSpace.name)
    console.log('- Description:', defaultSpace.description)
    console.log('- Is Default:', defaultSpace.is_default)
    console.log('- Is Active:', defaultSpace.is_active)
    console.log('- Created By:', defaultSpace.created_by)
    console.log('- Created At:', defaultSpace.created_at)

    // Get space members
    const membersResult = await client.query(
      `SELECT 
        sm.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_system_role
      FROM space_members sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.space_id = $1
      ORDER BY sm.role DESC, u.name ASC`,
      [defaultSpace.id]
    )

    console.log('\nSpace members:')
    membersResult.rows.forEach(member => {
      console.log(`- ${member.user_name || member.user_email} (${member.role})`)
    })

    // Check if there are any data models in this space
    const modelsResult = await client.query(
      'SELECT COUNT(*) as count FROM data_models WHERE space_id = $1 AND deleted_at IS NULL',
      [defaultSpace.id]
    )

    console.log('\nData models in this space:', modelsResult.rows[0].count)

    // Check if there are any assignments in this space
    const assignmentsResult = await client.query(
      'SELECT COUNT(*) as count FROM assignments WHERE space_id = $1 AND deleted_at IS NULL',
      [defaultSpace.id]
    )

    console.log('Assignments in this space:', assignmentsResult.rows[0].count)

    // Check if there are any customers in this space
    const customersResult = await client.query(
      'SELECT COUNT(*) as count FROM customers WHERE space_id = $1 AND deleted_at IS NULL',
      [defaultSpace.id]
    )

    console.log('Customers in this space:', customersResult.rows[0].count)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

// Run the script
checkDefaultSpace()
