#!/usr/bin/env node

/**
 * Script to verify customer data model sample data
 * This script checks the created customer records and displays them
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function verifyCustomerData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying customer data...');
    
    // Get customer data model
    const modelResult = await client.query(`
      SELECT id, name, display_name, description
      FROM public.data_models 
      WHERE name = 'customer'
    `);
    
    if (modelResult.rows.length === 0) {
      console.log('❌ Customer data model not found.');
      return;
    }
    
    const model = modelResult.rows[0];
    console.log(`📋 Data Model: ${model.display_name} (${model.name})`);
    console.log(`📝 Description: ${model.description || 'No description'}`);
    
    // Get all records for this model
    const recordsResult = await client.query(`
      SELECT 
        dr.id,
        dr.created_at,
        dr.updated_at,
        COUNT(drv.id) as attribute_count
      FROM public.data_records dr
      LEFT JOIN public.data_record_values drv ON dr.id = drv.data_record_id
      WHERE dr.data_model_id = $1
      GROUP BY dr.id, dr.created_at, dr.updated_at
      ORDER BY dr.created_at
    `, [model.id]);
    
    console.log(`\n📊 Found ${recordsResult.rows.length} customer records:`);
    
    // Get detailed data for each record
    for (const record of recordsResult.rows) {
      console.log(`\n👤 Record ID: ${record.id}`);
      console.log(`📅 Created: ${record.created_at}`);
      console.log(`🔄 Updated: ${record.updated_at}`);
      console.log(`📋 Attributes: ${record.attribute_count}`);
      
      // Get all attribute values for this record
      const valuesResult = await client.query(`
        SELECT 
          dma.name,
          dma.display_name,
          dma.type,
          drv.value
        FROM public.data_record_values drv
        JOIN public.data_model_attributes dma ON drv.attribute_id = dma.id
        WHERE drv.data_record_id = $1
        ORDER BY dma."order"
      `, [record.id]);
      
      console.log('   📝 Attribute Values:');
      for (const value of valuesResult.rows) {
        const displayValue = value.value || '(empty)';
        console.log(`      ${value.display_name} (${value.name}): ${displayValue}`);
      }
    }
    
    // Get summary statistics
    const statsResult = await client.query(`
      SELECT 
        COUNT(DISTINCT dr.id) as total_records,
        COUNT(drv.id) as total_values,
        COUNT(DISTINCT dma.id) as total_attributes
      FROM public.data_records dr
      LEFT JOIN public.data_record_values drv ON dr.id = drv.data_record_id
      LEFT JOIN public.data_model_attributes dma ON drv.attribute_id = dma.id
      WHERE dr.data_model_id = $1
    `, [model.id]);
    
    const stats = statsResult.rows[0];
    console.log(`\n📈 Summary Statistics:`);
    console.log(`   Total Records: ${stats.total_records}`);
    console.log(`   Total Attribute Values: ${stats.total_values}`);
    console.log(`   Unique Attributes: ${stats.total_attributes}`);
    
    // Check for any missing values
    const missingValuesResult = await client.query(`
      SELECT 
        dr.id as record_id,
        dma.name as attribute_name,
        dma.display_name
      FROM public.data_records dr
      CROSS JOIN public.data_model_attributes dma
      LEFT JOIN public.data_record_values drv ON dr.id = drv.data_record_id AND dma.id = drv.attribute_id
      WHERE dr.data_model_id = $1 AND drv.id IS NULL
      ORDER BY dr.id, dma."order"
    `, [model.id]);
    
    if (missingValuesResult.rows.length > 0) {
      console.log(`\n⚠️  Missing Values (${missingValuesResult.rows.length}):`);
      for (const missing of missingValuesResult.rows) {
        console.log(`   Record ${missing.record_id}: ${missing.display_name} (${missing.attribute_name})`);
      }
    } else {
      console.log(`\n✅ All records have complete attribute values!`);
    }
    
  } catch (error) {
    console.error('❌ Error verifying customer data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the verification
if (require.main === module) {
  verifyCustomerData()
    .then(() => {
      console.log('\n✅ Verification completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyCustomerData };
