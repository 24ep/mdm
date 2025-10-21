const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management'
});

async function checkAndFixDataRecordsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking data_records table structure...');
    
    // Check what columns exist in data_records table
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'data_records'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Current data_records table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if name column exists
    const nameColumn = columns.rows.find(col => col.column_name === 'name');
    if (!nameColumn) {
      console.log('\n➕ Adding name column to data_records table...');
      await client.query(`ALTER TABLE data_records ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT ''`);
      console.log('✅ name column added');
    } else {
      console.log('✅ name column already exists');
    }
    
    // Check if other required columns exist
    const requiredColumns = ['created_at', 'updated_at', 'created_by'];
    for (const colName of requiredColumns) {
      const col = columns.rows.find(c => c.column_name === colName);
      if (!col) {
        console.log(`\n➕ Adding ${colName} column to data_records table...`);
        if (colName === 'created_by') {
          await client.query(`ALTER TABLE data_records ADD COLUMN created_by UUID REFERENCES users(id)`);
        } else {
          await client.query(`ALTER TABLE data_records ADD COLUMN ${colName} TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
        }
        console.log(`✅ ${colName} column added`);
      } else {
        console.log(`✅ ${colName} column already exists`);
      }
    }
    
    // Show final table structure
    console.log('\n📊 Final data_records table structure:');
    const finalColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'data_records'
      ORDER BY ordinal_position
    `);
    
    finalColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('\n✅ data_records table fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error checking/fixing data_records table:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await checkAndFixDataRecordsTable();
    console.log('🎉 data_records table check complete!');
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
