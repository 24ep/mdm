const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixDataModelsTable() {
  console.log('🔧 Fixing Data Models Table Structure');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    maxUses: 7500,
  });

  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connection successful!');
    
    // Check current data_models table structure
    console.log('\n🔍 Current data_models table columns:');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'data_models' 
      ORDER BY ordinal_position
    `);
    
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check for missing columns that might be needed
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    const requiredColumns = [
      'sort_order',
      'is_active',
      'created_at',
      'updated_at',
      'deleted_at'
    ];
    
    console.log('\n🔍 Checking for missing columns:');
    const missingColumns = [];
    
    for (const column of requiredColumns) {
      const exists = existingColumns.includes(column);
      console.log(`  ${exists ? '✅' : '❌'} ${column}`);
      if (!exists) {
        missingColumns.push(column);
      }
    }
    
    if (missingColumns.length > 0) {
      console.log('\n🔧 Adding missing columns...');
      
      // Add sort_order column
      if (missingColumns.includes('sort_order')) {
        console.log('Adding sort_order column...');
        await client.query(`
          ALTER TABLE data_models 
          ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
        `);
        console.log('✅ sort_order column added');
      }
      
      // Add is_active column
      if (missingColumns.includes('is_active')) {
        console.log('Adding is_active column...');
        await client.query(`
          ALTER TABLE data_models 
          ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
        `);
        console.log('✅ is_active column added');
      }
      
      // Add created_at column
      if (missingColumns.includes('created_at')) {
        console.log('Adding created_at column...');
        await client.query(`
          ALTER TABLE data_models 
          ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()
        `);
        console.log('✅ created_at column added');
      }
      
      // Add updated_at column
      if (missingColumns.includes('updated_at')) {
        console.log('Adding updated_at column...');
        await client.query(`
          ALTER TABLE data_models 
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
        `);
        console.log('✅ updated_at column added');
      }
      
      // Add deleted_at column
      if (missingColumns.includes('deleted_at')) {
        console.log('Adding deleted_at column...');
        await client.query(`
          ALTER TABLE data_models 
          ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ
        `);
        console.log('✅ deleted_at column added');
      }
      
      console.log('\n✅ All missing columns added successfully!');
      
    } else {
      console.log('\n✅ All required columns exist!');
    }
    
    // Verify final structure
    console.log('\n🔍 Final data_models table structure:');
    const finalColumnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'data_models' 
      ORDER BY ordinal_position
    `);
    
    finalColumnsResult.rows.forEach(col => {
      console.log(`  ✅ ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Test the table with a sample query
    console.log('\n🧪 Testing data_models table...');
    try {
      const testResult = await client.query(`
        SELECT id, name, sort_order, is_active, created_at, updated_at
        FROM data_models 
        LIMIT 1
      `);
      
      if (testResult.rows.length > 0) {
        console.log('✅ data_models table query successful');
        console.log('Sample record:', testResult.rows[0]);
      } else {
        console.log('⚠️  No data models found, but table structure is correct');
      }
    } catch (error) {
      console.log('❌ Error testing table:', error.message);
    }
    
    client.release();
    console.log('\n✅ Data models table structure fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

fixDataModelsTable();
