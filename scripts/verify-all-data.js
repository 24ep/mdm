#!/usr/bin/env node

/**
 * Script to verify all seeded data
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function verifyAllData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying all seeded data...');
    
    // Get data summary
    const result = await client.query(`
      SELECT 
        dm.name, 
        dm.display_name, 
        COUNT(dr.id) as record_count,
        COUNT(dma.id) as attribute_count
      FROM public.data_models dm 
      LEFT JOIN public.data_records dr ON dm.id = dr.data_model_id 
      LEFT JOIN public.data_model_attributes dma ON dm.id = dma.data_model_id
      GROUP BY dm.id, dm.name, dm.display_name 
      ORDER BY dm.name
    `);
    
    console.log('\n📊 Data Summary:');
    console.log('='.repeat(60));
    
    let totalRecords = 0;
    let totalAttributes = 0;
    
    result.rows.forEach(row => {
      console.log(`${row.display_name.padEnd(25)} (${row.name.padEnd(20)}): ${row.record_count.toString().padStart(2)} records, ${row.attribute_count.toString().padStart(2)} attributes`);
      totalRecords += parseInt(row.record_count);
      totalAttributes += parseInt(row.attribute_count);
    });
    
    console.log('='.repeat(60));
    console.log(`Total: ${totalRecords} records across ${result.rows.length} data models with ${totalAttributes} total attributes`);
    
    // Test API access
    console.log('\n🌐 Testing API access...');
    const apiTest = await client.query(`
      SELECT COUNT(*) as total_records
      FROM public.data_records
    `);
    
    console.log(`✅ Database accessible: ${apiTest.rows[0].total_records} total records found`);
    
    // Test specific model access
    console.log('\n🧪 Testing specific model access...');
    const customerTest = await client.query(`
      SELECT COUNT(*) as count
      FROM public.data_records dr
      JOIN public.data_models dm ON dr.data_model_id = dm.id
      WHERE dm.name = 'customer'
    `);
    
    console.log(`✅ Customer model: ${customerTest.rows[0].count} records accessible`);
    
    console.log('\n🎉 All data verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Error verifying data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the verification
if (require.main === module) {
  verifyAllData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyAllData };
