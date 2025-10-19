#!/usr/bin/env node

/**
 * Script to seed all data models with sample data
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function seedAllData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting comprehensive data seeding...');
    
    // Get all data models
    const modelsResult = await client.query(`
      SELECT id, name, display_name 
      FROM public.data_models 
      ORDER BY name
    `);
    
    console.log(`📋 Found ${modelsResult.rows.length} data models:`);
    modelsResult.rows.forEach(model => {
      console.log(`  - ${model.name} (${model.display_name})`);
    });
    
    // Seed each model with sample data
    for (const model of modelsResult.rows) {
      await seedModelData(client, model);
    }
    
    console.log('🎉 All data models seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function seedModelData(client, model) {
  try {
    console.log(`\n🌱 Seeding ${model.display_name} (${model.name})...`);
    
    // Check existing records
    const existingResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM public.data_records 
      WHERE data_model_id = $1
    `, [model.id]);
    
    const existingCount = parseInt(existingResult.rows[0].count);
    console.log(`📊 Existing records: ${existingCount}`);
    
    if (existingCount > 0) {
      console.log(`⚠️  ${model.display_name} already has data. Skipping...`);
      return;
    }
    
    // Get attributes for this model
    const attributesResult = await client.query(`
      SELECT id, name, display_name, type, options
      FROM public.data_model_attributes 
      WHERE data_model_id = $1
      ORDER BY "order"
    `, [model.id]);
    
    const attributes = attributesResult.rows;
    console.log(`📋 Found ${attributes.length} attributes`);
    
    if (attributes.length === 0) {
      console.log(`⚠️  No attributes found for ${model.display_name}. Skipping...`);
      return;
    }
    
    // Create sample records based on model type
    const sampleCount = getSampleCount(model.name);
    console.log(`🎯 Creating ${sampleCount} sample records...`);
    
    for (let i = 0; i < sampleCount; i++) {
      await createSampleRecord(client, model, attributes, i);
    }
    
    console.log(`✅ Created ${sampleCount} ${model.display_name} records`);
    
  } catch (error) {
    console.error(`❌ Error seeding ${model.display_name}:`, error);
  }
}

function getSampleCount(modelName) {
  // Return different sample counts based on model type
  switch (modelName) {
    case 'customer': return 5;
    case 'company': return 3;
    case 'source': return 4;
    case 'industry_category': return 6;
    case 'event': return 3;
    case 'position': return 5;
    case 'business_profile': return 3;
    case 'title_name': return 4;
    case 'call_workflow_status': return 3;
    default: return 2;
  }
}

async function createSampleRecord(client, model, attributes, index) {
  // Create data record
  const recordResult = await client.query(`
    INSERT INTO public.data_records (data_model_id, is_active)
    VALUES ($1, true)
    RETURNING id
  `, [model.id]);
  
  const recordId = recordResult.rows[0].id;
  
  // Generate sample values based on model type
  const sampleValues = generateSampleValues(model.name, index);
  
  // Insert attribute values
  for (const attribute of attributes) {
    const value = sampleValues[attribute.name] || getDefaultValue(attribute);
    if (value !== null) {
      await client.query(`
        INSERT INTO public.data_record_values (data_record_id, attribute_id, value)
        VALUES ($1, $2, $3)
      `, [recordId, attribute.id, value]);
    }
  }
}

function generateSampleValues(modelName, index) {
  const now = new Date().toISOString();
  const baseValues = {
    createdAt: now,
    createdBy: 'admin@company.com',
    updatedAt: now,
    updatedBy: 'system@company.com'
  };
  
  switch (modelName) {
    case 'customer':
      return {
        ...baseValues,
        first_name: ['John', 'Sarah', 'Michael', 'Emily', 'David'][index],
        last_name: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][index],
        visitor_type: ['VIP', 'REGULAR', 'STAFF', 'VIP', 'REGULAR'][index],
        register_type: ['ONLINE', 'ON_SITE', 'ONLINE', 'ON_SITE', 'ONLINE'][index],
        data_owner: ['SELF', 'AGENT', 'SELF', 'AGENT', 'SELF'][index],
        visitor_status: ['ACTIVE', 'ACTIVE', 'INACTIVE', 'ACTIVE', 'ACTIVE'][index],
        visitor_consent: ['YES', 'YES', 'NO', 'YES', 'YES'][index],
        record_status: ['ACTIVE', 'ACTIVE', 'ARCHIVED', 'ACTIVE', 'ACTIVE'][index],
        line_id: `LINE_${String(index + 1).padStart(6, '0')}`,
        customer_id: `CUST_${String(index + 1).padStart(6, '0')}`
      };
      
    case 'company':
      return {
        ...baseValues,
        name: ['TechCorp Inc', 'Global Solutions Ltd', 'Innovation Systems'][index],
        industry: ['Technology', 'Consulting', 'Manufacturing'][index],
        size: ['Large', 'Medium', 'Small'][index],
        status: ['ACTIVE', 'ACTIVE', 'INACTIVE'][index]
      };
      
    case 'source':
      return {
        ...baseValues,
        name: ['Website', 'Social Media', 'Referral', 'Advertisement'][index],
        type: ['DIGITAL', 'SOCIAL', 'REFERRAL', 'PAID'][index],
        status: ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE'][index]
      };
      
    case 'industry_category':
      return {
        ...baseValues,
        name: ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing'][index],
        description: ['Tech companies', 'Healthcare providers', 'Financial services', 'Educational institutions', 'Retail businesses', 'Manufacturing companies'][index],
        status: ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE'][index]
      };
      
    case 'event':
      return {
        ...baseValues,
        name: ['Product Launch', 'Conference', 'Workshop'][index],
        type: ['LAUNCH', 'CONFERENCE', 'TRAINING'][index],
        status: ['PLANNED', 'ONGOING', 'COMPLETED'][index]
      };
      
    case 'position':
      return {
        ...baseValues,
        title: ['Manager', 'Developer', 'Analyst', 'Director', 'Coordinator'][index],
        level: ['SENIOR', 'MID', 'JUNIOR', 'EXECUTIVE', 'ENTRY'][index],
        status: ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE'][index]
      };
      
    case 'business_profile':
      return {
        ...baseValues,
        name: ['Enterprise', 'SMB', 'Startup'][index],
        type: ['ENTERPRISE', 'SMB', 'STARTUP'][index],
        status: ['ACTIVE', 'ACTIVE', 'ACTIVE'][index]
      };
      
    case 'title_name':
      return {
        ...baseValues,
        title: ['Mr.', 'Ms.', 'Dr.', 'Prof.'][index],
        gender: ['MALE', 'FEMALE', 'MALE', 'FEMALE'][index],
        status: ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE'][index]
      };
      
    case 'call_workflow_status':
      return {
        ...baseValues,
        status: ['NEW', 'IN_PROGRESS', 'COMPLETED'][index],
        description: ['New call', 'Call in progress', 'Call completed'][index]
      };
      
    default:
      return baseValues;
  }
}

function getDefaultValue(attribute) {
  switch (attribute.type) {
    case 'TEXT':
    case 'TEXTAREA':
      return 'Sample text';
    case 'NUMBER':
      return '100';
    case 'DATE':
      return new Date().toISOString();
    case 'SELECT':
      // Try to get first option from options
      if (attribute.options && attribute.options.options) {
        return attribute.options.options[0];
      }
      return 'DEFAULT';
    default:
      return null;
  }
}

// Run the seeding
if (require.main === module) {
  seedAllData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedAllData };
