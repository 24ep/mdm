#!/usr/bin/env node

/**
 * Test the entity page logic directly without authentication
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testEntityPageDirect() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing entity page logic directly...');
    
    const modelId = '3bf5084c-14a6-4e8d-a41b-625f136dbd2d';
    const page = 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    
    // Simulate the exact logic from the entity page
    console.log('📋 Step 1: Loading data model...');
    const modelResult = await client.query(`
      SELECT id, name, display_name, description 
      FROM public.data_models 
      WHERE id = $1
    `, [modelId]);
    
    if (modelResult.rows.length === 0) {
      console.log('❌ Data model not found!');
      return;
    }
    console.log('✅ Data model loaded:', modelResult.rows[0].display_name);
    
    console.log('📋 Step 2: Loading attributes...');
    const attrResult = await client.query(`
      SELECT id, name, display_name, type, options, "order"
      FROM public.data_model_attributes 
      WHERE data_model_id = $1
      ORDER BY "order"
    `, [modelId]);
    console.log(`✅ Attributes loaded: ${attrResult.rows.length} attributes`);
    
    console.log('📋 Step 3: Loading records...');
    const baseQuery = `
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
    
    const recordsResult = await client.query(baseQuery, [modelId, limit, offset]);
    console.log(`✅ Records loaded: ${recordsResult.rows.length} records`);
    
    // Count query
    const countQuery = `
      SELECT COUNT(DISTINCT dr.id)::int AS total 
      FROM public.data_records dr
      WHERE dr.data_model_id = $1 AND dr.is_active = TRUE
    `;
    const countResult = await client.query(countQuery, [modelId]);
    const total = countResult.rows[0]?.total || 0;
    
    console.log(`📊 Total records: ${total}`);
    console.log(`📊 Pages: ${Math.ceil(total / limit)}`);
    
    if (recordsResult.rows.length > 0) {
      console.log('\n📝 Sample records:');
      recordsResult.rows.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.id}`);
        console.log(`      Created: ${record.created_at}`);
        console.log(`      Values: ${Object.keys(record.values || {}).length} attributes`);
        
        // Show some key values
        const values = record.values || {};
        const firstName = values.first_name || 'N/A';
        const lastName = values.last_name || 'N/A';
        const visitorType = values.visitor_type || 'N/A';
        console.log(`      Name: ${firstName} ${lastName} (${visitorType})`);
      });
    }
    
    // Simulate the response that should be sent to the frontend
    const response = {
      records: recordsResult.rows || [],
      pagination: { 
        page, 
        limit, 
        total, 
        pages: Math.ceil(total / limit) 
      }
    };
    
    console.log('\n🎯 Frontend should receive:');
    console.log(`   Records: ${response.records.length}`);
    console.log(`   Total: ${response.pagination.total}`);
    console.log(`   Pages: ${response.pagination.pages}`);
    
    if (response.records.length === 0) {
      console.log('\n❌ PROBLEM: No records returned to frontend!');
      console.log('This explains why the entity page shows 0 records.');
    } else {
      console.log('\n✅ SUCCESS: Records are available for the frontend!');
      console.log('The issue must be with authentication or API routing.');
    }
    
  } catch (error) {
    console.error('❌ Error testing entity page directly:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Run the test
if (require.main === module) {
  testEntityPageDirect()
    .then(() => {
      console.log('\n🎉 Entity page direct test completed!');
    })
    .catch((error) => {
      console.error('❌ Entity page direct test failed:', error);
      process.exit(1);
    });
}

module.exports = { testEntityPageDirect };
