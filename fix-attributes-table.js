const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management'
});

async function fixAttributesTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing attributes table schema...');
    
    // Check if description column exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attributes' AND column_name = 'description'
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log('➕ Adding description column to attributes table...');
      await client.query(`
        ALTER TABLE attributes 
        ADD COLUMN description TEXT
      `);
      console.log('✅ Description column added');
    } else {
      console.log('✅ Description column already exists');
    }
    
    // Check if other missing columns exist
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attributes' 
      AND column_name IN ('is_required', 'validation_rules', 'display_order')
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    
    if (!existingColumns.includes('is_required')) {
      console.log('➕ Adding is_required column...');
      await client.query(`ALTER TABLE attributes ADD COLUMN is_required BOOLEAN DEFAULT false`);
    }
    
    if (!existingColumns.includes('validation_rules')) {
      console.log('➕ Adding validation_rules column...');
      await client.query(`ALTER TABLE attributes ADD COLUMN validation_rules JSONB`);
    }
    
    if (!existingColumns.includes('display_order')) {
      console.log('➕ Adding display_order column...');
      await client.query(`ALTER TABLE attributes ADD COLUMN display_order INTEGER DEFAULT 0`);
    }
    
    console.log('✅ Attributes table schema fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing attributes table:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await fixAttributesTable();
    console.log('🎉 Database schema fixed successfully!');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
