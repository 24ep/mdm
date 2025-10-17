#!/usr/bin/env node

/**
 * Debug attribute matching between API responses
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function debugAttributeMatching() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging attribute matching...');
    
    const modelId = '3bf5084c-14a6-4e8d-a41b-625f136dbd2d';
    
    // Get attributes from database
    console.log('\n📊 Step 1: Get attributes from database');
    const attributesResult = await client.query(`
      SELECT id, name, display_name, type 
      FROM public.data_model_attributes 
      WHERE data_model_id = $1
      ORDER BY "order"
    `, [modelId]);
    
    console.log(`✅ Database attributes count: ${attributesResult.rows.length}`);
    console.log('📝 First 10 database attributes:');
    attributesResult.rows.slice(0, 10).forEach((attr, index) => {
      console.log(`   ${index + 1}. ${attr.name} (${attr.display_name}) - ${attr.type}`);
    });
    
    // Get sample record with values
    console.log('\n📊 Step 2: Get sample record with values');
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
    
    if (recordResult.rows.length > 0) {
      const record = recordResult.rows[0];
      console.log(`✅ Sample record ID: ${record.id}`);
      console.log(`✅ Record values count: ${Object.keys(record.values).length}`);
      
      // Check matching
      console.log('\n📊 Step 3: Check attribute matching');
      const dbAttributeNames = attributesResult.rows.map(attr => attr.name);
      const recordValueKeys = Object.keys(record.values);
      
      console.log(`📝 Database attribute names: ${dbAttributeNames.slice(0, 10).join(', ')}...`);
      console.log(`📝 Record value keys: ${recordValueKeys.slice(0, 10).join(', ')}...`);
      
      // Find matches
      const matches = dbAttributeNames.filter(attrName => 
        recordValueKeys.includes(attrName)
      );
      const missing = dbAttributeNames.filter(attrName => 
        !recordValueKeys.includes(attrName)
      );
      
      console.log(`✅ Matching attributes: ${matches.length}/${dbAttributeNames.length}`);
      console.log(`📝 First 10 matches: ${matches.slice(0, 10).join(', ')}`);
      
      if (missing.length > 0) {
        console.log(`❌ Missing attributes: ${missing.length}`);
        console.log(`📝 First 10 missing: ${missing.slice(0, 10).join(', ')}`);
      }
      
      // Show sample values for matching attributes
      console.log('\n📊 Step 4: Sample values for matching attributes');
      matches.slice(0, 5).forEach(attrName => {
        const value = record.values[attrName];
        console.log(`   ${attrName}: ${value}`);
      });
      
    } else {
      console.log('❌ No records found');
    }
    
  } catch (error) {
    console.error('❌ Error debugging attribute matching:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Run the debug
if (require.main === module) {
  debugAttributeMatching()
    .then(() => {
      console.log('\n🎉 Attribute matching debug completed!');
    })
    .catch((error) => {
      console.error('❌ Attribute matching debug failed:', error);
      process.exit(1);
    });
}

module.exports = { debugAttributeMatching };
