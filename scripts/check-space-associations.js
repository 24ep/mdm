const { Pool } = require('pg')
require('dotenv').config()

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres'
const pool = new Pool({ connectionString: databaseUrl })

async function main() {
  const client = await pool.connect()
  try {
    const tables = ['data_models','assignments','customers','views','import_jobs','export_jobs']
    for (const table of tables) {
      const { rows } = await client.query(`
        SELECT COUNT(*)::int AS total,
               SUM(CASE WHEN space_id IS NULL THEN 1 ELSE 0 END)::int AS nulls
        FROM ${table}
      `)
      console.log(`${table}:`, rows[0])
    }
  } catch (e) {
    console.error('Error checking associations:', e)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
