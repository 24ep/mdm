require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management'
});

async function fixAttributesMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing Attributes Migration');
    console.log('=============================');
    
    // 1. Check current data_model_attributes structure
    console.log('\n📊 Checking data_model_attributes structure...');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'data_model_attributes'
      ORDER BY ordinal_position
    `);
    
    console.log('data_model_attributes columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 2. Get attributes from the attributes table
    console.log('\n🏷️ Getting attributes from attributes table...');
    const attributes = await client.query(`
      SELECT id, name, code, type, description, is_required, display_order, data_model_id, created_at, updated_at
      FROM attributes
      ORDER BY data_model_id, display_order
    `);
    
    console.log(`Found ${attributes.rows.length} attributes to migrate`);
    
    // 3. Clear existing data_model_attributes
    console.log('\n🧹 Clearing existing data_model_attributes...');
    await client.query(`DELETE FROM data_model_attributes`);
    console.log('✅ Cleared existing data');
    
    // 4. Migrate attributes to data_model_attributes
    console.log('\n📦 Migrating attributes to data_model_attributes...');
    
    for (const attr of attributes.rows) {
      try {
        await client.query(`
          INSERT INTO data_model_attributes (
            id, data_model_id, attribute_id, name, display_name, type, data_type, 
            is_required, is_unique, default_value, validation, options, 
            "order", is_active, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
          )
        `, [
          attr.id, // id
          attr.data_model_id, // data_model_id
          attr.id, // attribute_id (same as id)
          attr.name, // name
          attr.name, // display_name (same as name)
          attr.type, // type
          attr.type, // data_type (same as type)
          attr.is_required || false, // is_required
          false, // is_unique
          null, // default_value
          null, // validation
          null, // options
          attr.display_order || 0, // order
          true, // is_active
          attr.created_at, // created_at
          attr.updated_at // updated_at
        ]);
        
        console.log(`  ✅ Migrated: ${attr.name}`);
      } catch (error) {
        console.log(`  ❌ Error migrating ${attr.name}: ${error.message}`);
      }
    }
    
    // 5. Verify migration
    console.log('\n🔍 Verifying migration...');
    const migratedCount = await client.query(`
      SELECT COUNT(*) as count FROM data_model_attributes
    `);
    console.log(`✅ Migrated ${migratedCount.rows[0].count} attributes`);
    
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
            apiQuery.rows.slice(0, 5).forEach(attr => {
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
    
    console.log('\n🎉 Attributes migration complete!');
    console.log('The attributes should now be visible in the UI.');
    
  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await fixAttributesMigration();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
