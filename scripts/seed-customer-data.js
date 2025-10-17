#!/usr/bin/env node

/**
 * Script to seed customer data model with sample data
 * This script creates example customer records with all attribute values
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function seedCustomerData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting customer data seeding...');
    
    // Check if customer data model exists
    const modelCheck = await client.query(`
      SELECT id, name, display_name 
      FROM public.data_models 
      WHERE name = 'customer'
    `);
    
    if (modelCheck.rows.length === 0) {
      console.log('❌ Customer data model not found. Please run the data model migrations first.');
      return;
    }
    
    const modelId = modelCheck.rows[0].id;
    console.log(`✅ Found customer data model: ${modelCheck.rows[0].display_name} (${modelId})`);
    
    // Check existing records
    const existingRecords = await client.query(`
      SELECT COUNT(*) as count 
      FROM public.data_records 
      WHERE data_model_id = $1
    `, [modelId]);
    
    const existingCount = parseInt(existingRecords.rows[0].count);
    console.log(`📊 Existing customer records: ${existingCount}`);
    
    if (existingCount > 0) {
      console.log('⚠️  Customer records already exist. Skipping seed to avoid duplicates.');
      console.log('💡 To reset data, delete existing records first.');
      return;
    }
    
    // Get all attributes for the customer model
    const attributes = await client.query(`
      SELECT id, name, display_name, type, options
      FROM public.data_model_attributes 
      WHERE data_model_id = $1
      ORDER BY "order"
    `, [modelId]);
    
    console.log(`📋 Found ${attributes.rows.length} attributes for customer model`);
    
    // Create sample data records
    const sampleData = [
      {
        first_name: 'John',
        middle_name: 'James',
        last_name: 'Smith',
        address: '123 Main Street, Downtown District',
        visitor_type: 'VIP',
        register_type: 'ONLINE',
        data_owner: 'SELF',
        visitor_status: 'ACTIVE',
        district: 'Central District',
        subdistrict: 'Downtown',
        province: 'California',
        zip_code: '90210',
        country: 'United States',
        country_code: 'US',
        province_area_code: '213',
        visitor_consent: 'YES',
        record_status: 'ACTIVE'
      },
      {
        first_name: 'Sarah',
        middle_name: 'Anne',
        last_name: 'Johnson',
        address: '456 Oak Avenue, Business Quarter',
        visitor_type: 'REGULAR',
        register_type: 'ON_SITE',
        data_owner: 'AGENT',
        visitor_status: 'ACTIVE',
        district: 'North District',
        subdistrict: 'Midtown',
        province: 'New York',
        zip_code: '10001',
        country: 'United States',
        country_code: 'US',
        province_area_code: '212',
        visitor_consent: 'YES',
        record_status: 'ACTIVE'
      },
      {
        first_name: 'Michael',
        middle_name: 'Lee',
        last_name: 'Williams',
        address: '789 Pine Road, Residential Area',
        visitor_type: 'STAFF',
        register_type: 'ONLINE',
        data_owner: 'SELF',
        visitor_status: 'INACTIVE',
        district: 'South District',
        subdistrict: 'Uptown',
        province: 'Texas',
        zip_code: '77001',
        country: 'United States',
        country_code: 'US',
        province_area_code: '713',
        visitor_consent: 'NO',
        record_status: 'ARCHIVED'
      },
      {
        first_name: 'Emily',
        middle_name: 'Rose',
        last_name: 'Brown',
        address: '321 Elm Street, City Center',
        visitor_type: 'VIP',
        register_type: 'ON_SITE',
        data_owner: 'AGENT',
        visitor_status: 'ACTIVE',
        district: 'East District',
        subdistrict: 'Westside',
        province: 'California',
        zip_code: '94102',
        country: 'United States',
        country_code: 'US',
        province_area_code: '213',
        visitor_consent: 'YES',
        record_status: 'ACTIVE'
      },
      {
        first_name: 'David',
        middle_name: 'Paul',
        last_name: 'Jones',
        address: '654 Maple Lane, Suburban District',
        visitor_type: 'REGULAR',
        register_type: 'ONLINE',
        data_owner: 'SELF',
        visitor_status: 'ACTIVE',
        district: 'Central District',
        subdistrict: 'Eastside',
        province: 'New York',
        zip_code: '60601',
        country: 'United States',
        country_code: 'US',
        province_area_code: '212',
        visitor_consent: 'YES',
        record_status: 'ACTIVE'
      }
    ];
    
    console.log(`🎯 Creating ${sampleData.length} sample customer records...`);
    
    for (let i = 0; i < sampleData.length; i++) {
      const customer = sampleData[i];
      
      // Create data record
      const recordResult = await client.query(`
        INSERT INTO public.data_records (data_model_id, is_active)
        VALUES ($1, true)
        RETURNING id
      `, [modelId]);
      
      const recordId = recordResult.rows[0].id;
      
      // Add system fields
      const now = new Date().toISOString();
      const lineId = `LINE_${String(i + 1).padStart(6, '0')}`;
      const customerId = `CUST_${String(i + 1).padStart(6, '0')}`;
      
      // Create attribute values
      const values = [
        { name: 'address', value: customer.address },
        { name: 'visitor_type', value: customer.visitor_type },
        { name: 'register_type', value: customer.register_type },
        { name: 'data_owner', value: customer.data_owner },
        { name: 'visitor_status', value: customer.visitor_status },
        { name: 'first_name', value: customer.first_name },
        { name: 'middle_name', value: customer.middle_name },
        { name: 'last_name', value: customer.last_name },
        { name: 'district', value: customer.district },
        { name: 'subdistrict', value: customer.subdistrict },
        { name: 'province', value: customer.province },
        { name: 'zip_code', value: customer.zip_code },
        { name: 'country', value: customer.country },
        { name: 'country_code', value: customer.country_code },
        { name: 'province_area_code', value: customer.province_area_code },
        { name: 'visitor_consent', value: customer.visitor_consent },
        { name: 'record_status', value: customer.record_status },
        { name: 'createdAt', value: now },
        { name: 'createdBy', value: 'admin@company.com' },
        { name: 'updatedAt', value: now },
        { name: 'updatedBy', value: 'system@company.com' },
        { name: 'line_id', value: lineId },
        { name: 'customer_id', value: customerId }
      ];
      
      // Insert attribute values
      for (const value of values) {
        const attribute = attributes.rows.find(attr => attr.name === value.name);
        if (attribute) {
          await client.query(`
            INSERT INTO public.data_record_values (data_record_id, attribute_id, value)
            VALUES ($1, $2, $3)
          `, [recordId, attribute.id, value.value]);
        }
      }
      
      console.log(`✅ Created customer record ${i + 1}: ${customer.first_name} ${customer.last_name} (${customerId})`);
    }
    
    console.log('🎉 Customer data seeding completed successfully!');
    console.log(`📊 Created ${sampleData.length} customer records with all attribute values.`);
    
  } catch (error) {
    console.error('❌ Error seeding customer data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seeding
if (require.main === module) {
  seedCustomerData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedCustomerData };
