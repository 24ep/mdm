#!/usr/bin/env node

/**
 * Test script to verify customer data model and attributes creation
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testCustomerScripts() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing customer data model and attributes...');
    
    // Test 1: Check if customer data space exists
    const spaceResult = await client.query(`
      SELECT * FROM public.spaces WHERE name = 'Customer Data' AND deleted_at IS NULL
    `);
    
    if (spaceResult.rows.length > 0) {
      console.log('✅ Customer Data space exists:', spaceResult.rows[0].name);
    } else {
      console.log('❌ Customer Data space not found');
    }
    
    // Test 2: Check if customer model exists
    const modelResult = await client.query(`
      SELECT * FROM public.data_models WHERE name = 'customer'
    `);
    
    if (modelResult.rows.length > 0) {
      console.log('✅ Customer model exists:', modelResult.rows[0].display_name);
    } else {
      console.log('❌ Customer model not found');
    }
    
    // Test 3: Check model-space association
    if (spaceResult.rows.length > 0 && modelResult.rows.length > 0) {
      const associationResult = await client.query(`
        SELECT * FROM public.data_model_spaces 
        WHERE data_model_id = $1 AND space_id = $2
      `, [modelResult.rows[0].id, spaceResult.rows[0].id]);
      
      if (associationResult.rows.length > 0) {
        console.log('✅ Model-space association exists');
      } else {
        console.log('❌ Model-space association not found');
      }
    }
    
    // Test 4: Check customer model attributes
    if (modelResult.rows.length > 0) {
      const attributesResult = await client.query(`
        SELECT type, COUNT(*) as count 
        FROM public.data_model_attributes 
        WHERE data_model_id = $1
        GROUP BY type
        ORDER BY type
      `, [modelResult.rows[0].id]);
      
      if (attributesResult.rows.length > 0) {
        console.log('✅ Customer model attributes:');
        attributesResult.rows.forEach(row => {
          console.log(`   - ${row.type}: ${row.count} attributes`);
        });
        
        // Check for all expected attribute types
        const expectedTypes = ['TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'EMAIL', 'PHONE', 'URL', 'SELECT', 'MULTI_SELECT', 'TEXTAREA', 'JSON'];
        const foundTypes = attributesResult.rows.map(row => row.type);
        const missingTypes = expectedTypes.filter(type => !foundTypes.includes(type));
        
        if (missingTypes.length === 0) {
          console.log('✅ All expected attribute types found');
        } else {
          console.log('❌ Missing attribute types:', missingTypes);
        }
      } else {
        console.log('❌ No attributes found for customer model');
      }
    }
    
    console.log('🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the test
if (require.main === module) {
  testCustomerScripts()
    .then(() => {
      console.log('✅ Test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testCustomerScripts };
