#!/usr/bin/env node

/**
 * Script to create customer data model in customer data space
 * This script creates a space specifically for customer data and associates the customer model with it
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createCustomerDataModel() {
  const client = await pool.connect();
  
  try {
    console.log('🏗️  Creating customer data model in customer data space...');
    
    // Step 1: Ensure customer data space exists
    const customerSpace = await ensureCustomerDataSpace(client);
    
    // Step 2: Ensure customer data model exists
    const customerModel = await ensureCustomerModel(client);
    
    // Step 3: Associate customer model with customer data space
    await associateModelWithSpace(client, customerModel.id, customerSpace.id);
    
    // Step 4: Create all attribute types for the customer model
    await createAllAttributeTypes(client, customerModel.id);
    
    console.log('🎉 Customer data model created successfully in customer data space!');
    console.log(`📊 Space: ${customerSpace.name} (${customerSpace.id})`);
    console.log(`📋 Model: ${customerModel.display_name} (${customerModel.id})`);
    
  } catch (error) {
    console.error('❌ Error creating customer data model:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function ensureCustomerDataSpace(client) {
  // Check if customer data space exists (by name or slug)
  const checkResult = await client.query(`
    SELECT * FROM public.spaces 
    WHERE (name = 'Customer Data' OR slug = 'customer-data') 
    AND deleted_at IS NULL
  `);
  
  if (checkResult.rows.length > 0) {
    console.log('✅ Customer Data space already exists');
    return checkResult.rows[0];
  }
  
  // Get the first admin user to be the creator
  const userResult = await client.query(`
    SELECT * FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN') AND is_active = true LIMIT 1
  `);
  
  if (userResult.rows.length === 0) {
    throw new Error('No admin users found. Please create an admin user first.');
  }
  
  const adminUser = userResult.rows[0];
  
  // Create customer data space
  console.log('📝 Creating Customer Data space...');
  const createResult = await client.query(`
    INSERT INTO public.spaces (name, description, is_default, is_active, created_by, slug)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [
    'Customer Data',
    'Space dedicated to customer data management and analytics',
    false,
    true,
    adminUser.id,
    'customer-data'
  ]);
  
  console.log('✅ Customer Data space created');
  return createResult.rows[0];
}

async function ensureCustomerModel(client) {
  // Check if customer model exists
  const checkResult = await client.query(`
    SELECT * FROM public.data_models WHERE name = 'customer'
  `);
  
  if (checkResult.rows.length > 0) {
    console.log('✅ Customer model already exists');
    return checkResult.rows[0];
  }
  
  // Create customer model if it doesn't exist
  console.log('📝 Creating customer data model...');
  const createResult = await client.query(`
    INSERT INTO public.data_models (name, display_name, description, source_type)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [
    'customer',
    'Customer',
    'Customer master data with comprehensive attribute types for data management',
    'INTERNAL'
  ]);
  
  console.log('✅ Customer model created');
  return createResult.rows[0];
}

async function associateModelWithSpace(client, modelId, spaceId) {
  // Check if association already exists
  const checkResult = await client.query(`
    SELECT * FROM public.data_model_spaces 
    WHERE data_model_id = $1 AND space_id = $2
  `, [modelId, spaceId]);
  
  if (checkResult.rows.length > 0) {
    console.log('✅ Model-space association already exists');
    return;
  }
  
  // Get the first admin user to be the creator
  const userResult = await client.query(`
    SELECT * FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN') AND is_active = true LIMIT 1
  `);
  
  const adminUser = userResult.rows[0];
  
  // Create association
  console.log('🔗 Associating customer model with customer data space...');
  await client.query(`
    INSERT INTO public.data_model_spaces (data_model_id, space_id, created_by)
    VALUES ($1, $2, $3)
  `, [modelId, spaceId, adminUser.id]);
  
  console.log('✅ Model-space association created');
}

async function createAllAttributeTypes(client, modelId) {
  // Check existing attributes
  const existingResult = await client.query(`
    SELECT COUNT(*) as count 
    FROM public.data_model_attributes 
    WHERE data_model_id = $1
  `, [modelId]);
  
  const existingCount = parseInt(existingResult.rows[0].count);
  console.log(`📊 Existing attributes: ${existingCount}`);
  
  if (existingCount > 0) {
    console.log(`⚠️  Customer model already has attributes. Skipping...`);
    return;
  }
  
  // Get all attribute types with examples
  const attributes = getAllAttributeTypes();
  
  console.log(`📋 Adding ${attributes.length} attributes with all types...`);
  
  // Insert attributes
  for (const attr of attributes) {
    await client.query(`
      INSERT INTO public.data_model_attributes 
      (data_model_id, name, display_name, type, is_required, is_unique, default_value, options, validation, "order")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      modelId,
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
  
  console.log(`✅ Added ${attributes.length} attributes to Customer model`);
}

function getAllAttributeTypes() {
  return [
    // TEXT attributes
    {
      name: 'first_name',
      display_name: 'First Name',
      type: 'TEXT',
      is_required: true,
      is_unique: false,
      default_value: null,
      options: null,
      validation: '{"min_length": 2, "max_length": 50}',
      order: 1
    },
    {
      name: 'last_name',
      display_name: 'Last Name',
      type: 'TEXT',
      is_required: true,
      is_unique: false,
      default_value: null,
      options: null,
      validation: '{"min_length": 2, "max_length": 50}',
      order: 2
    },
    {
      name: 'middle_name',
      display_name: 'Middle Name',
      type: 'TEXT',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: null,
      validation: '{"max_length": 50}',
      order: 3
    },
    
    // NUMBER attributes
    {
      name: 'age',
      display_name: 'Age',
      type: 'NUMBER',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: null,
      validation: '{"min": 0, "max": 150}',
      order: 4
    },
    {
      name: 'credit_score',
      display_name: 'Credit Score',
      type: 'NUMBER',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: null,
      validation: '{"min": 300, "max": 850}',
      order: 5
    },
    {
      name: 'annual_income',
      display_name: 'Annual Income',
      type: 'NUMBER',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: null,
      validation: '{"min": 0}',
      order: 6
    },
    
    // BOOLEAN attributes
    {
      name: 'is_vip',
      display_name: 'VIP Customer',
      type: 'BOOLEAN',
      is_required: false,
      is_unique: false,
      default_value: 'false',
      options: null,
      validation: null,
      order: 7
    },
    {
      name: 'has_newsletter',
      display_name: 'Newsletter Subscription',
      type: 'BOOLEAN',
      is_required: false,
      is_unique: false,
      default_value: 'false',
      options: null,
      validation: null,
      order: 8
    },
    {
      name: 'is_active',
      display_name: 'Active Customer',
      type: 'BOOLEAN',
      is_required: false,
      is_unique: false,
      default_value: 'true',
      options: null,
      validation: null,
      order: 9
    },
    
    // DATE attributes
    {
      name: 'birth_date',
      display_name: 'Birth Date',
      type: 'DATE',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: null,
      validation: null,
      order: 10
    },
    {
      name: 'registration_date',
      display_name: 'Registration Date',
      type: 'DATE',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: null,
      validation: null,
      order: 11
    },
    {
      name: 'last_login',
      display_name: 'Last Login',
      type: 'DATE',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: null,
      validation: null,
      order: 12
    },
    
    // EMAIL attributes
    {
      name: 'email',
      display_name: 'Email Address',
      type: 'EMAIL',
      is_required: true,
      is_unique: true,
      default_value: null,
      options: null,
      validation: null,
      order: 13
    },
    {
      name: 'secondary_email',
      display_name: 'Secondary Email',
      type: 'EMAIL',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: null,
      validation: null,
      order: 14
    },
    
    // PHONE attributes
    {
      name: 'phone',
      display_name: 'Phone Number',
      type: 'PHONE',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: null,
      validation: null,
      order: 15
    },
    {
      name: 'mobile',
      display_name: 'Mobile Number',
      type: 'PHONE',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: null,
      validation: null,
      order: 16
    },
    
    // URL attributes
    {
      name: 'website',
      display_name: 'Website',
      type: 'URL',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: null,
      validation: null,
      order: 17
    },
    {
      name: 'linkedin_profile',
      display_name: 'LinkedIn Profile',
      type: 'URL',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: null,
      validation: null,
      order: 18
    },
    
    // SELECT attributes
    {
      name: 'gender',
      display_name: 'Gender',
      type: 'SELECT',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: '{"options": ["Male", "Female", "Other", "Prefer not to say"]}',
      validation: null,
      order: 19
    },
    {
      name: 'customer_type',
      display_name: 'Customer Type',
      type: 'SELECT',
      is_required: false,
      is_unique: false,
      default_value: 'INDIVIDUAL',
      options: '{"options": ["INDIVIDUAL", "BUSINESS", "ENTERPRISE", "GOVERNMENT"]}',
      validation: null,
      order: 20
    },
    {
      name: 'status',
      display_name: 'Status',
      type: 'SELECT',
      is_required: false,
      is_unique: false,
      default_value: 'ACTIVE',
      options: '{"options": ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"]}',
      validation: null,
      order: 21
    },
    
    // MULTI_SELECT attributes
    {
      name: 'interests',
      display_name: 'Interests',
      type: 'MULTI_SELECT',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: '{"options": ["Technology", "Sports", "Music", "Travel", "Food", "Books", "Movies", "Gaming"]}',
      validation: null,
      order: 22
    },
    {
      name: 'communication_preferences',
      display_name: 'Communication Preferences',
      type: 'MULTI_SELECT',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: '{"options": ["Email", "SMS", "Phone", "Mail", "Push Notifications"]}',
      validation: null,
      order: 23
    },
    
    // TEXTAREA attributes
    {
      name: 'address',
      display_name: 'Address',
      type: 'TEXTAREA',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: null,
      validation: '{"max_length": 500}',
      order: 24
    },
    {
      name: 'notes',
      display_name: 'Notes',
      type: 'TEXTAREA',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: null,
      validation: '{"max_length": 1000}',
      order: 25
    },
    {
      name: 'description',
      display_name: 'Description',
      type: 'TEXTAREA',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: null,
      validation: '{"max_length": 2000}',
      order: 26
    },
    
    // JSON attributes
    {
      name: 'preferences',
      display_name: 'Preferences',
      type: 'JSON',
      is_required: false,
      is_unique: false,
      default_value: '{}',
      options: null,
      validation: null,
      order: 27
    },
    {
      name: 'metadata',
      display_name: 'Metadata',
      type: 'JSON',
      is_required: false,
      is_unique: false,
      default_value: '{}',
      options: null,
      validation: null,
      order: 28
    },
    {
      name: 'custom_fields',
      display_name: 'Custom Fields',
      type: 'JSON',
      is_required: false,
      is_unique: false,
      default_value: '{}',
      options: null,
      validation: null,
      order: 29
    },
    
    // System attributes
    {
      name: 'created_at',
      display_name: 'Created At',
      type: 'DATE',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: null,
      validation: null,
      order: 30
    },
    {
      name: 'updated_at',
      display_name: 'Updated At',
      type: 'DATE',
      is_required: false,
      is_unique: false,
      default_value: null,
      options: null,
      validation: null,
      order: 31
    }
  ];
}

// Run the script
if (require.main === module) {
  createCustomerDataModel()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createCustomerDataModel };
