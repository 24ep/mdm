const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management'
});

async function fixAllDatabaseIssues() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing all database issues...');
    
    // 1. Fix data_records table - add missing name column
    console.log('\n📊 Fixing data_records table...');
    const dataRecordsColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'data_records'
    `);
    
    const existingDataRecordsColumns = dataRecordsColumns.rows.map(row => row.column_name);
    
    if (!existingDataRecordsColumns.includes('name')) {
      console.log('➕ Adding name column to data_records...');
      await client.query(`ALTER TABLE data_records ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT ''`);
    }
    
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
    
    // 2. Fix space_members table
    console.log('\n👥 Fixing space_members table...');
    const spaceMembersColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'space_members'
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
    
    // 3. Fix attributes table
    console.log('\n🏷️ Fixing attributes table...');
    const attributesColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attributes'
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
    
    // 4. Create missing tables
    console.log('\n🔧 Creating missing tables...');
    
    // Create attribute_options table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attribute_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
        value VARCHAR(255) NOT NULL,
        label VARCHAR(255) NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(attribute_id, value)
      )
    `);
    console.log('✅ attribute_options table created/verified');
    
    // Create data_model_spaces table
    await client.query(`
      CREATE TABLE IF NOT EXISTS data_model_spaces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        data_model_id UUID NOT NULL REFERENCES data_models(id) ON DELETE CASCADE,
        space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(data_model_id, space_id)
      )
    `);
    console.log('✅ data_model_spaces table created/verified');
    
    // Create data_record_values table
    await client.query(`
      CREATE TABLE IF NOT EXISTS data_record_values (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        record_id UUID NOT NULL REFERENCES data_records(id) ON DELETE CASCADE,
        attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
        value TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(record_id, attribute_id)
      )
    `);
    console.log('✅ data_record_values table created/verified');
    
    console.log('\n✅ All database issues fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database issues:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await fixAllDatabaseIssues();
    console.log('🎉 Database fix complete!');
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
