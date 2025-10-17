#!/usr/bin/env node

/**
 * Test API endpoints with authentication simulation
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testAuthenticatedAPI() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing authenticated API endpoints...');
    
    const modelId = '3bf5084c-14a6-4e8d-a41b-625f136dbd2d';
    
    // Test 1: Check if we can access the API without authentication
    console.log('\n🌐 Testing API without authentication...');
    try {
      const response = await fetch(`http://localhost:3000/api/data-records?data_model_id=${modelId}&page=1&limit=20`);
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 401) {
        console.log('🔐 API requires authentication (expected)');
      } else if (response.status === 200) {
        const data = await response.json();
        console.log(`✅ API returned: ${data.records?.length || 0} records`);
        console.log(`📊 Total: ${data.pagination?.total || 0}`);
      } else {
        const text = await response.text();
        console.log(`❌ Unexpected response: ${text.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`❌ API error: ${error.message}`);
    }
    
    // Test 2: Check data model API
    console.log('\n🌐 Testing data model API...');
    try {
      const response = await fetch(`http://localhost:3000/api/data-models/${modelId}`);
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        const data = await response.json();
        console.log(`✅ Data model: ${data.dataModel?.display_name}`);
      } else {
        const text = await response.text();
        console.log(`❌ Response: ${text.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`❌ Data model API error: ${error.message}`);
    }
    
    // Test 3: Check attributes API
    console.log('\n🌐 Testing attributes API...');
    try {
      const response = await fetch(`http://localhost:3000/api/data-models/${modelId}/attributes`);
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        const data = await response.json();
        console.log(`✅ Attributes: ${data.attributes?.length || 0} attributes`);
      } else {
        const text = await response.text();
        console.log(`❌ Response: ${text.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`❌ Attributes API error: ${error.message}`);
    }
    
    // Test 4: Check if there's a session issue
    console.log('\n🔍 Checking session requirements...');
    try {
      const response = await fetch('http://localhost:3000/api/debug/session-test');
      console.log(`Session test status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        const data = await response.json();
        console.log(`✅ Session test: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`❌ Session test error: ${error.message}`);
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Make sure you are logged in at: http://localhost:3000/auth/signin');
    console.log('2. Use credentials: test@example.com / test123');
    console.log('3. After login, try the entity page again');
    console.log('4. Check browser console for any JavaScript errors');
    console.log('5. Check network tab in browser dev tools for API calls');
    
  } catch (error) {
    console.error('❌ Error testing authenticated API:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Run the test
if (require.main === module) {
  testAuthenticatedAPI()
    .then(() => {
      console.log('\n🎉 Authenticated API test completed!');
    })
    .catch((error) => {
      console.error('❌ Authenticated API test failed:', error);
      process.exit(1);
    });
}

module.exports = { testAuthenticatedAPI };
