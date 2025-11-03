const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function checkSpaceMembership() {
  const client = await pool.connect()
  
  try {
    // Get the Customer Data space
    const spaceResult = await client.query(`
      SELECT s.id, s.name, s.slug 
      FROM spaces s 
      WHERE s.slug = 'customer-data' OR s.name = 'Customer Data'
      LIMIT 1
    `)

    if (spaceResult.rows.length === 0) {
      console.log('❌ Customer Data space not found')
      return
    }

    const space = spaceResult.rows[0]
    console.log(`✅ Found space: ${space.name} (${space.id})`)

    // Check members
    const membersResult = await client.query(`
      SELECT sm.*, u.email, u.name, u.role as user_role
      FROM space_members sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.space_id = $1
    `, [space.id])

    console.log(`\n👥 Members (${membersResult.rows.length}):`)
    if (membersResult.rows.length === 0) {
      console.log('  ⚠️  No members found! This is the problem.')
      
      // Get admin user
      const adminResult = await client.query(`
        SELECT * FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN') LIMIT 1
      `)

      if (adminResult.rows.length > 0) {
        const admin = adminResult.rows[0]
        console.log(`\n➕ Adding admin user as member...`)
        
        await client.query(`
          INSERT INTO space_members (id, space_id, user_id, role)
          VALUES (gen_random_uuid(), $1, $2, 'ADMIN')
          ON CONFLICT (space_id, user_id) DO NOTHING
        `, [space.id, admin.id])

        console.log(`✅ Added ${admin.email} as ADMIN member`)
      }
    } else {
      membersResult.rows.forEach(member => {
        console.log(`  - ${member.email || member.user_id} (${member.role})`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

checkSpaceMembership()

