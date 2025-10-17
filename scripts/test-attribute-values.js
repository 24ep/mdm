#!/usr/bin/env node

/**
 * Test attribute values to see if they're being fetched correctly
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testAttributeValues() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing attribute values...');
    
    const modelId = '3bf5084c-14a6-4e8d-a41b-625f136dbd2d';
    
    // Test 1: Check if records exist
    console.log('\n📊 Step 1: Check records exist');
    const recordsResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM public.data_records 
      WHERE data_model_id = $1 AND is_active = TRUE
    `, [modelId]);
    console.log(`✅ Records count: ${recordsResult.rows[0].count}`);
    
    // Test 2: Check if attribute values exist
    console.log('\n📊 Step 2: Check attribute values exist');
    const valuesResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM public.data_record_values drv
      JOIN public.data_records dr ON drv.data_record_id = dr.id
      WHERE dr.data_model_id = $1 AND dr.is_active = TRUE
    `, [modelId]);
    console.log(`✅ Attribute values count: ${valuesResult.rows[0].count}`);
    
    // Test 3: Check attributes for the model
    console.log('\n📊 Step 3: Check model attributes');
    const attributesResult = await client.query(`
      SELECT id, name, display_name, type 
      FROM public.data_model_attributes 
      WHERE data_model_id = $1
      ORDER BY "order"
    `, [modelId]);
    console.log(`✅ Attributes count: ${attributesResult.rows.length}`);
    console.log('📝 First 5 attributes:');
    attributesResult.rows.slice(0, 5).forEach(attr => {
      console.log(`   ${attr.name} (${attr.display_name}) - ${attr.type}`);
    });
    
    // Test 4: Test the exact query from the API
    console.log('\n📊 Step 4: Test API query');
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
      const record = apiResult.rows[0];
      console.log('📝 Sample record:');
      console.log(`   ID: ${record.id}`);
      console.log(`   Created: ${record.created_at}`);
      console.log(`   Values type: ${typeof record.values}`);
      console.log(`   Values: ${JSON.stringify(record.values, null, 2)}`);
      console.log(`   Values keys: ${Object.keys(record.values || {}).length}`);
      
      if (record.values && Object.keys(record.values).length > 0) {
        console.log('📝 Attribute values:');
        Object.entries(record.values).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      } else {
        console.log('❌ No attribute values found!');
      }
    }
    
    // Test 5: Check individual attribute values
    console.log('\n📊 Step 5: Check individual attribute values');
    const individualResult = await client.query(`
      SELECT 
        dr.id as record_id,
        dma.name as attribute_name,
        drv.value as attribute_value
      FROM public.data_records dr
      JOIN public.data_record_values drv ON dr.id = drv.data_record_id
      JOIN public.data_model_attributes dma ON drv.attribute_id = dma.id
      WHERE dr.data_model_id = $1 AND dr.is_active = TRUE
      ORDER BY dr.created_at DESC
      LIMIT 10
    `, [modelId]);
    
    console.log(`✅ Individual values count: ${individualResult.rows.length}`);
    if (individualResult.rows.length > 0) {
      console.log('📝 Sample individual values:');
      individualResult.rows.slice(0, 5).forEach(row => {
        console.log(`   Record ${row.record_id}: ${row.attribute_name} = ${row.attribute_value}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing attribute values:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Run the test
if (require.main === module) {
  testAttributeValues()
    .then(() => {
      console.log('\n🎉 Attribute values test completed!');
    })
    .catch((error) => {
      console.error('❌ Attribute values test failed:', error);
      process.exit(1);
    });
}

module.exports = { testAttributeValues };
