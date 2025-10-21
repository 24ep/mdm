const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management'
});

async function checkAndRecreateTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking all table structures...');
    
    // Check data_record_values table structure
    console.log('\n📝 Checking data_record_values table...');
    const dataRecordValuesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'data_record_values'
      ORDER BY ordinal_position
    `);
    
    console.log('Current data_record_values columns:');
    if (dataRecordValuesColumns.rows.length === 0) {
      console.log('  ❌ Table does not exist');
    } else {
      dataRecordValuesColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // Check data_records table structure
    console.log('\n📊 Checking data_records table...');
    const dataRecordsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'data_records'
      ORDER BY ordinal_position
    `);
    
    console.log('Current data_records columns:');
    dataRecordsColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Drop and recreate data_record_values table with correct structure
    console.log('\n🔧 Recreating data_record_values table...');
    await client.query(`DROP TABLE IF EXISTS data_record_values CASCADE`);
    await client.query(`
      CREATE TABLE data_record_values (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        record_id UUID NOT NULL REFERENCES data_records(id) ON DELETE CASCADE,
        attribute_id UUID NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
        value TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(record_id, attribute_id)
      )
    `);
    console.log('✅ data_record_values table recreated with correct structure');
    
    // Ensure data_records has all required columns
    console.log('\n🔧 Ensuring data_records has all required columns...');
    const requiredDataRecordsColumns = ['name', 'created_at', 'updated_at', 'created_by'];
    for (const colName of requiredDataRecordsColumns) {
      const col = dataRecordsColumns.rows.find(c => c.column_name === colName);
      if (!col) {
        console.log(`➕ Adding ${colName} column to data_records...`);
        if (colName === 'created_by') {
          await client.query(`ALTER TABLE data_records ADD COLUMN created_by UUID REFERENCES users(id)`);
        } else if (colName === 'name') {
          await client.query(`ALTER TABLE data_records ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT ''`);
        } else {
          await client.query(`ALTER TABLE data_records ADD COLUMN ${colName} TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
        }
        console.log(`✅ ${colName} column added`);
      } else {
        console.log(`✅ ${colName} column already exists`);
      }
    }
    
    // Ensure attributes has all required columns
    console.log('\n🏷️ Ensuring attributes has all required columns...');
    const attributesColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attributes'
    `);
    
    const existingAttributesColumns = attributesColumns.rows.map(row => row.column_name);
    const requiredAttributesColumns = ['code', 'description', 'is_required', 'validation_rules', 'display_order'];
    
    for (const colName of requiredAttributesColumns) {
      if (!existingAttributesColumns.includes(colName)) {
        console.log(`➕ Adding ${colName} column to attributes...`);
        if (colName === 'code') {
          await client.query(`ALTER TABLE attributes ADD COLUMN code VARCHAR(255) NOT NULL DEFAULT ''`);
        } else if (colName === 'description') {
          await client.query(`ALTER TABLE attributes ADD COLUMN description TEXT`);
        } else if (colName === 'is_required') {
          await client.query(`ALTER TABLE attributes ADD COLUMN is_required BOOLEAN DEFAULT false`);
        } else if (colName === 'validation_rules') {
          await client.query(`ALTER TABLE attributes ADD COLUMN validation_rules JSONB`);
        } else if (colName === 'display_order') {
          await client.query(`ALTER TABLE attributes ADD COLUMN display_order INTEGER DEFAULT 0`);
        }
        console.log(`✅ ${colName} column added`);
      } else {
        console.log(`✅ ${colName} column already exists`);
      }
    }
    
    // Ensure space_members has all required columns
    console.log('\n👥 Ensuring space_members has all required columns...');
    const spaceMembersColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'space_members'
    `);
    
    const existingSpaceMembersColumns = spaceMembersColumns.rows.map(row => row.column_name);
    const requiredSpaceMembersColumns = ['created_at', 'updated_at'];
    
    for (const colName of requiredSpaceMembersColumns) {
      if (!existingSpaceMembersColumns.includes(colName)) {
        console.log(`➕ Adding ${colName} column to space_members...`);
        await client.query(`ALTER TABLE space_members ADD COLUMN ${colName} TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
        console.log(`✅ ${colName} column added`);
      } else {
        console.log(`✅ ${colName} column already exists`);
      }
    }
    
    // Create missing tables
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
    
    console.log('\n✅ All tables fixed and ready!');
    
  } catch (error) {
    console.error('❌ Error checking/recreating tables:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await checkAndRecreateTables();
    console.log('🎉 Database tables check and fix complete!');
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
