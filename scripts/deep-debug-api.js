#!/usr/bin/env node

/**
 * Deep debug of API endpoints to find root cause of 0 records
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function deepDebugAPI() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Deep debugging API endpoints...');
    
    const modelId = '3bf5084c-14a6-4e8d-a41b-625f136dbd2d';
    
    // Step 1: Test server connectivity
    console.log('\n🌐 Step 1: Testing server connectivity...');
    try {
      const response = await fetch('http://localhost:3000/');
      console.log(`✅ Server status: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`❌ Server error: ${error.message}`);
      return;
    }
    
    // Step 2: Test data-records API
    console.log('\n🌐 Step 2: Testing data-records API...');
    try {
      const url = `http://localhost:3000/api/data-records?data_model_id=${modelId}&page=1&limit=20`;
      console.log(`📡 Calling: ${url}`);
      
      const response = await fetch(url);
      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);
      
      const text = await response.text();
      console.log(`📊 Response length: ${text.length} characters`);
      
      if (response.status === 200) {
        try {
          const data = JSON.parse(text);
          console.log('✅ JSON response received:');
          console.log(`   Records: ${data.records?.length || 0}`);
          console.log(`   Total: ${data.pagination?.total || 0}`);
          console.log(`   Pages: ${data.pagination?.pages || 0}`);
          
          if (data.records && data.records.length > 0) {
            console.log('📝 Sample record:');
            const sample = data.records[0];
            console.log(`   ID: ${sample.id}`);
            console.log(`   Values: ${Object.keys(sample.values || {}).length} attributes`);
          }
        } catch (parseError) {
          console.log('❌ JSON parse error:', parseError.message);
          console.log('📄 Response preview:', text.substring(0, 200));
        }
      } else {
        console.log('❌ API returned error status');
        console.log('📄 Response preview:', text.substring(0, 200));
      }
    } catch (error) {
      console.log(`❌ API call error: ${error.message}`);
    }
    
    // Step 3: Test data-models API
    console.log('\n🌐 Step 3: Testing data-models API...');
    try {
      const url = `http://localhost:3000/api/data-models/${modelId}`;
      console.log(`📡 Calling: ${url}`);
      
      const response = await fetch(url);
      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          console.log('✅ Data model API response:');
          console.log(`   Model: ${data.dataModel?.display_name}`);
        } catch (parseError) {
          console.log('❌ JSON parse error:', parseError.message);
          console.log('📄 Response preview:', text.substring(0, 200));
        }
      }
    } catch (error) {
      console.log(`❌ Data model API error: ${error.message}`);
    }
    
    // Step 4: Test attributes API
    console.log('\n🌐 Step 4: Testing attributes API...');
    try {
      const url = `http://localhost:3000/api/data-models/${modelId}/attributes`;
      console.log(`📡 Calling: ${url}`);
      
      const response = await fetch(url);
      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          console.log('✅ Attributes API response:');
          console.log(`   Attributes: ${data.attributes?.length || 0}`);
        } catch (parseError) {
          console.log('❌ JSON parse error:', parseError.message);
          console.log('📄 Response preview:', text.substring(0, 200));
        }
      }
    } catch (error) {
      console.log(`❌ Attributes API error: ${error.message}`);
    }
    
    // Step 5: Direct database verification
    console.log('\n🗄️ Step 5: Direct database verification...');
    try {
      // Test the exact query from the API
      const query = `
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
      
      const result = await client.query(query, [modelId, 20, 0]);
      console.log(`✅ Direct DB query result: ${result.rows.length} records`);
      
      if (result.rows.length > 0) {
        const sample = result.rows[0];
        console.log('📝 Sample record from DB:');
        console.log(`   ID: ${sample.id}`);
        console.log(`   Created: ${sample.created_at}`);
        console.log(`   Values: ${Object.keys(sample.values || {}).length} attributes`);
        
        const values = sample.values || {};
        const sampleKeys = Object.keys(values).slice(0, 3);
        console.log('   Sample values:');
        sampleKeys.forEach(key => {
          console.log(`     ${key}: ${values[key]}`);
        });
      }
    } catch (error) {
      console.log(`❌ Direct DB query error: ${error.message}`);
    }
    
    // Step 6: Check middleware and authentication
    console.log('\n🔐 Step 6: Checking authentication status...');
    try {
      const response = await fetch('http://localhost:3000/api/debug/session-test');
      console.log(`📊 Session test status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        const data = await response.json();
        console.log('✅ Session test response:', data);
      }
    } catch (error) {
      console.log(`❌ Session test error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Deep debug error:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Run the deep debug
if (require.main === module) {
  deepDebugAPI()
    .then(() => {
      console.log('\n🎉 Deep debug completed!');
    })
    .catch((error) => {
      console.error('❌ Deep debug failed:', error);
      process.exit(1);
    });
}

module.exports = { deepDebugAPI };
