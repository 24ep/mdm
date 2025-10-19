#!/usr/bin/env node

/**
 * Script to create attributes of all types for the customer data model
 * This script demonstrates all available attribute types in the system
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createCustomerAttributes() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Creating customer data model with all attribute types...');
    
    // First, ensure the customer data model exists
    const customerModel = await ensureCustomerModel(client);
    
    // Check existing attributes
    const existingResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM public.data_model_attributes 
      WHERE data_model_id = $1
    `, [customerModel.id]);
    
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
        customerModel.id,
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
    console.log('🎉 Customer data model now has examples of all attribute types!');
    
  } catch (error) {
    console.error('❌ Error creating customer attributes:', error);
    throw error;
  } finally {
    client.release();
  }
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
    INSERT INTO public.data_models (name, display_name, description)
    VALUES ($1, $2, $3)
    RETURNING *
  `, ['customer', 'Customer', 'Customer master data with all attribute types']);
  
  console.log('✅ Customer model created');
  return createResult.rows[0];
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
  createCustomerAttributes()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createCustomerAttributes };
