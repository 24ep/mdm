const { Pool } = require('pg')
require('dotenv').config()

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres'
const pool = new Pool({ connectionString: databaseUrl })

async function main() {
  const client = await pool.connect()
  try {
    console.log('Creating data_model_spaces junction table...')
    
    // Create junction table
    await client.query(`
      CREATE TABLE IF NOT EXISTS data_model_spaces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        data_model_id UUID NOT NULL REFERENCES data_models(id) ON DELETE CASCADE,
        space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES users(id),
        UNIQUE(data_model_id, space_id)
      )
    `)
    
    console.log('Creating indexes...')
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_data_model_spaces_data_model_id ON data_model_spaces(data_model_id)
    `)
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_data_model_spaces_space_id ON data_model_spaces(space_id)
    `)
    
    console.log('Migrating existing data_model.space_id to junction table...')
    
    // Migrate existing data
    const result = await client.query(`
      INSERT INTO data_model_spaces (data_model_id, space_id, created_at)
      SELECT id, space_id, created_at
      FROM data_models 
      WHERE space_id IS NOT NULL
      ON CONFLICT (data_model_id, space_id) DO NOTHING
    `)
    
    console.log(`Successfully migrated ${result.rowCount} data model associations`)
    
    // Verify the migration
    const verifyResult = await client.query(`
      SELECT 
        dm.name as model_name,
        s.slug as space_slug,
        s.name as space_name
      FROM data_model_spaces dms
      JOIN data_models dm ON dm.id = dms.data_model_id
      JOIN spaces s ON s.id = dms.space_id
      ORDER BY dm.name, s.name
    `)
    
    console.log('\nData model associations:')
    console.table(verifyResult.rows)
    
  } catch (e) {
    console.error('Error:', e)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
