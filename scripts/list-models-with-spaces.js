const { Pool } = require('pg')
require('dotenv').config()

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres'
const pool = new Pool({ connectionString: databaseUrl })

async function main() {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(`
      SELECT dm.id, dm.name, dm.display_name, dm.space_id,
             s.slug as space_slug, s.name as space_name, s.is_default
      FROM data_models dm
      LEFT JOIN spaces s ON s.id = dm.space_id
      ORDER BY s.is_default DESC, s.created_at ASC, dm.created_at ASC
    `)
    console.table(rows)
  } catch (e) {
    console.error('Error:', e)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
