#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkEntityData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking entity data...');
    
    // Get customer data model
    const modelResult = await client.query(`
      SELECT id, name, display_name 
      FROM public.data_models 
      WHERE name = 'customer'
    `);
    
    if (modelResult.rows.length === 0) {
      console.log('❌ Customer data model not found');
      return;
    }
    
    const model = modelResult.rows[0];
    console.log(`📋 Data Model: ${model.display_name} (${model.name})`);
    console.log(`🆔 Model ID: ${model.id}`);
    
    // Get records count
    const recordsResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM public.data_records 
      WHERE data_model_id = $1
    `, [model.id]);
    
    console.log(`📊 Records count: ${recordsResult.rows[0].count}`);
    
    // Get a sample record with values
    const sampleResult = await client.query(`
      SELECT 
        dr.id,
        dr.created_at,
        COUNT(drv.id) as value_count
      FROM public.data_records dr
      LEFT JOIN public.data_record_values drv ON dr.id = drv.data_record_id
      WHERE dr.data_model_id = $1
      GROUP BY dr.id, dr.created_at
      LIMIT 1
    `, [model.id]);
    
    if (sampleResult.rows.length > 0) {
      console.log(`📝 Sample record: ${sampleResult.rows[0].id}`);
      console.log(`📅 Created: ${sampleResult.rows[0].created_at}`);
      console.log(`📋 Values: ${sampleResult.rows[0].value_count}`);
    }
    
    // Test the API endpoint
    console.log(`\n🌐 Test URL: /data/entities?model=${model.id}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    pool.end();
  }
}

checkEntityData();
