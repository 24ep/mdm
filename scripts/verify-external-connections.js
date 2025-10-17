const { Pool } = require('pg')
require('dotenv').config()

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres'
const pool = new Pool({ connectionString: databaseUrl })

async function main() {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'external_connections' 
      ORDER BY ordinal_position
    `)
    
    console.log('External connections table structure:')
    console.table(rows)
    
    // Also check if data_models has the new columns
    const { rows: dataModelCols } = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'data_models' 
      AND column_name IN ('source_type', 'external_connection_id', 'external_schema', 'external_table', 'external_primary_key')
      ORDER BY ordinal_position
    `)
    
    console.log('\nData models table - new columns:')
    console.table(dataModelCols)
    
  } catch (e) {
    console.error('Error:', e)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
