#!/usr/bin/env node

/**
 * Test the data-records API directly by calling the database
 * This bypasses authentication for testing purposes
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testDataRecordsAPI() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing data-records API logic...');
    
    const dataModelId = '3bf5084c-14a6-4e8d-a41b-625f136dbd2d';
    const page = 1;
    const limit = 20;
    
    // Build the same query as the API
    let baseQuery = `
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
    `;
    
    const params = [dataModelId];
    const offset = (page - 1) * limit;
    
    // Add GROUP BY and ORDER BY
    baseQuery += ` GROUP BY dr.id, dr.data_model_id, dr.is_active, dr.created_at, dr.updated_at, dr.deleted_at`;
    baseQuery += ` ORDER BY dr.created_at DESC`;
    baseQuery += ` LIMIT $2 OFFSET $3`;
    params.push(limit, offset);
    
    // Count query
    let countQuery = `
      SELECT COUNT(DISTINCT dr.id)::int AS total 
      FROM public.data_records dr
      WHERE dr.data_model_id = $1 AND dr.is_active = TRUE
    `;
    
    console.log('📊 Executing main query...');
    const { rows: records } = await client.query(baseQuery, params);
    
    console.log('📊 Executing count query...');
    const { rows: totalRows } = await client.query(countQuery, [dataModelId]);
    
    const total = totalRows[0]?.total || 0;
    
    console.log(`\n✅ Results:`);
    console.log(`📊 Records found: ${records.length}`);
    console.log(`📊 Total records: ${total}`);
    console.log(`📊 Pages: ${Math.ceil(total / limit)}`);
    
    if (records.length > 0) {
      console.log(`\n📝 Sample record:`);
      const sample = records[0];
      console.log(`   ID: ${sample.id}`);
      console.log(`   Created: ${sample.created_at}`);
      console.log(`   Values: ${Object.keys(sample.values || {}).length} attributes`);
      
      // Show some values
      const values = sample.values || {};
      const sampleKeys = Object.keys(values).slice(0, 5);
      console.log(`   Sample values:`);
      sampleKeys.forEach(key => {
        console.log(`     ${key}: ${values[key]}`);
      });
    }
    
    return {
      records: records || [],
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

// Run the test
if (require.main === module) {
  testDataRecordsAPI()
    .then((result) => {
      console.log('\n🎉 API test completed successfully!');
      console.log(`📊 Final result: ${result.records.length} records, ${result.pagination.total} total`);
    })
    .catch((error) => {
      console.error('❌ API test failed:', error);
      process.exit(1);
    });
}

module.exports = { testDataRecordsAPI };
