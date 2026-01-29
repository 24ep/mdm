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
      WHERE email = $1
      LIMIT 1
    `, ['admin@example.com'])

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12)

      console.log(`✅ Admin user already exists. Updating password...`)

      const updatedUser = await client.query(`
        UPDATE public.users 
        SET password = $2, role = 'ADMIN', is_active = true, updated_at = NOW()
        WHERE email = $1
        RETURNING *
      `, ['admin@example.com', hashedPassword])

      console.log(`✅ Updated admin user password to: password123`)
      return updatedUser.rows[0]
    }

    // Create admin user
    const userId = randomUUID()
    const result = await client.query(`
      INSERT INTO public.users (id, email, name, password, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
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
    console.log(`   Password: password123`)
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

