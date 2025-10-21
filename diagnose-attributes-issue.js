require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management'
});

async function diagnoseAttributesIssue() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Diagnosing Attributes Issue');
    console.log('==============================');
    
    // 1. Check if customer space exists
    console.log('\n🏢 Checking Customer Space...');
    const spaces = await client.query(`
      SELECT id, name, slug, created_by FROM spaces WHERE slug = 'customer-data-management'
    `);
    
    if (spaces.rows.length === 0) {
      console.log('❌ Customer space not found!');
      return;
    }
    
    const customerSpace = spaces.rows[0];
    console.log(`✅ Found space: ${customerSpace.name} (ID: ${customerSpace.id})`);
    
    // 2. Check data models in the space
    console.log('\n📊 Checking Data Models...');
    const dataModels = await client.query(`
      SELECT id, name, description FROM data_models WHERE space_id = $1
    `, [customerSpace.id]);
    
    if (dataModels.rows.length === 0) {
      console.log('❌ No data models found in space!');
      return;
    }
    
    console.log(`✅ Found ${dataModels.rows.length} data model(s):`);
    dataModels.rows.forEach(dm => {
      console.log(`  - ${dm.name} (ID: ${dm.id})`);
    });
    
    // 3. Check attributes for each data model
    console.log('\n🏷️ Checking Attributes...');
    for (const dataModel of dataModels.rows) {
      const attributes = await client.query(`
        SELECT id, name, code, type, description, is_required, display_order, created_at
        FROM attributes WHERE data_model_id = $1
        ORDER BY display_order, name
      `, [dataModel.id]);
      
      console.log(`\n📋 Attributes for "${dataModel.name}":`);
      if (attributes.rows.length === 0) {
        console.log('  ❌ No attributes found!');
      } else {
        console.log(`  ✅ Found ${attributes.rows.length} attributes:`);
        attributes.rows.forEach(attr => {
          console.log(`    - ${attr.name} (${attr.type}) - Code: ${attr.code} - Required: ${attr.is_required}`);
        });
      }
      
      // Check attribute options
      const attributeOptions = await client.query(`
        SELECT ao.id, ao.value, ao.label, a.name as attribute_name
        FROM attribute_options ao
        JOIN attributes a ON ao.attribute_id = a.id
        WHERE a.data_model_id = $1
        ORDER BY a.display_order, ao.display_order
      `, [dataModel.id]);
      
      if (attributeOptions.rows.length > 0) {
        console.log(`  📋 Found ${attributeOptions.rows.length} attribute options:`);
        attributeOptions.rows.forEach(option => {
          console.log(`    - ${option.attribute_name}: ${option.value}`);
        });
      }
    }
    
    // 4. Check data model spaces linking
    console.log('\n🔗 Checking Data Model Spaces Linking...');
    const dataModelSpaces = await client.query(`
      SELECT dms.id, dm.name as data_model_name, s.name as space_name
      FROM data_model_spaces dms
      JOIN data_models dm ON dms.data_model_id = dm.id
      JOIN spaces s ON dms.space_id = s.id
      WHERE dms.space_id = $1
    `, [customerSpace.id]);
    
    if (dataModelSpaces.rows.length === 0) {
      console.log('❌ No data model spaces linking found!');
    } else {
      console.log(`✅ Found ${dataModelSpaces.rows.length} data model space links:`);
      dataModelSpaces.rows.forEach(link => {
        console.log(`  - ${link.data_model_name} linked to ${link.space_name}`);
      });
    }
    
    // 5. Check records
    console.log('\n👥 Checking Records...');
    for (const dataModel of dataModels.rows) {
      const records = await client.query(`
        SELECT id, name, created_at FROM data_records WHERE data_model_id = $1
      `, [dataModel.id]);
      
      console.log(`\n📝 Records for "${dataModel.name}":`);
      if (records.rows.length === 0) {
        console.log('  ❌ No records found!');
      } else {
        console.log(`  ✅ Found ${records.rows.length} records:`);
        records.rows.forEach(record => {
          console.log(`    - ${record.name} (Created: ${record.created_at})`);
        });
      }
    }
    
    // 6. Check the actual API query that the UI might be using
    console.log('\n🔍 Checking API Query Pattern...');
    const apiQuery = await client.query(`
      SELECT 
        a.id,
        a.name,
        a.code,
        a.type,
        a.description,
        a.is_required,
        a.display_order,
        dm.name as data_model_name,
        s.name as space_name
      FROM attributes a
      JOIN data_models dm ON a.data_model_id = dm.id
      JOIN spaces s ON dm.space_id = s.id
      WHERE s.slug = 'customer-data-management'
      ORDER BY a.display_order, a.name
    `);
    
    console.log(`\n📊 API Query Results (${apiQuery.rows.length} attributes):`);
    if (apiQuery.rows.length === 0) {
      console.log('❌ API query returns no attributes! This is likely the issue.');
    } else {
      console.log('✅ API query returns attributes:');
      apiQuery.rows.forEach(attr => {
        console.log(`  - ${attr.name} (${attr.type}) in ${attr.data_model_name} (${attr.space_name})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await diagnoseAttributesIssue();
    console.log('\n🎉 Diagnosis complete!');
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
