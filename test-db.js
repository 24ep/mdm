const { Pool } = require('pg');

async function testConnection() {
  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres';
  console.log('Testing connection to:', connectionString);
  
  const pool = new Pool({ connectionString });
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test if the model exists
    const result = await client.query('SELECT id, name, display_name FROM data_models WHERE id = $1', ['3bf5084c-14a6-4e8d-a41b-625f136dbd2d']);
    console.log('Model query result:', result.rows);
    
    // Test if there are any records
    const recordsResult = await client.query('SELECT COUNT(*) as count FROM data_records WHERE data_model_id = $1', ['3bf5084c-14a6-4e8d-a41b-625f136dbd2d']);
    console.log('Records count:', recordsResult.rows[0].count);
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
