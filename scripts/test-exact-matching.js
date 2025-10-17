#!/usr/bin/env node

/**
 * Test exact attribute name matching
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testExactMatching() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing exact attribute name matching...');
    
    const modelId = '3bf5084c-14a6-4e8d-a41b-625f136dbd2d';
    
    // Get one record with all its values
    console.log('\n📊 Step 1: Get one record with all values');
    const recordResult = await client.query(`
      SELECT 
        dr.id,
        COALESCE(
          jsonb_object_agg(
            dma.name, 
            drv.value
          ) FILTER (WHERE drv.attribute_id IS NOT NULL), 
          '{}'::jsonb
        ) as values
      FROM public.data_records dr
      LEFT JOIN public.data_record_values drv ON dr.id = drv.data_record_id
      LEFT JOIN public.data_model_attributes dma ON drv.attribute_id = dma.id
      WHERE dr.data_model_id = $1 AND dr.is_active = TRUE
      GROUP BY dr.id
      ORDER BY dr.created_at DESC
      LIMIT 1
    `, [modelId]);
    
    if (recordResult.rows.length === 0) {
      console.log('❌ No records found');
      return;
    }
    
    const record = recordResult.rows[0];
    console.log(`✅ Record ID: ${record.id}`);
    console.log(`✅ Values count: ${Object.keys(record.values).length}`);
    
    // Get attributes for this model
    console.log('\n📊 Step 2: Get attributes for this model');
    const attributesResult = await client.query(`
      SELECT id, name, display_name, type 
      FROM public.data_model_attributes 
      WHERE data_model_id = $1
      ORDER BY "order"
    `, [modelId]);
    
    console.log(`✅ Attributes count: ${attributesResult.rows.length}`);
    
    // Test exact matching for first 10 attributes
    console.log('\n📊 Step 3: Test exact matching for first 10 attributes');
    const first10Attributes = attributesResult.rows.slice(0, 10);
    
    first10Attributes.forEach((attr, index) => {
      const value = record.values[attr.name];
      const hasValue = record.values.hasOwnProperty(attr.name);
      const valueType = typeof value;
      const isNull = value === null;
      const isUndefined = value === undefined;
      
      console.log(`   ${index + 1}. ${attr.name} (${attr.display_name}) - ${attr.type}`);
      console.log(`      Has value: ${hasValue}`);
      console.log(`      Value: ${value}`);
      console.log(`      Value type: ${valueType}`);
      console.log(`      Is null: ${isNull}`);
      console.log(`      Is undefined: ${isUndefined}`);
      console.log(`      Would show dash: ${!hasValue || isNull || isUndefined}`);
      console.log('');
    });
    
    // Test the exact query from the API
    console.log('\n📊 Step 4: Test exact API query');
    const apiQuery = `
      SELECT 
        dr.id,
        dr.data_model_id,
        dr.is_active,
        dr.created_at,
        dr.updated_at,
        dr.deleted_at,
        COALESCE(
          jsonb_object_agg(
            dma.name, 
            drv.value
          ) FILTER (WHERE drv.attribute_id IS NOT NULL), 
          '{}'::jsonb
        ) as values
      FROM public.data_records dr
      LEFT JOIN public.data_record_values drv ON dr.id = drv.data_record_id
      LEFT JOIN public.data_model_attributes dma ON drv.attribute_id = dma.id
      WHERE dr.data_model_id = $1 AND dr.is_active = TRUE
      GROUP BY dr.id, dr.data_model_id, dr.is_active, dr.created_at, dr.updated_at, dr.deleted_at
      ORDER BY dr.created_at DESC
      LIMIT 1
    `;
    
    const apiResult = await client.query(apiQuery, [modelId]);
    console.log(`✅ API query result: ${apiResult.rows.length} records`);
    
    if (apiResult.rows.length > 0) {
      const apiRecord = apiResult.rows[0];
      console.log(`✅ API record ID: ${apiRecord.id}`);
      console.log(`✅ API values count: ${Object.keys(apiRecord.values).length}`);
      
      // Test the same attributes against API result
      console.log('\n📊 Step 5: Test attributes against API result');
      first10Attributes.forEach((attr, index) => {
        const value = apiRecord.values[attr.name];
        const hasValue = apiRecord.values.hasOwnProperty(attr.name);
        
        console.log(`   ${index + 1}. ${attr.name}: ${value} (has: ${hasValue})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing exact matching:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Run the test
if (require.main === module) {
  testExactMatching()
    .then(() => {
      console.log('\n🎉 Exact matching test completed!');
    })
    .catch((error) => {
      console.error('❌ Exact matching test failed:', error);
      process.exit(1);
    });
}

module.exports = { testExactMatching };
