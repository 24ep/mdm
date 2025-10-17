#!/usr/bin/env node

/**
 * Check the actual attribute types in the database
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkAttributeTypes() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking attribute types...');
    
    const modelId = '3bf5084c-14a6-4e8d-a41b-625f136dbd2d';
    
    // Get all attributes with their types
    const result = await client.query(`
      SELECT name, display_name, type
      FROM public.data_model_attributes 
      WHERE data_model_id = $1
      ORDER BY "order"
    `, [modelId]);
    
    console.log(`✅ Found ${result.rows.length} attributes:`);
    console.log('\n📝 Attribute Types:');
    
    result.rows.forEach((attr, index) => {
      console.log(`   ${index + 1}. ${attr.name} (${attr.display_name})`);
      console.log(`      Type: ${attr.type}`);
      console.log('');
    });
    
    // Look for datetime-related attributes
    const datetimeAttrs = result.rows.filter(attr => 
      attr.name.toLowerCase().includes('date') || 
      attr.name.toLowerCase().includes('time') ||
      attr.name.toLowerCase().includes('created') ||
      attr.name.toLowerCase().includes('updated') ||
      attr.type.toLowerCase().includes('date') ||
      attr.type.toLowerCase().includes('time')
    );
    
    if (datetimeAttrs.length > 0) {
      console.log('📅 Datetime-related attributes:');
      datetimeAttrs.forEach(attr => {
        console.log(`   - ${attr.name} (${attr.display_name}) - Type: ${attr.type}`);
      });
    } else {
      console.log('❌ No datetime-related attributes found');
    }
    
  } catch (error) {
    console.error('❌ Error checking attribute types:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Run the check
if (require.main === module) {
  checkAttributeTypes()
    .then(() => {
      console.log('\n🎉 Attribute types check completed!');
    })
    .catch((error) => {
      console.error('❌ Attribute types check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkAttributeTypes };
