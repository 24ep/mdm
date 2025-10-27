const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

if (!process.env.DATABASE_URL) {
  console.error('Missing required DATABASE_URL environment variable')
  process.exit(1)
}

async function createDefaultSpace() {
  const client = await pool.connect()
  
  try {
    console.log('Creating default space...')

    // First, check if a default space already exists
    const checkResult = await client.query(`
      SELECT * FROM public.spaces 
      WHERE is_default = true AND deleted_at IS NULL
    `)

    if (checkResult.rows.length > 0) {
      console.log('Default space already exists:', checkResult.rows[0].name)
      return
    }

    // Get the first admin user to be the creator
    const userResult = await client.query(`
      SELECT * FROM public.users 
      WHERE role IN ('SUPER_ADMIN', 'ADMIN') AND is_active = true 
      LIMIT 1
    `)

    if (userResult.rows.length === 0) {
      console.error('No admin users found. Please create an admin user first.')
      return
    }

    const adminUser = userResult.rows[0]

    // Create the default space
    const createResult = await client.query(`
      INSERT INTO public.spaces (name, description, is_default, is_active, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      'Default Space',
      'The default workspace for organizing your data',
      true,
      true,
      adminUser.id
    ])

    const newSpace = createResult.rows[0]
    console.log('Default space created successfully:', newSpace.name)
    console.log('Space ID:', newSpace.id)
    console.log('Created by:', adminUser.name || adminUser.email)

    // Check space members
    const memberResult = await client.query(`
      SELECT * FROM public.space_members WHERE space_id = $1
    `, [newSpace.id])

    console.log('Space members:', memberResult.rows)

  } catch (error) {
    console.error('Unexpected error:', error)
    throw error
  } finally {
    client.release()
  }
}

// Run the script
if (require.main === module) {
  createDefaultSpace()
    .then(() => {
      console.log('✅ Default space creation completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Default space creation failed:', error)
      process.exit(1)
    })
}
