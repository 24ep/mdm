#!/usr/bin/env node

/**
 * Test the entity page by simulating the API calls it makes
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testEntityPage() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing entity page logic...');
    
    const modelId = '3bf5084c-14a6-4e8d-a41b-625f136dbd2d';
    
    // Test 1: Load model info
    console.log('📋 Testing model info API...');
    const modelRes = await fetch(`http://localhost:3000/api/data-models/${modelId}`);
    if (modelRes.ok) {
      const modelData = await modelRes.json();
      console.log(`✅ Model loaded: ${modelData.dataModel?.display_name}`);
    } else {
      console.log(`❌ Model API failed: ${modelRes.status}`);
    }
    
    // Test 2: Load attributes
    console.log('📋 Testing attributes API...');
    const attrRes = await fetch(`http://localhost:3000/api/data-models/${modelId}/attributes`);
    if (attrRes.ok) {
      const attrData = await attrRes.json();
      console.log(`✅ Attributes loaded: ${attrData.attributes?.length || 0} attributes`);
    } else {
      console.log(`❌ Attributes API failed: ${attrRes.status}`);
    }
    
    // Test 3: Load records (this is the main issue)
    console.log('📋 Testing records API...');
    const recordsRes = await fetch(`http://localhost:3000/api/data-records?data_model_id=${modelId}&page=1&limit=20`);
    if (recordsRes.ok) {
      const recordsData = await recordsRes.json();
      console.log(`✅ Records loaded: ${recordsData.records?.length || 0} records`);
      console.log(`📊 Total: ${recordsData.pagination?.total || 0}`);
    } else {
      console.log(`❌ Records API failed: ${recordsRes.status}`);
      const errorText = await recordsRes.text();
      console.log(`Error response: ${errorText.substring(0, 200)}...`);
    }
    
    console.log(`\n🌐 Entity page URL: http://localhost:3000/data/entities?model=${modelId}`);
    
  } catch (error) {
    console.error('❌ Error testing entity page:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Run the test
if (require.main === module) {
  testEntityPage()
    .then(() => {
      console.log('\n🎉 Entity page test completed!');
    })
    .catch((error) => {
      console.error('❌ Entity page test failed:', error);
      process.exit(1);
    });
}

module.exports = { testEntityPage };
