require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management'
});

async function checkTablesAndFixAPI() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking Database Tables and Fixing API');
    console.log('==========================================');
    
    // 1. Check what tables exist
    console.log('\n📊 Checking existing tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%attribute%' OR table_name LIKE '%data_model%'
      ORDER BY table_name
    `);
    
    console.log('Found tables:');
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // 2. Check if data_model_attributes table exists
    const dataModelAttributesExists = tables.rows.some(row => row.table_name === 'data_model_attributes');
    console.log(`\n📋 data_model_attributes table exists: ${dataModelAttributesExists}`);
    
    // 3. Check attributes table structure
    console.log('\n🏷️ Checking attributes table structure...');
    const attributesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'attributes'
      ORDER BY ordinal_position
    `);
    
    console.log('Attributes table columns:');
    attributesColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 4. Check if we need to create data_model_attributes table
    if (!dataModelAttributesExists) {
      console.log('\n🔧 Creating data_model_attributes table...');
      await client.query(`
        CREATE TABLE data_model_attributes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          data_model_id UUID NOT NULL REFERENCES data_models(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          display_name VARCHAR(255),
          type VARCHAR(50) NOT NULL,
          data_type VARCHAR(50),
          is_required BOOLEAN DEFAULT false,
          is_unique BOOLEAN DEFAULT false,
          default_value TEXT,
          validation JSONB,
          options JSONB,
          "order" INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          deleted_at TIMESTAMP WITH TIME ZONE
        )
      `);
      console.log('✅ data_model_attributes table created');
    }
    
    // 5. Migrate data from attributes to data_model_attributes
    console.log('\n🔄 Migrating data from attributes to data_model_attributes...');
    
    // Check if data_model_attributes is empty
    const existingDataModelAttributes = await client.query(`
      SELECT COUNT(*) as count FROM data_model_attributes
    `);
    
    if (parseInt(existingDataModelAttributes.rows[0].count) === 0) {
      console.log('📦 Migrating attributes to data_model_attributes...');
      
      const attributes = await client.query(`
        SELECT id, name, code, type, description, is_required, display_order, data_model_id, created_at, updated_at
        FROM attributes
        ORDER BY data_model_id, display_order
      `);
      
      for (const attr of attributes.rows) {
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
          attr.is_required,
          false, // is_unique
          null, // default_value
          null, // validation
          null, // options
          attr.display_order,
          true, // is_active
          attr.created_at,
          attr.updated_at
        ]);
      }
      
      console.log(`✅ Migrated ${attributes.rows.length} attributes to data_model_attributes`);
    } else {
      console.log('✅ data_model_attributes already has data');
    }
    
    // 6. Check the API query
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
        }
      }
    }
    
    console.log('\n🎉 Database and API fix complete!');
    console.log('The attributes should now be visible in the UI.');
    
  } catch (error) {
    console.error('❌ Error checking/fixing tables:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await checkTablesAndFixAPI();
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
