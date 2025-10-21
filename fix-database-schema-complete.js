const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management'
});

async function fixDatabaseSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing complete database schema...');
    
    // 1. Fix space_members table
    console.log('\n👥 Fixing space_members table...');
    const spaceMembersColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'space_members' 
      AND column_name IN ('created_at', 'updated_at')
    `);
    
    const existingSpaceMembersColumns = spaceMembersColumns.rows.map(row => row.column_name);
    
    if (!existingSpaceMembersColumns.includes('created_at')) {
      console.log('➕ Adding created_at column to space_members...');
      await client.query(`ALTER TABLE space_members ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
    }
    
    if (!existingSpaceMembersColumns.includes('updated_at')) {
      console.log('➕ Adding updated_at column to space_members...');
      await client.query(`ALTER TABLE space_members ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
    }
    
    // 2. Fix attributes table
    console.log('\n🏷️ Fixing attributes table...');
    const attributesColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attributes' 
      AND column_name IN ('description', 'is_required', 'validation_rules', 'display_order', 'code')
    `);
    
    const existingAttributesColumns = attributesColumns.rows.map(row => row.column_name);
    
    if (!existingAttributesColumns.includes('code')) {
      console.log('➕ Adding code column to attributes...');
      await client.query(`ALTER TABLE attributes ADD COLUMN code VARCHAR(255) NOT NULL DEFAULT ''`);
    }
    
    if (!existingAttributesColumns.includes('description')) {
      console.log('➕ Adding description column to attributes...');
      await client.query(`ALTER TABLE attributes ADD COLUMN description TEXT`);
    }
    
    if (!existingAttributesColumns.includes('is_required')) {
      console.log('➕ Adding is_required column to attributes...');
      await client.query(`ALTER TABLE attributes ADD COLUMN is_required BOOLEAN DEFAULT false`);
    }
    
    if (!existingAttributesColumns.includes('validation_rules')) {
      console.log('➕ Adding validation_rules column to attributes...');
      await client.query(`ALTER TABLE attributes ADD COLUMN validation_rules JSONB`);
    }
    
    if (!existingAttributesColumns.includes('display_order')) {
      console.log('➕ Adding display_order column to attributes...');
      await client.query(`ALTER TABLE attributes ADD COLUMN display_order INTEGER DEFAULT 0`);
    }
    
    // 3. Fix data_records table
    console.log('\n📊 Fixing data_records table...');
    const dataRecordsColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'data_records' 
      AND column_name IN ('created_at', 'updated_at', 'created_by')
    `);
    
    const existingDataRecordsColumns = dataRecordsColumns.rows.map(row => row.column_name);
    
    if (!existingDataRecordsColumns.includes('created_at')) {
      console.log('➕ Adding created_at column to data_records...');
      await client.query(`ALTER TABLE data_records ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
    }
    
    if (!existingDataRecordsColumns.includes('updated_at')) {
      console.log('➕ Adding updated_at column to data_records...');
      await client.query(`ALTER TABLE data_records ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
    }
    
    if (!existingDataRecordsColumns.includes('created_by')) {
      console.log('➕ Adding created_by column to data_records...');
      await client.query(`ALTER TABLE data_records ADD COLUMN created_by UUID REFERENCES users(id)`);
    }
    
    // 4. Fix data_record_values table
    console.log('\n📝 Fixing data_record_values table...');
    const dataRecordValuesColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'data_record_values' 
      AND column_name IN ('created_at', 'updated_at')
    `);
    
    const existingDataRecordValuesColumns = dataRecordValuesColumns.rows.map(row => row.column_name);
    
    if (!existingDataRecordValuesColumns.includes('created_at')) {
      console.log('➕ Adding created_at column to data_record_values...');
      await client.query(`ALTER TABLE data_record_values ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
    }
    
    if (!existingDataRecordValuesColumns.includes('updated_at')) {
      console.log('➕ Adding updated_at column to data_record_values...');
      await client.query(`ALTER TABLE data_record_values ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
    }
    
    // 5. Fix attribute_options table
    console.log('\n🔧 Fixing attribute_options table...');
    const attributeOptionsColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attribute_options' 
      AND column_name IN ('created_at', 'updated_at', 'display_order')
    `);
    
    const existingAttributeOptionsColumns = attributeOptionsColumns.rows.map(row => row.column_name);
    
    if (!existingAttributeOptionsColumns.includes('created_at')) {
      console.log('➕ Adding created_at column to attribute_options...');
      await client.query(`ALTER TABLE attribute_options ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
    }
    
    if (!existingAttributeOptionsColumns.includes('updated_at')) {
      console.log('➕ Adding updated_at column to attribute_options...');
      await client.query(`ALTER TABLE attribute_options ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
    }
    
    if (!existingAttributeOptionsColumns.includes('display_order')) {
      console.log('➕ Adding display_order column to attribute_options...');
      await client.query(`ALTER TABLE attribute_options ADD COLUMN display_order INTEGER DEFAULT 0`);
    }
    
    // 6. Fix data_model_spaces table
    console.log('\n🔗 Fixing data_model_spaces table...');
    const dataModelSpacesColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'data_model_spaces' 
      AND column_name IN ('created_at', 'updated_at')
    `);
    
    const existingDataModelSpacesColumns = dataModelSpacesColumns.rows.map(row => row.column_name);
    
    if (!existingDataModelSpacesColumns.includes('created_at')) {
      console.log('➕ Adding created_at column to data_model_spaces...');
      await client.query(`ALTER TABLE data_model_spaces ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
    }
    
    if (!existingDataModelSpacesColumns.includes('updated_at')) {
      console.log('➕ Adding updated_at column to data_model_spaces...');
      await client.query(`ALTER TABLE data_model_spaces ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
    }
    
    console.log('\n✅ Database schema fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database schema:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await fixDatabaseSchema();
    console.log('🎉 Database schema fix complete!');
  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
