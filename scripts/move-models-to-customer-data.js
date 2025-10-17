const { Pool } = require('pg')
require('dotenv').config()

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres'
const pool = new Pool({ connectionString: databaseUrl })

async function main() {
  const client = await pool.connect()
  try {
    // First, get the customer-data space ID
    const spaceResult = await client.query(`
      SELECT id FROM spaces WHERE slug = 'customer-data'
    `)
    
    if (spaceResult.rows.length === 0) {
      console.error('Error: customer-data space not found')
      return
    }
    
    const customerDataSpaceId = spaceResult.rows[0].id
    console.log(`Found customer-data space with ID: ${customerDataSpaceId}`)
    
    // Move all data models from default space to customer-data space
    const updateResult = await client.query(`
      UPDATE data_models 
      SET space_id = $1 
      WHERE space_id = (
        SELECT id FROM spaces WHERE slug = 'default-space'
      )
    `, [customerDataSpaceId])
    
    console.log(`Successfully moved ${updateResult.rowCount} data models to customer-data space`)
    
    // Verify the move
    const verifyResult = await client.query(`
      SELECT dm.id, dm.name, dm.display_name, s.slug as space_slug
      FROM data_models dm
      JOIN spaces s ON s.id = dm.space_id
      WHERE s.slug = 'customer-data'
      ORDER BY dm.name
    `)
    
    console.log('\nData models now in customer-data space:')
    console.table(verifyResult.rows)
    
  } catch (e) {
    console.error('Error:', e)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
