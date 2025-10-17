const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

// Use the database URL from environment or default to local Supabase
const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres'

const pool = new Pool({
  connectionString: databaseUrl,
})

async function applyMigration() {
  const client = await pool.connect()
  
  try {
    console.log('Applying spaces migration...')

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '022_spaces_system.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Execute the migration
    await client.query(migrationSQL)

    console.log('Spaces migration applied successfully!')

  } catch (error) {
    console.error('Error applying migration:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

// Run the script
applyMigration()
