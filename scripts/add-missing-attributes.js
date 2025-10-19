#!/usr/bin/env node

/**
 * Script to add missing attribute types to the customer data model
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addMissingAttributes() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding missing attribute types to customer model...');
    
    // Get the customer model
    const modelResult = await client.query(`
      SELECT * FROM public.data_models WHERE name = 'customer'
    `);
    
    if (modelResult.rows.length === 0) {
      console.log('❌ Customer model not found');
      return;
    }
    
    const customerModel = modelResult.rows[0];
    console.log(`📋 Found customer model: ${customerModel.display_name}`);
    
    // Get existing attribute types
    const existingResult = await client.query(`
      SELECT type, COUNT(*) as count 
      FROM public.data_model_attributes 
      WHERE data_model_id = $1
      GROUP BY type
    `, [customerModel.id]);
    
    const existingTypes = existingResult.rows.map(row => row.type);
    console.log('📊 Existing attribute types:', existingTypes);
    
    // Define all expected attribute types with examples
    const allAttributeTypes = [
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
        order: 50
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
        order: 51
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
        order: 52
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
        order: 60
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
        order: 61
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
        order: 62
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
        order: 70
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
        order: 71
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
        order: 80
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
        order: 81
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
        order: 90
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
        order: 91
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
        order: 100
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
        order: 101
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
        order: 110
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
        order: 111
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
        order: 112
      }
    ];
    
    // Filter out attributes that already exist
    const attributesToAdd = allAttributeTypes.filter(attr => {
      // Check if attribute with same name exists
      return !existingTypes.includes(attr.type);
    });
    
    if (attributesToAdd.length === 0) {
      console.log('✅ All attribute types already exist');
      return;
    }
    
    console.log(`📋 Adding ${attributesToAdd.length} missing attribute types...`);
    
    // Insert missing attributes
    for (const attr of attributesToAdd) {
      try {
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
        console.log(`✅ Added ${attr.type} attribute: ${attr.display_name}`);
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`⚠️  Attribute ${attr.name} already exists, skipping...`);
        } else {
          console.error(`❌ Error adding ${attr.display_name}:`, error.message);
        }
      }
    }
    
    console.log('🎉 Missing attribute types added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding missing attributes:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script
if (require.main === module) {
  addMissingAttributes()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addMissingAttributes };
