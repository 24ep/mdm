#!/usr/bin/env node

/**
 * Test accessing the entity page and API endpoints
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testEntityAccess() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing entity page access...');
    
    const modelId = '3bf5084c-14a6-4e8d-a41b-625f136dbd2d';
    
    // Test 1: Check if we can access the main page
    console.log('🌐 Testing main page access...');
    try {
      const response = await fetch('http://localhost:3000/');
      console.log(`✅ Main page: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`❌ Main page error: ${error.message}`);
    }
    
    // Test 2: Check if we can access the entity page (should redirect to login)
    console.log('🌐 Testing entity page access...');
    try {
      const response = await fetch(`http://localhost:3000/data/entities?model=${modelId}`);
      console.log(`✅ Entity page: ${response.status} ${response.statusText}`);
      if (response.status === 200) {
        const text = await response.text();
        if (text.includes('login') || text.includes('signin')) {
          console.log('🔐 Entity page requires authentication (expected)');
        }
      }
    } catch (error) {
      console.log(`❌ Entity page error: ${error.message}`);
    }
    
    // Test 3: Check if we can access the login page
    console.log('🌐 Testing login page access...');
    try {
      const response = await fetch('http://localhost:3000/auth/signin');
      console.log(`✅ Login page: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`❌ Login page error: ${error.message}`);
    }
    
    // Test 4: Direct API test (should fail without auth)
    console.log('🌐 Testing API endpoints...');
    try {
      const response = await fetch(`http://localhost:3000/api/data-records?data_model_id=${modelId}`);
      console.log(`✅ API endpoint: ${response.status} ${response.statusText}`);
      if (response.status === 401) {
        console.log('🔐 API requires authentication (expected)');
      }
    } catch (error) {
      console.log(`❌ API error: ${error.message}`);
    }
    
    console.log('\n📋 Instructions to access the data:');
    console.log('1. Open your browser and go to: http://localhost:3000/auth/signin');
    console.log('2. Login with:');
    console.log('   Email: test@example.com');
    console.log('   Password: test123');
    console.log('3. After login, go to: http://localhost:3000/data/entities?model=3bf5084c-14a6-4e8d-a41b-625f136dbd2d');
    console.log('4. You should see 5 customer records with all their data');
    
  } catch (error) {
    console.error('❌ Error testing entity access:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Run the test
if (require.main === module) {
  testEntityAccess()
    .then(() => {
      console.log('\n🎉 Entity access test completed!');
    })
    .catch((error) => {
      console.error('❌ Entity access test failed:', error);
      process.exit(1);
    });
}

module.exports = { testEntityAccess };
