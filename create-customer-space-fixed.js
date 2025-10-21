require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management'
});

async function createCustomerSpaceComplete() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🏢 Creating Complete Customer Data Management Space');
    
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
    
    // 2. Create Customer Data Management Space
    console.log('\n🏢 Creating Customer Data Management Space...');
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
    
    const newSpace = space.rows[0];
    console.log(`✅ Customer Data Management Space created: ${newSpace.name}`);
    
    // 3. Add admin user to space
    console.log('\n👥 Adding admin user to space...');
    await client.query(`
      INSERT INTO space_members (space_id, user_id, role, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (space_id, user_id) DO NOTHING
    `, [newSpace.id, adminUser.id, 'admin']);
    console.log('✅ Admin user added to space');
    
    // 4. Create Customer Data Model
    console.log('\n📊 Creating Customer Data Model...');
    const dataModel = await client.query(`
      INSERT INTO data_models (name, description, space_id, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name
    `, [
      'Customer Information',
      'Complete customer data model with contact info, business details, and status tracking',
      newSpace.id,
      adminUser.id
    ]);
    
    const newDataModel = dataModel.rows[0];
    console.log(`✅ Customer Data Model created: ${newDataModel.name}`);
    
    // 5. Link data model to space
    console.log('\n🔗 Linking data model to space...');
    await client.query(`
      INSERT INTO data_model_spaces (data_model_id, space_id, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT (data_model_id, space_id) DO NOTHING
    `, [newDataModel.id, newSpace.id]);
    console.log('✅ Data model linked to space');
    
    // 6. Create Customer Attributes with proper code field
    console.log('\n🏷️ Creating Customer Attributes...');
    const customerAttributes = [
      // Basic Information
      { 
        name: 'First Name', 
        code: 'first_name',
        type: 'text', 
        description: 'Customer first name',
        required: true
      },
      { 
        name: 'Last Name', 
        code: 'last_name',
        type: 'text', 
        description: 'Customer last name',
        required: true
      },
      { 
        name: 'Email', 
        code: 'email',
        type: 'email', 
        description: 'Primary email address',
        required: true
      },
      { 
        name: 'Phone', 
        code: 'phone',
        type: 'text', 
        description: 'Primary phone number',
        required: false
      },
      { 
        name: 'Company', 
        code: 'company',
        type: 'text', 
        description: 'Company or organization name',
        required: false
      },
      { 
        name: 'Job Title', 
        code: 'job_title',
        type: 'text', 
        description: 'Job title or position',
        required: false
      },
      
      // Address Information
      { 
        name: 'Street Address', 
        code: 'street_address',
        type: 'text', 
        description: 'Street address',
        required: false
      },
      { 
        name: 'City', 
        code: 'city',
        type: 'text', 
        description: 'City',
        required: false
      },
      { 
        name: 'State/Province', 
        code: 'state_province',
        type: 'text', 
        description: 'State or province',
        required: false
      },
      { 
        name: 'Postal Code', 
        code: 'postal_code',
        type: 'text', 
        description: 'Postal or ZIP code',
        required: false
      },
      { 
        name: 'Country', 
        code: 'country',
        type: 'select', 
        description: 'Country',
        required: false,
        options: ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 'Japan', 'Other']
      },
      
      // Business Information
      { 
        name: 'Industry', 
        code: 'industry',
        type: 'select', 
        description: 'Industry or sector',
        required: false,
        options: ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Government', 'Non-profit', 'Other']
      },
      { 
        name: 'Company Size', 
        code: 'company_size',
        type: 'select', 
        description: 'Number of employees',
        required: false,
        options: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
      },
      { 
        name: 'Annual Revenue', 
        code: 'annual_revenue',
        type: 'select', 
        description: 'Annual revenue range',
        required: false,
        options: ['< $1M', '$1M - $10M', '$10M - $50M', '$50M - $100M', '$100M - $500M', '> $500M']
      },
      
      // Customer Status
      { 
        name: 'Customer Status', 
        code: 'customer_status',
        type: 'select', 
        description: 'Current customer status',
        required: true,
        options: ['Lead', 'Prospect', 'Customer', 'VIP', 'Inactive', 'Churned']
      },
      { 
        name: 'Customer Since', 
        code: 'customer_since',
        type: 'date', 
        description: 'Date became a customer',
        required: false
      },
      { 
        name: 'Last Contact', 
        code: 'last_contact',
        type: 'date', 
        description: 'Last contact date',
        required: false
      },
      { 
        name: 'Next Follow-up', 
        code: 'next_followup',
        type: 'date', 
        description: 'Next scheduled follow-up',
        required: false
      },
      
      // Additional Information
      { 
        name: 'Priority', 
        code: 'priority',
        type: 'select', 
        description: 'Customer priority level',
        required: false,
        options: ['Low', 'Medium', 'High', 'Critical']
      },
      { 
        name: 'Source', 
        code: 'source',
        type: 'select', 
        description: 'How they found us',
        required: false,
        options: ['Website', 'Referral', 'Social Media', 'Advertisement', 'Trade Show', 'Cold Call', 'Other']
      },
      { 
        name: 'Tags', 
        code: 'tags',
        type: 'text', 
        description: 'Comma-separated tags for categorization',
        required: false
      },
      { 
        name: 'Notes', 
        code: 'notes',
        type: 'textarea', 
        description: 'Additional notes and comments',
        required: false
      }
    ];
    
    const createdAttributes = [];
    for (const attr of customerAttributes) {
      const attribute = await client.query(`
        INSERT INTO attributes (name, code, type, data_model_id, description, is_required, display_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, type
      `, [attr.name, attr.code, attr.type, newDataModel.id, attr.description, attr.required, createdAttributes.length]);
      
      createdAttributes.push(attribute.rows[0]);
      console.log(`  ✅ Created attribute: ${attr.name} (${attr.type})`);
      
      // Create attribute options for select fields
      if (attr.options && attr.options.length > 0) {
        for (const option of attr.options) {
          await client.query(`
            INSERT INTO attribute_options (attribute_id, value, label, display_order, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
          `, [attribute.rows[0].id, option, option, attr.options.indexOf(option)]);
        }
        console.log(`    📋 Added ${attr.options.length} options for ${attr.name}`);
      }
    }
    
    console.log(`✅ Created ${createdAttributes.length} customer attributes`);
    
    // 7. Create sample customer records
    console.log('\n👥 Creating sample customer records...');
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
          customer_status: 'Customer',
          priority: 'High',
          source: 'Website',
          industry: 'Technology',
          company_size: '51-200',
          annual_revenue: '$10M - $50M',
          notes: 'Key decision maker for enterprise software purchases'
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
          customer_status: 'Prospect',
          priority: 'Medium',
          source: 'Referral',
          industry: 'Healthcare',
          company_size: '201-500',
          annual_revenue: '$50M - $100M',
          notes: 'Interested in HIPAA-compliant solutions'
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
          customer_status: 'Lead',
          priority: 'Low',
          source: 'Social Media',
          industry: 'Retail',
          company_size: '501-1000',
          annual_revenue: '$100M - $500M',
          notes: 'Looking for inventory management solutions'
        }
      }
    ];
    
    const createdRecords = [];
    for (const customer of sampleCustomers) {
      const record = await client.query(`
        INSERT INTO data_records (data_model_id, name, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, name
      `, [newDataModel.id, customer.name, adminUser.id]);
      
      const newRecord = record.rows[0];
      createdRecords.push(newRecord);
      
      // Create record values
      for (const [key, value] of Object.entries(customer.values)) {
        const attribute = createdAttributes.find(attr => attr.name === key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
        if (attribute && value) {
          await client.query(`
            INSERT INTO data_record_values (record_id, attribute_id, value, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
          `, [newRecord.id, attribute.id, value.toString()]);
        }
      }
      
      console.log(`  ✅ Created customer record: ${customer.name}`);
    }
    
    console.log(`✅ Created ${createdRecords.length} sample customer records`);
    
    await client.query('COMMIT');
    console.log('\n🎉 Customer Data Management Space setup complete!');
    console.log(`📊 Space: ${newSpace.name} (${newSpace.slug})`);
    console.log(`📋 Data Model: ${newDataModel.name}`);
    console.log(`🏷️ Attributes: ${createdAttributes.length}`);
    console.log(`👥 Sample Records: ${createdRecords.length}`);
    
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
    await createCustomerSpaceComplete();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
