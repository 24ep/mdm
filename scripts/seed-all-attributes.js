#!/usr/bin/env node

/**
 * Script to add attributes to all data models
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function seedAllAttributes() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Adding attributes to all data models...');
    
    // Get all data models
    const modelsResult = await client.query(`
      SELECT id, name, display_name 
      FROM public.data_models 
      ORDER BY name
    `);
    
    console.log(`📋 Found ${modelsResult.rows.length} data models`);
    
    // Add attributes to each model
    for (const model of modelsResult.rows) {
      await addModelAttributes(client, model);
    }
    
    console.log('🎉 All attributes added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding attributes:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function addModelAttributes(client, model) {
  try {
    console.log(`\n🌱 Adding attributes to ${model.display_name} (${model.name})...`);
    
    // Check existing attributes
    const existingResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM public.data_model_attributes 
      WHERE data_model_id = $1
    `, [model.id]);
    
    const existingCount = parseInt(existingResult.rows[0].count);
    console.log(`📊 Existing attributes: ${existingCount}`);
    
    if (existingCount > 0) {
      console.log(`⚠️  ${model.display_name} already has attributes. Skipping...`);
      return;
    }
    
    // Get attributes for this model type
    const attributes = getAttributesForModel(model.name);
    
    if (attributes.length === 0) {
      console.log(`⚠️  No attributes defined for ${model.display_name}. Skipping...`);
      return;
    }
    
    console.log(`📋 Adding ${attributes.length} attributes...`);
    
    // Insert attributes
    for (const attr of attributes) {
      await client.query(`
        INSERT INTO public.data_model_attributes 
        (data_model_id, name, display_name, type, is_required, is_unique, default_value, options, validation, "order")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        model.id,
        attr.name,
        attr.display_name,
        attr.type,
        attr.is_required,
        attr.is_unique,
        attr.default_value,
        attr.options,
        attr.validation,
        attr.order
      ]);
    }
    
    console.log(`✅ Added ${attributes.length} attributes to ${model.display_name}`);
    
  } catch (error) {
    console.error(`❌ Error adding attributes to ${model.display_name}:`, error);
  }
}

function getAttributesForModel(modelName) {
  const baseAttributes = [
    { name: 'createdAt', display_name: 'Created at', type: 'DATE', is_required: false, is_unique: false, default_value: null, options: null, validation: null, order: 20 },
    { name: 'createdBy', display_name: 'Created by', type: 'TEXT', is_required: false, is_unique: false, default_value: null, options: null, validation: null, order: 21 },
    { name: 'updatedAt', display_name: 'Last updated at', type: 'DATE', is_required: false, is_unique: false, default_value: null, options: null, validation: null, order: 22 },
    { name: 'updatedBy', display_name: 'Last updated by', type: 'TEXT', is_required: false, is_unique: false, default_value: null, options: null, validation: null, order: 23 }
  ];
  
  switch (modelName) {
    case 'company':
      return [
        { name: 'name', display_name: 'Company Name', type: 'TEXT', is_required: true, is_unique: true, default_value: null, options: null, validation: null, order: 1 },
        { name: 'industry', display_name: 'Industry', type: 'SELECT', is_required: false, is_unique: false, default_value: null, options: '{"options":["Technology","Healthcare","Finance","Education","Retail","Manufacturing"]}', validation: null, order: 2 },
        { name: 'size', display_name: 'Company Size', type: 'SELECT', is_required: false, is_unique: false, default_value: null, options: '{"options":["Small","Medium","Large","Enterprise"]}', validation: null, order: 3 },
        { name: 'status', display_name: 'Status', type: 'SELECT', is_required: false, is_unique: false, default_value: 'ACTIVE', options: '{"options":["ACTIVE","INACTIVE","SUSPENDED"]}', validation: null, order: 4 },
        { name: 'description', display_name: 'Description', type: 'TEXTAREA', is_required: false, is_unique: false, default_value: null, options: null, validation: null, order: 5 },
        ...baseAttributes
      ];
      
    case 'source':
      return [
        { name: 'name', display_name: 'Source Name', type: 'TEXT', is_required: true, is_unique: true, default_value: null, options: null, validation: null, order: 1 },
        { name: 'type', display_name: 'Source Type', type: 'SELECT', is_required: false, is_unique: false, default_value: null, options: '{"options":["DIGITAL","SOCIAL","REFERRAL","PAID","DIRECT"]}', validation: null, order: 2 },
        { name: 'status', display_name: 'Status', type: 'SELECT', is_required: false, is_unique: false, default_value: 'ACTIVE', options: '{"options":["ACTIVE","INACTIVE"]}', validation: null, order: 3 },
        { name: 'description', display_name: 'Description', type: 'TEXTAREA', is_required: false, is_unique: false, default_value: null, options: null, validation: null, order: 4 },
        ...baseAttributes
      ];
      
    case 'industry_category':
      return [
        { name: 'name', display_name: 'Category Name', type: 'TEXT', is_required: true, is_unique: true, default_value: null, options: null, validation: null, order: 1 },
        { name: 'description', display_name: 'Description', type: 'TEXTAREA', is_required: false, is_unique: false, default_value: null, options: null, validation: null, order: 2 },
        { name: 'status', display_name: 'Status', type: 'SELECT', is_required: false, is_unique: false, default_value: 'ACTIVE', options: '{"options":["ACTIVE","INACTIVE"]}', validation: null, order: 3 },
        ...baseAttributes
      ];
      
    case 'event':
      return [
        { name: 'name', display_name: 'Event Name', type: 'TEXT', is_required: true, is_unique: false, default_value: null, options: null, validation: null, order: 1 },
        { name: 'type', display_name: 'Event Type', type: 'SELECT', is_required: false, is_unique: false, default_value: null, options: '{"options":["LAUNCH","CONFERENCE","TRAINING","MEETING","WEBINAR"]}', validation: null, order: 2 },
        { name: 'status', display_name: 'Status', type: 'SELECT', is_required: false, is_unique: false, default_value: 'PLANNED', options: '{"options":["PLANNED","ONGOING","COMPLETED","CANCELLED"]}', validation: null, order: 3 },
        { name: 'start_date', display_name: 'Start Date', type: 'DATE', is_required: false, is_unique: false, default_value: null, options: null, validation: null, order: 4 },
        { name: 'end_date', display_name: 'End Date', type: 'DATE', is_required: false, is_unique: false, default_value: null, options: null, validation: null, order: 5 },
        { name: 'description', display_name: 'Description', type: 'TEXTAREA', is_required: false, is_unique: false, default_value: null, options: null, validation: null, order: 6 },
        ...baseAttributes
      ];
      
    case 'position':
      return [
        { name: 'title', display_name: 'Position Title', type: 'TEXT', is_required: true, is_unique: false, default_value: null, options: null, validation: null, order: 1 },
        { name: 'level', display_name: 'Level', type: 'SELECT', is_required: false, is_unique: false, default_value: null, options: '{"options":["ENTRY","JUNIOR","MID","SENIOR","EXECUTIVE"]}', validation: null, order: 2 },
        { name: 'department', display_name: 'Department', type: 'TEXT', is_required: false, is_unique: false, default_value: null, options: null, validation: null, order: 3 },
        { name: 'status', display_name: 'Status', type: 'SELECT', is_required: false, is_unique: false, default_value: 'ACTIVE', options: '{"options":["ACTIVE","INACTIVE","VACANT"]}', validation: null, order: 4 },
        { name: 'description', display_name: 'Description', type: 'TEXTAREA', is_required: false, is_unique: false, default_value: null, options: null, validation: null, order: 5 },
        ...baseAttributes
      ];
      
    case 'business_profile':
      return [
        { name: 'name', display_name: 'Profile Name', type: 'TEXT', is_required: true, is_unique: true, default_value: null, options: null, validation: null, order: 1 },
        { name: 'type', display_name: 'Profile Type', type: 'SELECT', is_required: false, is_unique: false, default_value: null, options: '{"options":["ENTERPRISE","SMB","STARTUP","INDIVIDUAL"]}', validation: null, order: 2 },
        { name: 'status', display_name: 'Status', type: 'SELECT', is_required: false, is_unique: false, default_value: 'ACTIVE', options: '{"options":["ACTIVE","INACTIVE"]}', validation: null, order: 3 },
        { name: 'description', display_name: 'Description', type: 'TEXTAREA', is_required: false, is_unique: false, default_value: null, options: null, validation: null, order: 4 },
        ...baseAttributes
      ];
      
    case 'title_name':
      return [
        { name: 'title', display_name: 'Title', type: 'TEXT', is_required: true, is_unique: false, default_value: null, options: null, validation: null, order: 1 },
        { name: 'gender', display_name: 'Gender', type: 'SELECT', is_required: false, is_unique: false, default_value: null, options: '{"options":["MALE","FEMALE","OTHER"]}', validation: null, order: 2 },
        { name: 'status', display_name: 'Status', type: 'SELECT', is_required: false, is_unique: false, default_value: 'ACTIVE', options: '{"options":["ACTIVE","INACTIVE"]}', validation: null, order: 3 },
        ...baseAttributes
      ];
      
    case 'call_workflow_status':
      return [
        { name: 'status', display_name: 'Status', type: 'TEXT', is_required: true, is_unique: true, default_value: null, options: null, validation: null, order: 1 },
        { name: 'description', display_name: 'Description', type: 'TEXTAREA', is_required: false, is_unique: false, default_value: null, options: null, validation: null, order: 2 },
        { name: 'color', display_name: 'Color', type: 'TEXT', is_required: false, is_unique: false, default_value: '#000000', options: null, validation: null, order: 3 },
        ...baseAttributes
      ];
      
    default:
      return baseAttributes;
  }
}

// Run the seeding
if (require.main === module) {
  seedAllAttributes()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedAllAttributes };
