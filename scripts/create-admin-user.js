const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const { randomUUID } = require('crypto')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

if (!process.env.DATABASE_URL) {
  console.error('Missing required DATABASE_URL environment variable')
  process.exit(1)
}

async function createAdminUser() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Creating admin user...')

    // Check if admin user already exists
    const existingUser = await client.query(`
      SELECT * FROM public.users 
      WHERE email = $1 OR role IN ('SUPER_ADMIN', 'ADMIN')
      LIMIT 1
    `, ['admin@example.com'])

    if (existingUser.rows.length > 0) {
      console.log(`✅ Admin user already exists: ${existingUser.rows[0].email} (Role: ${existingUser.rows[0].role})`)
      return existingUser.rows[0]
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12)

    // Create admin user
    const userId = randomUUID()
    const result = await client.query(`
      INSERT INTO public.users (id, email, name, password, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [
      userId,
      'admin@example.com',
      'Admin User',
      hashedPassword,
      'ADMIN'
    ])

    const adminUser = result.rows[0]
    console.log(`✅ Created admin user:`)
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Password: admin123`)
    console.log(`   Role: ${adminUser.role}`)
    console.log(`   ID: ${adminUser.id}`)

    return adminUser

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    throw error
  } finally {
    client.release()
  }
}

// Run the script
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('✅ Admin user creation completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Admin user creation failed:', error)
      process.exit(1)
    })
}

module.exports = { createAdminUser }

