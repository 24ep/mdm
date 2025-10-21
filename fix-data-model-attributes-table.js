require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management'
});

async function fixDataModelAttributesTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing data_model_attributes table structure');
    console.log('===============================================');
    
    // 1. Check current structure of data_model_attributes
    console.log('\n📊 Checking data_model_attributes table structure...');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'data_model_attributes'
      ORDER BY ordinal_position
    `);
    
    console.log('Current data_model_attributes columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 2. Check what columns the API expects
    const requiredColumns = [
      'id', 'name', 'display_name', 'type', 'data_type', 'is_required', 
      'is_unique', 'default_value', 'validation', 'options', 'order', 
      'is_active', 'created_at', 'updated_at', 'deleted_at'
    ];
    
    const existingColumns = columns.rows.map(row => row.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    console.log(`\n🔍 Missing columns: ${missingColumns.length}`);
    missingColumns.forEach(col => console.log(`  - ${col}`));
    
    // 3. Add missing columns
    if (missingColumns.length > 0) {
      console.log('\n➕ Adding missing columns...');
      
      for (const col of missingColumns) {
        try {
          let alterStatement = '';
          if (col === 'name') {
            alterStatement = `ALTER TABLE data_model_attributes ADD COLUMN name VARCHAR(255)`;
          } else if (col === 'display_name') {
            alterStatement = `ALTER TABLE data_model_attributes ADD COLUMN display_name VARCHAR(255)`;
          } else if (col === 'type') {
            alterStatement = `ALTER TABLE data_model_attributes ADD COLUMN type VARCHAR(50)`;
          } else if (col === 'data_type') {
            alterStatement = `ALTER TABLE data_model_attributes ADD COLUMN data_type VARCHAR(50)`;
          } else if (col === 'is_required') {
            alterStatement = `ALTER TABLE data_model_attributes ADD COLUMN is_required BOOLEAN DEFAULT false`;
          } else if (col === 'is_unique') {
            alterStatement = `ALTER TABLE data_model_attributes ADD COLUMN is_unique BOOLEAN DEFAULT false`;
          } else if (col === 'default_value') {
            alterStatement = `ALTER TABLE data_model_attributes ADD COLUMN default_value TEXT`;
          } else if (col === 'validation') {
            alterStatement = `ALTER TABLE data_model_attributes ADD COLUMN validation JSONB`;
          } else if (col === 'options') {
            alterStatement = `ALTER TABLE data_model_attributes ADD COLUMN options JSONB`;
          } else if (col === 'order') {
            alterStatement = `ALTER TABLE data_model_attributes ADD COLUMN "order" INTEGER DEFAULT 0`;
          } else if (col === 'is_active') {
            alterStatement = `ALTER TABLE data_model_attributes ADD COLUMN is_active BOOLEAN DEFAULT true`;
          } else if (col === 'created_at') {
            alterStatement = `ALTER TABLE data_model_attributes ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;
          } else if (col === 'updated_at') {
            alterStatement = `ALTER TABLE data_model_attributes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;
          } else if (col === 'deleted_at') {
            alterStatement = `ALTER TABLE data_model_attributes ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE`;
          }
          
          if (alterStatement) {
            await client.query(alterStatement);
            console.log(`  ✅ Added column: ${col}`);
          }
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`  ✅ Column ${col} already exists`);
          } else {
            console.log(`  ❌ Error adding ${col}: ${error.message}`);
          }
        }
      }
    }
    
    // 4. Check if we have data in attributes table to migrate
    console.log('\n🔄 Checking for data to migrate...');
    const attributesCount = await client.query(`
      SELECT COUNT(*) as count FROM attributes
    `);
    
    const dataModelAttributesCount = await client.query(`
      SELECT COUNT(*) as count FROM data_model_attributes
    `);
    
    console.log(`📊 Attributes table: ${attributesCount.rows[0].count} records`);
    console.log(`📊 data_model_attributes table: ${dataModelAttributesCount.rows[0].count} records`);
    
    // 5. Migrate data if needed
    if (parseInt(attributesCount.rows[0].count) > 0 && parseInt(dataModelAttributesCount.rows[0].count) === 0) {
      console.log('\n📦 Migrating data from attributes to data_model_attributes...');
      
      const attributes = await client.query(`
        SELECT id, name, code, type, description, is_required, display_order, data_model_id, created_at, updated_at
        FROM attributes
        ORDER BY data_model_id, display_order
      `);
      
      for (const attr of attributes.rows) {
        try {
          await client.query(`
            INSERT INTO data_model_attributes (
              id, data_model_id, name, display_name, type, data_type, 
              is_required, is_unique, default_value, validation, options, 
              "order", is_active, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
            )
          `, [
            attr.id,
            attr.data_model_id,
            attr.name,
            attr.name, // display_name same as name
            attr.type,
            attr.type, // data_type same as type
            attr.is_required || false,
            false, // is_unique
            null, // default_value
            null, // validation
            null, // options
            attr.display_order || 0,
            true, // is_active
            attr.created_at,
            attr.updated_at
          ]);
          
          console.log(`  ✅ Migrated: ${attr.name}`);
        } catch (error) {
          console.log(`  ❌ Error migrating ${attr.name}: ${error.message}`);
        }
      }
    }
    
    // 6. Test the API query
    console.log('\n🔍 Testing API query...');
    const customerSpace = await client.query(`
      SELECT id FROM spaces WHERE slug = 'customer-data-management'
    `);
    
    if (customerSpace.rows.length > 0) {
      const spaceId = customerSpace.rows[0].id;
      const dataModel = await client.query(`
        SELECT id FROM data_models WHERE space_id = $1
      `, [spaceId]);
      
      if (dataModel.rows.length > 0) {
        const dataModelId = dataModel.rows[0].id;
        console.log(`Testing API query for data model: ${dataModelId}`);
        
        try {
          const apiQuery = await client.query(`
            SELECT 
              id,
              name,
              display_name,
              type as data_type,
              type,
              is_required,
              is_unique,
              default_value,
              validation as validation_rules,
              options,
              "order" as order_index,
              created_at,
              updated_at
            FROM data_model_attributes
            WHERE data_model_id = $1
              AND (deleted_at IS NULL OR deleted_at IS NULL)
            ORDER BY "order" ASC, created_at ASC
          `, [dataModelId]);
          
          console.log(`✅ API query returns ${apiQuery.rows.length} attributes`);
          if (apiQuery.rows.length > 0) {
            console.log('Sample attributes:');
            apiQuery.rows.slice(0, 3).forEach(attr => {
              console.log(`  - ${attr.name} (${attr.type}) - Required: ${attr.is_required}`);
            });
          } else {
            console.log('❌ No attributes found in API query');
          }
        } catch (error) {
          console.log(`❌ API query error: ${error.message}`);
        }
      }
    }
    
    console.log('\n🎉 data_model_attributes table fix complete!');
    console.log('The attributes should now be visible in the UI.');
    
  } catch (error) {
    console.error('❌ Error fixing data_model_attributes table:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await fixDataModelAttributesTable();
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
