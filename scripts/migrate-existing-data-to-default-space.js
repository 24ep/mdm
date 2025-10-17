const { Pool } = require('pg')
require('dotenv').config()

// Use the database URL from environment or default to local Supabase
const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres'

const pool = new Pool({
  connectionString: databaseUrl,
})

async function migrateExistingDataToDefaultSpace() {
  const client = await pool.connect()
  
  try {
    console.log('Migrating existing data to default space...')

    // Get the default space
    const spaceResult = await client.query(
      'SELECT * FROM spaces WHERE is_default = true AND deleted_at IS NULL'
    )

    if (spaceResult.rows.length === 0) {
      console.log('No default space found! Please create a default space first.')
      return
    }

    const defaultSpace = spaceResult.rows[0]
    console.log('Using default space:', defaultSpace.name, '(ID:', defaultSpace.id + ')')

    // Migrate data models that don't have a space_id
    const dataModelsResult = await client.query(
      'UPDATE data_models SET space_id = $1 WHERE space_id IS NULL AND deleted_at IS NULL RETURNING id, name',
      [defaultSpace.id]
    )
    console.log('Migrated data models:', dataModelsResult.rows.length)

    // Migrate assignments that don't have a space_id
    const assignmentsResult = await client.query(
      'UPDATE assignments SET space_id = $1 WHERE space_id IS NULL AND deleted_at IS NULL RETURNING id, title',
      [defaultSpace.id]
    )
    console.log('Migrated assignments:', assignmentsResult.rows.length)

    // Migrate customers that don't have a space_id
    const customersResult = await client.query(
      'UPDATE customers SET space_id = $1 WHERE space_id IS NULL AND deleted_at IS NULL RETURNING id, first_name, last_name',
      [defaultSpace.id]
    )
    console.log('Migrated customers:', customersResult.rows.length)

    // Migrate views that don't have a space_id
    const viewsResult = await client.query(
      'UPDATE views SET space_id = $1 WHERE space_id IS NULL AND deleted_at IS NULL RETURNING id, name',
      [defaultSpace.id]
    )
    console.log('Migrated views:', viewsResult.rows.length)

    // Migrate import jobs that don't have a space_id
    try {
      const importJobsResult = await client.query(
        'UPDATE import_jobs SET space_id = $1 WHERE space_id IS NULL RETURNING id, file_name',
        [defaultSpace.id]
      )
      console.log('Migrated import jobs:', importJobsResult.rows.length)
    } catch (error) {
      console.log('Import jobs table does not exist or no import jobs to migrate')
    }

    // Migrate export jobs that don't have a space_id
    try {
      const exportJobsResult = await client.query(
        'UPDATE export_jobs SET space_id = $1 WHERE space_id IS NULL RETURNING id, file_name',
        [defaultSpace.id]
      )
      console.log('Migrated export jobs:', exportJobsResult.rows.length)
    } catch (error) {
      console.log('Export jobs table does not exist or no export jobs to migrate')
    }

    // Check if workflows table exists and migrate it
    try {
      const workflowsResult = await client.query(
        'UPDATE workflows SET space_id = $1 WHERE space_id IS NULL RETURNING id, name',
        [defaultSpace.id]
      )
      console.log('Migrated workflows:', workflowsResult.rows.length)
    } catch (error) {
      console.log('Workflows table does not exist or no workflows to migrate')
    }

    console.log('\nMigration completed successfully!')
    console.log('All existing data has been assigned to the default space.')

  } catch (error) {
    console.error('Error during migration:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

// Run the script
migrateExistingDataToDefaultSpace()
