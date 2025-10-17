#!/usr/bin/env node

/**
 * Debug API endpoints to find why entity page shows 0 records
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function debugAPIEndpoints() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging API endpoints...');
    
    const modelId = '3bf5084c-14a6-4e8d-a41b-625f136dbd2d';
    
    // Test 1: Check data model exists
    console.log('\n📋 Testing data model...');
    const modelResult = await client.query(`
      SELECT id, name, display_name, description 
      FROM public.data_models 
      WHERE id = $1
    `, [modelId]);
    
    if (modelResult.rows.length === 0) {
      console.log('❌ Data model not found!');
      return;
    }
    console.log('✅ Data model found:', modelResult.rows[0]);
    
    // Test 2: Check attributes
    console.log('\n📋 Testing attributes...');
    const attrResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM public.data_model_attributes 
      WHERE data_model_id = $1
    `, [modelId]);
    console.log(`✅ Attributes count: ${attrResult.rows[0].count}`);
    
    // Test 3: Check records
    console.log('\n📋 Testing records...');
    const recordsResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM public.data_records 
      WHERE data_model_id = $1 AND is_active = true
    `, [modelId]);
    console.log(`✅ Active records count: ${recordsResult.rows[0].count}`);
    
    // Test 4: Check record values
    console.log('\n📋 Testing record values...');
    const valuesResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM public.data_record_values drv
      JOIN public.data_records dr ON drv.data_record_id = dr.id
      WHERE dr.data_model_id = $1 AND dr.is_active = true
    `, [modelId]);
    console.log(`✅ Record values count: ${valuesResult.rows[0].count}`);
    
    // Test 5: Test the exact query from the API
    console.log('\n📋 Testing API query...');
    const apiQuery = `
      SELECT DISTINCT dr.*, 
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
      LIMIT $2 OFFSET $3
    `;
    
    const apiResult = await client.query(apiQuery, [modelId, 20, 0]);
    console.log(`✅ API query result: ${apiResult.rows.length} records`);
    
    if (apiResult.rows.length > 0) {
      const sample = apiResult.rows[0];
      console.log('📝 Sample record:');
      console.log(`   ID: ${sample.id}`);
      console.log(`   Created: ${sample.created_at}`);
      console.log(`   Values: ${Object.keys(sample.values || {}).length} attributes`);
      
      // Show some values
      const values = sample.values || {};
      const sampleKeys = Object.keys(values).slice(0, 5);
      console.log('   Sample values:');
      sampleKeys.forEach(key => {
        console.log(`     ${key}: ${values[key]}`);
      });
    }
    
    // Test 6: Test count query
    console.log('\n📋 Testing count query...');
    const countQuery = `
      SELECT COUNT(DISTINCT dr.id)::int AS total 
      FROM public.data_records dr
      WHERE dr.data_model_id = $1 AND dr.is_active = TRUE
    `;
    const countResult = await client.query(countQuery, [modelId]);
    console.log(`✅ Count query result: ${countResult.rows[0].total} total records`);
    
    // Test 7: Check if there are any issues with the data
    console.log('\n📋 Checking for data issues...');
    const issuesResult = await client.query(`
      SELECT 
        dr.id,
        dr.is_active,
        COUNT(drv.id) as value_count
      FROM public.data_records dr
      LEFT JOIN public.data_record_values drv ON dr.id = drv.data_record_id
      WHERE dr.data_model_id = $1
      GROUP BY dr.id, dr.is_active
      ORDER BY dr.created_at
    `, [modelId]);
    
    console.log('📊 Record details:');
    issuesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ID: ${row.id}, Active: ${row.is_active}, Values: ${row.value_count}`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging API:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Run the debug
if (require.main === module) {
  debugAPIEndpoints()
    .then(() => {
      console.log('\n🎉 API debug completed!');
    })
    .catch((error) => {
      console.error('❌ API debug failed:', error);
      process.exit(1);
    });
}

module.exports = { debugAPIEndpoints };
