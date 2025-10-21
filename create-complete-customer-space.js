require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management'
});

async function createCompleteCustomerSpace() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🏢 Creating Complete Customer Data Management Space');
    console.log('================================================');
    
    // Test connection
    const connectionTest = await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL connection successful!');
    
    // 1. Get or create admin user
    console.log('\n👤 Setting up admin user...');
    let adminUser;
    const adminCheck = await client.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      ['admin@example.com']
    );
    
    if (adminCheck.rows.length > 0) {
      adminUser = adminCheck.rows[0];
      console.log(`✅ Admin user exists: ${adminUser.name}`);
    } else {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = await client.query(`
        INSERT INTO users (name, email, password, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, name, email
      `, ['Admin User', 'admin@example.com', hashedPassword, 'admin']);
      adminUser = newAdmin.rows[0];
      console.log(`✅ Admin user created: ${adminUser.name}`);
    }
    
    // 2. Create or get Customer Data Management Space
    console.log('\n🏢 Setting up Customer Data Management Space...');
    let customerSpace;
    const existingSpace = await client.query(`
      SELECT id, name, slug FROM spaces WHERE slug = 'customer-data-management'
    `);
    
    if (existingSpace.rows.length > 0) {
      customerSpace = existingSpace.rows[0];
      console.log(`✅ Found existing space: ${customerSpace.name} (${customerSpace.slug})`);
    } else {
      const space = await client.query(`
        INSERT INTO spaces (name, slug, description, icon, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, name, slug
      `, [
        'Customer Data Management',
        'customer-data-management',
        'Complete customer data management system with CRM functionality',
        'users',
        adminUser.id
      ]);
      
      customerSpace = space.rows[0];
      console.log(`✅ Customer Data Management Space created: ${customerSpace.name}`);
    }
    
    // 3. Add admin user to space
    console.log('\n👥 Adding admin user to space...');
    const existingMember = await client.query(`
      SELECT id FROM space_members WHERE space_id = $1 AND user_id = $2
    `, [customerSpace.id, adminUser.id]);
    
    if (existingMember.rows.length === 0) {
      await client.query(`
        INSERT INTO space_members (space_id, user_id, role, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
      `, [customerSpace.id, adminUser.id, 'admin']);
      console.log('✅ Admin user added to space');
    } else {
      console.log('✅ Admin user already a member of space');
    }
    
    // 4. Create Customer Data Model
    console.log('\n📊 Creating Customer Data Model...');
    let customerDataModel;
    const existingDataModel = await client.query(`
      SELECT id, name FROM data_models 
      WHERE name = 'Customer Information' AND space_id = $1
    `, [customerSpace.id]);
    
    if (existingDataModel.rows.length > 0) {
      customerDataModel = existingDataModel.rows[0];
      console.log(`✅ Found existing data model: ${customerDataModel.name}`);
    } else {
      const dataModel = await client.query(`
        INSERT INTO data_models (name, description, space_id, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, name
      `, [
        'Customer Information',
        'Complete customer data model with contact info, business details, and status tracking',
        customerSpace.id,
        adminUser.id
      ]);
      
      customerDataModel = dataModel.rows[0];
      console.log(`✅ Customer Data Model created: ${customerDataModel.name}`);
    }
    
    // 5. Link data model to space
    console.log('\n🔗 Linking data model to space...');
    const existingLink = await client.query(`
      SELECT id FROM data_model_spaces WHERE data_model_id = $1 AND space_id = $2
    `, [customerDataModel.id, customerSpace.id]);
    
    if (existingLink.rows.length === 0) {
      await client.query(`
        INSERT INTO data_model_spaces (data_model_id, space_id, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
      `, [customerDataModel.id, customerSpace.id]);
      console.log('✅ Data model linked to space');
    } else {
      console.log('✅ Data model already linked to space');
    }
    
    // 6. Clear existing attributes and recreate them
    console.log('\n🏷️ Setting up Customer Attributes...');
    
    // Delete existing attributes for this data model
    await client.query(`
      DELETE FROM attributes WHERE data_model_id = $1
    `, [customerDataModel.id]);
    console.log('🧹 Cleared existing attributes');
    
    // Create comprehensive customer attributes
    const customerAttributes = [
      // Basic Information
      { 
        name: 'First Name', 
        code: 'first_name',
        type: 'text', 
        description: 'Customer first name',
        required: true,
        display_order: 1
      },
      { 
        name: 'Last Name', 
        code: 'last_name',
        type: 'text', 
        description: 'Customer last name',
        required: true,
        display_order: 2
      },
      { 
        name: 'Email', 
        code: 'email',
        type: 'email', 
        description: 'Primary email address',
        required: true,
        display_order: 3
      },
      { 
        name: 'Phone', 
        code: 'phone',
        type: 'text', 
        description: 'Primary phone number',
        required: false,
        display_order: 4
      },
      { 
        name: 'Company', 
        code: 'company',
        type: 'text', 
        description: 'Company or organization name',
        required: false,
        display_order: 5
      },
      { 
        name: 'Job Title', 
        code: 'job_title',
        type: 'text', 
        description: 'Job title or position',
        required: false,
        display_order: 6
      },
      
      // Address Information
      { 
        name: 'Street Address', 
        code: 'street_address',
        type: 'text', 
        description: 'Street address',
        required: false,
        display_order: 7
      },
      { 
        name: 'City', 
        code: 'city',
        type: 'text', 
        description: 'City',
        required: false,
        display_order: 8
      },
      { 
        name: 'State/Province', 
        code: 'state_province',
        type: 'text', 
        description: 'State or province',
        required: false,
        display_order: 9
      },
      { 
        name: 'Postal Code', 
        code: 'postal_code',
        type: 'text', 
        description: 'Postal or ZIP code',
        required: false,
        display_order: 10
      },
      { 
        name: 'Country', 
        code: 'country',
        type: 'select', 
        description: 'Country',
        required: false,
        display_order: 11,
        options: ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 'Japan', 'Other']
      },
      
      // Business Information
      { 
        name: 'Industry', 
        code: 'industry',
        type: 'select', 
        description: 'Industry or sector',
        required: false,
        display_order: 12,
        options: ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Government', 'Non-profit', 'Other']
      },
      { 
        name: 'Company Size', 
        code: 'company_size',
        type: 'select', 
        description: 'Number of employees',
        required: false,
        display_order: 13,
        options: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
      },
      { 
        name: 'Annual Revenue', 
        code: 'annual_revenue',
        type: 'select', 
        description: 'Annual revenue range',
        required: false,
        display_order: 14,
        options: ['< $1M', '$1M - $10M', '$10M - $50M', '$50M - $100M', '$100M - $500M', '> $500M']
      },
      
      // Customer Status
      { 
        name: 'Customer Status', 
        code: 'customer_status',
        type: 'select', 
        description: 'Current customer status',
        required: true,
        display_order: 15,
        options: ['Lead', 'Prospect', 'Customer', 'VIP', 'Inactive', 'Churned']
      },
      { 
        name: 'Customer Since', 
        code: 'customer_since',
        type: 'date', 
        description: 'Date became a customer',
        required: false,
        display_order: 16
      },
      { 
        name: 'Last Contact', 
        code: 'last_contact',
        type: 'date', 
        description: 'Last contact date',
        required: false,
        display_order: 17
      },
      { 
        name: 'Next Follow-up', 
        code: 'next_followup',
        type: 'date', 
        description: 'Next scheduled follow-up',
        required: false,
        display_order: 18
      },
      
      // Additional Information
      { 
        name: 'Priority', 
        code: 'priority',
        type: 'select', 
        description: 'Customer priority level',
        required: false,
        display_order: 19,
        options: ['Low', 'Medium', 'High', 'Critical']
      },
      { 
        name: 'Source', 
        code: 'source',
        type: 'select', 
        description: 'How they found us',
        required: false,
        display_order: 20,
        options: ['Website', 'Referral', 'Social Media', 'Advertisement', 'Trade Show', 'Cold Call', 'Other']
      },
      { 
        name: 'Tags', 
        code: 'tags',
        type: 'text', 
        description: 'Comma-separated tags for categorization',
        required: false,
        display_order: 21
      },
      { 
        name: 'Notes', 
        code: 'notes',
        type: 'textarea', 
        description: 'Additional notes and comments',
        required: false,
        display_order: 22
      }
    ];
    
    const createdAttributes = [];
    for (const attr of customerAttributes) {
      const attribute = await client.query(`
        INSERT INTO attributes (name, code, type, data_model_id, description, is_required, display_order, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, name, type, code
      `, [attr.name, attr.code, attr.type, customerDataModel.id, attr.description, attr.required, attr.display_order]);
      
      createdAttributes.push(attribute.rows[0]);
      console.log(`  ✅ Created attribute: ${attr.name} (${attr.type}) - Code: ${attr.code}`);
      
      // Create attribute options for select fields
      if (attr.options && attr.options.length > 0) {
        for (let i = 0; i < attr.options.length; i++) {
          const option = attr.options[i];
          await client.query(`
            INSERT INTO attribute_options (attribute_id, value, label, display_order, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
          `, [attribute.rows[0].id, option, option, i]);
        }
        console.log(`    📋 Added ${attr.options.length} options for ${attr.name}`);
      }
    }
    
    console.log(`✅ Created ${createdAttributes.length} customer attributes`);
    
    // 7. Clear existing records and create sample customer records
    console.log('\n👥 Creating sample customer records...');
    
    // Delete existing records for this data model
    await client.query(`
      DELETE FROM data_records WHERE data_model_id = $1
    `, [customerDataModel.id]);
    console.log('🧹 Cleared existing records');
    
    const sampleCustomers = [
      {
        name: 'John Smith',
        values: {
          first_name: 'John',
          last_name: 'Smith',
          email: 'john.smith@techcorp.com',
          phone: '+1-555-0123',
          company: 'TechCorp Solutions',
          job_title: 'CTO',
          street_address: '123 Tech Street',
          city: 'San Francisco',
          state_province: 'CA',
          postal_code: '94105',
          country: 'United States',
          industry: 'Technology',
          company_size: '51-200',
          annual_revenue: '$10M - $50M',
          customer_status: 'Customer',
          customer_since: '2023-01-15',
          last_contact: '2024-10-15',
          next_followup: '2024-11-15',
          priority: 'High',
          source: 'Website',
          tags: 'enterprise,tech,decision-maker',
          notes: 'Key decision maker for enterprise software purchases. Very interested in AI solutions.'
        }
      },
      {
        name: 'Sarah Johnson',
        values: {
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah.j@healthplus.com',
          phone: '+1-555-0456',
          company: 'HealthPlus Medical',
          job_title: 'IT Director',
          street_address: '456 Medical Plaza',
          city: 'Boston',
          state_province: 'MA',
          postal_code: '02101',
          country: 'United States',
          industry: 'Healthcare',
          company_size: '201-500',
          annual_revenue: '$50M - $100M',
          customer_status: 'Prospect',
          customer_since: null,
          last_contact: '2024-10-10',
          next_followup: '2024-10-25',
          priority: 'Medium',
          source: 'Referral',
          tags: 'healthcare,compliance,hipaa',
          notes: 'Interested in HIPAA-compliant solutions. Budget approved for Q1 2025.'
        }
      },
      {
        name: 'Mike Chen',
        values: {
          first_name: 'Mike',
          last_name: 'Chen',
          email: 'mike.chen@retailmax.com',
          phone: '+1-555-0789',
          company: 'RetailMax Stores',
          job_title: 'Operations Manager',
          street_address: '789 Commerce Blvd',
          city: 'Chicago',
          state_province: 'IL',
          postal_code: '60601',
          country: 'United States',
          industry: 'Retail',
          company_size: '501-1000',
          annual_revenue: '$100M - $500M',
          customer_status: 'Lead',
          customer_since: null,
          last_contact: '2024-10-05',
          next_followup: '2024-10-20',
          priority: 'Low',
          source: 'Social Media',
          tags: 'retail,inventory,operations',
          notes: 'Looking for inventory management solutions. Currently evaluating 3 vendors.'
        }
      },
      {
        name: 'Emily Davis',
        values: {
          first_name: 'Emily',
          last_name: 'Davis',
          email: 'emily.davis@financecorp.com',
          phone: '+1-555-0321',
          company: 'FinanceCorp International',
          job_title: 'CFO',
          street_address: '321 Wall Street',
          city: 'New York',
          state_province: 'NY',
          postal_code: '10005',
          country: 'United States',
          industry: 'Finance',
          company_size: '1000+',
          annual_revenue: '> $500M',
          customer_status: 'VIP',
          customer_since: '2022-06-01',
          last_contact: '2024-10-18',
          next_followup: '2024-11-01',
          priority: 'Critical',
          source: 'Referral',
          tags: 'finance,vip,enterprise',
          notes: 'VIP customer with $2M annual contract. Very satisfied with our services.'
        }
      },
      {
        name: 'David Wilson',
        values: {
          first_name: 'David',
          last_name: 'Wilson',
          email: 'david.wilson@startup.io',
          phone: '+1-555-0654',
          company: 'StartupIO',
          job_title: 'Founder & CEO',
          street_address: '654 Innovation Drive',
          city: 'Austin',
          state_province: 'TX',
          postal_code: '73301',
          country: 'United States',
          industry: 'Technology',
          company_size: '1-10',
          annual_revenue: '< $1M',
          customer_status: 'Prospect',
          customer_since: null,
          last_contact: '2024-10-12',
          next_followup: '2024-10-26',
          priority: 'Medium',
          source: 'Trade Show',
          tags: 'startup,tech,early-stage',
          notes: 'Early-stage startup. Very interested but budget is limited. Good fit for our startup program.'
        }
      }
    ];
    
    const createdRecords = [];
    for (const customer of sampleCustomers) {
      const record = await client.query(`
        INSERT INTO data_records (data_model_id, name, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, name
      `, [customerDataModel.id, customer.name, adminUser.id]);
      
      const newRecord = record.rows[0];
      createdRecords.push(newRecord);
      
      // Create record values for each attribute
      for (const [key, value] of Object.entries(customer.values)) {
        if (value !== null && value !== undefined && value !== '') {
          const attribute = createdAttributes.find(attr => attr.code === key);
          if (attribute) {
            await client.query(`
              INSERT INTO data_record_values (record_id, attribute_id, value, created_at, updated_at)
              VALUES ($1, $2, $3, NOW(), NOW())
            `, [newRecord.id, attribute.id, value.toString()]);
          }
        }
      }
      
      console.log(`  ✅ Created customer record: ${customer.name}`);
    }
    
    console.log(`✅ Created ${createdRecords.length} sample customer records`);
    
    // 8. Verify the setup
    console.log('\n🔍 Verifying setup...');
    
    // Check attributes
    const attributeCount = await client.query(`
      SELECT COUNT(*) as count FROM attributes WHERE data_model_id = $1
    `, [customerDataModel.id]);
    console.log(`📊 Attributes created: ${attributeCount.rows[0].count}`);
    
    // Check attribute options
    const optionCount = await client.query(`
      SELECT COUNT(*) as count FROM attribute_options ao
      JOIN attributes a ON ao.attribute_id = a.id
      WHERE a.data_model_id = $1
    `, [customerDataModel.id]);
    console.log(`📋 Attribute options created: ${optionCount.rows[0].count}`);
    
    // Check records
    const recordCount = await client.query(`
      SELECT COUNT(*) as count FROM data_records WHERE data_model_id = $1
    `, [customerDataModel.id]);
    console.log(`👥 Customer records created: ${recordCount.rows[0].count}`);
    
    // Check record values
    const valueCount = await client.query(`
      SELECT COUNT(*) as count FROM data_record_values drv
      JOIN data_records dr ON drv.record_id = dr.id
      WHERE dr.data_model_id = $1
    `, [customerDataModel.id]);
    console.log(`📝 Record values created: ${valueCount.rows[0].count}`);
    
    await client.query('COMMIT');
    console.log('\n🎉 Complete Customer Data Management Space setup finished!');
    console.log('================================================');
    console.log(`📊 Space: ${customerSpace.name} (${customerSpace.slug})`);
    console.log(`📋 Data Model: ${customerDataModel.name}`);
    console.log(`🏷️ Attributes: ${attributeCount.rows[0].count}`);
    console.log(`📋 Attribute Options: ${optionCount.rows[0].count}`);
    console.log(`👥 Customer Records: ${recordCount.rows[0].count}`);
    console.log(`📝 Record Values: ${valueCount.rows[0].count}`);
    console.log('\n✅ All data should now be visible in the UI!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during setup, transaction rolled back:', error.message);
    console.error('Error details:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await createCompleteCustomerSpace();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
