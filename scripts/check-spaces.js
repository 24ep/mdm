const { Pool } = require('pg')
require('dotenv').config()

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres'
const pool = new Pool({ connectionString: databaseUrl })

async function main() {
  const client = await pool.connect()
  try {
    const { rows: spaces } = await client.query(`
      SELECT s.id, s.name, s.slug, s.is_default, s.created_at,
             COUNT(sm.user_id) as member_count
      FROM spaces s
      LEFT JOIN space_members sm ON sm.space_id = s.id
      WHERE s.deleted_at IS NULL
      GROUP BY s.id, s.name, s.slug, s.is_default, s.created_at
      ORDER BY s.is_default DESC, s.created_at ASC
    `)
    
    console.log('Spaces in database:')
    console.table(spaces)
    
    if (spaces.length === 0) {
      console.log('\nNo spaces found. You may need to create a space first.')
    }
    
  } catch (e) {
    console.error('Error:', e)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
