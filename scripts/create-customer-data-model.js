const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

if (!process.env.DATABASE_URL) {
  console.error('Missing required DATABASE_URL environment variable')
  process.exit(1)
}

async function createCustomerDataModel() {
  const client = await pool.connect()
  
  try {
    console.log('🏢 Creating Customer Data space and model...')

    // Get the first admin user to be the creator
    const userResult = await client.query(`
      SELECT * FROM public.users 
      WHERE role IN ('SUPER_ADMIN', 'ADMIN')
      ORDER BY created_at DESC
      LIMIT 1
    `)

    if (userResult.rows.length === 0) {
      console.error('❌ No admin users found. Please create an admin user first.')
      return
    }

    const adminUser = userResult.rows[0]
    console.log(`👤 Using admin user: ${adminUser.name || adminUser.email}`)

    // Check if Customer Data space already exists
    const spaceCheckResult = await client.query(`
      SELECT * FROM public.spaces 
      WHERE slug = 'customer-data' OR name = 'Customer Data'
    `)

    let customerSpace
    if (spaceCheckResult.rows.length > 0) {
      customerSpace = spaceCheckResult.rows[0]
      console.log(`📁 Customer Data space already exists: ${customerSpace.name}`)
    } else {
      // Create the Customer Data space
      const spaceResult = await client.query(`
        INSERT INTO public.spaces (name, slug, description, is_default, is_active, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        'Customer Data',
        'customer-data',
        'Customer information management workspace',
        false,
        true,
        adminUser.id
      ])

      customerSpace = spaceResult.rows[0]
      console.log(`✅ Created Customer Data space: ${customerSpace.name} (ID: ${customerSpace.id})`)
    }

    // Check if customer model already exists (by name)
    const modelCheckResult = await client.query(`
      SELECT * FROM public.data_models 
      WHERE name = 'customer'
    `)

    let customerModel
    if (modelCheckResult.rows.length > 0) {
      customerModel = modelCheckResult.rows[0]
      console.log(`📋 Customer model already exists: ${customerModel.display_name || customerModel.name}`)
    } else {
      // Create the customer data model (no space_id column)
      const modelResult = await client.query(`
        INSERT INTO public.data_models (id, name, description, created_by, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, NOW())
        RETURNING *
      `, [
        'customer',
        'Customer information and contact details',
        adminUser.id
      ])

      customerModel = modelResult.rows[0]
      console.log(`✅ Created customer model: ${customerModel.name} (ID: ${customerModel.id})`)
    }

    // Ensure model is linked to the space in data_model_spaces
    const dmsCheck = await client.query(`
      SELECT 1 FROM public.data_model_spaces 
      WHERE data_model_id = $1 AND space_id = $2
    `, [customerModel.id, customerSpace.id])

    if (dmsCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO public.data_model_spaces (id, data_model_id, space_id, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
      `, [customerModel.id, customerSpace.id])
      console.log(`✅ Linked model to space via data_model_spaces`)
    }

    // Create customer attributes
    const attributes = [
      // Basic Information
      { name: 'first_name', display_name: 'First Name', type: 'TEXT', required: true, order: 1 },
      { name: 'last_name', display_name: 'Last Name', type: 'TEXT', required: true, order: 2 },
      { name: 'email', display_name: 'Email Address', type: 'EMAIL', required: true, unique: true, order: 3 },
      { name: 'phone', display_name: 'Phone Number', type: 'PHONE', order: 4 },
      { name: 'company', display_name: 'Company', type: 'TEXT', order: 5 },
      
      // Demographics
      { name: 'age', display_name: 'Age', type: 'NUMBER', order: 6 },
      { name: 'gender', display_name: 'Gender', type: 'SELECT', order: 7, options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
      { name: 'birth_date', display_name: 'Birth Date', type: 'DATE', order: 8 },
      
      // Address Information
      { name: 'address', display_name: 'Address', type: 'TEXTAREA', order: 9 },
      { name: 'city', display_name: 'City', type: 'TEXT', order: 10 },
      { name: 'state', display_name: 'State/Province', type: 'TEXT', order: 11 },
      { name: 'postal_code', display_name: 'Postal Code', type: 'TEXT', order: 12 },
      { name: 'country', display_name: 'Country', type: 'TEXT', order: 13 },
      
      // Customer Status
      { name: 'customer_type', display_name: 'Customer Type', type: 'SELECT', order: 14, options: ['Individual', 'Business', 'VIP', 'Premium'] },
      { name: 'status', display_name: 'Status', type: 'SELECT', order: 15, options: ['Active', 'Inactive', 'Suspended', 'Prospect'] },
      { name: 'is_vip', display_name: 'VIP Customer', type: 'BOOLEAN', order: 16 },
      { name: 'registration_date', display_name: 'Registration Date', type: 'DATE', order: 17 },
      
      // Communication Preferences
      { name: 'preferred_contact', display_name: 'Preferred Contact Method', type: 'SELECT', order: 18, options: ['Email', 'Phone', 'SMS', 'Mail'] },
      { name: 'newsletter_subscribed', display_name: 'Newsletter Subscribed', type: 'BOOLEAN', order: 19 },
      { name: 'marketing_consent', display_name: 'Marketing Consent', type: 'BOOLEAN', order: 20 },
      
      // Additional Information
      { name: 'notes', display_name: 'Notes', type: 'TEXTAREA', order: 21 },
      { name: 'website', display_name: 'Website', type: 'URL', order: 22 },
      { name: 'annual_income', display_name: 'Annual Income', type: 'NUMBER', order: 23 },
      { name: 'credit_score', display_name: 'Credit Score', type: 'NUMBER', order: 24 },
      { name: 'last_login', display_name: 'Last Login', type: 'DATE', order: 25 }
    ]

    console.log(`📝 Creating ${attributes.length} customer attributes...`)

    for (const attr of attributes) {
      // Check if attribute already exists
      const attrCheckResult = await client.query(`
        SELECT * FROM public.data_model_attributes 
        WHERE name = $1 AND data_model_id = $2
      `, [attr.name, customerModel.id])

      if (attrCheckResult.rows.length === 0) {
        const attrResult = await client.query(`
          INSERT INTO public.data_model_attributes (
            name, display_name, type, required, is_unique, "order", 
            validation_rules, options, data_model_id, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `, [
          attr.name,
          attr.display_name,
          attr.type,
          attr.required || false,
          attr.unique || false,
          attr.order,
          attr.validation_rules || null,
          attr.options ? JSON.stringify(attr.options) : null,
          customerModel.id,
          adminUser.id
        ])

        console.log(`  ✅ Created attribute: ${attr.display_name} (${attr.type})`)
      } else {
        console.log(`  ⏭️  Attribute already exists: ${attr.display_name}`)
      }
    }

    console.log(`\n🎉 Customer data model setup completed successfully!`)
    console.log(`📁 Space: ${customerSpace.name} (ID: ${customerSpace.id})`)
    console.log(`📋 Model: ${customerModel.display_name} (ID: ${customerModel.id})`)
    console.log(`📝 Attributes: ${attributes.length} created`)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    throw error
  } finally {
    client.release()
  }
}

// Run the script
if (require.main === module) {
  createCustomerDataModel()
    .then(() => {
      console.log('✅ Customer data model creation completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Customer data model creation failed:', error)
      process.exit(1)
    })
}

module.exports = { createCustomerDataModel }
