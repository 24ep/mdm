const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function createCustomerSpaceComplete() {
  console.log('🏢 Creating Complete Customer Data Management Space');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    maxUses: 7500,
  });

  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connection successful!');
    
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // 1. Get or create admin user
      console.log('\n👤 Setting up admin user...');
      let adminUser;
      
      const existingUser = await client.query(
        'SELECT id, email, name, role FROM users WHERE email = $1 LIMIT 1',
        ['admin@example.com']
      );
      
      if (existingUser.rows.length > 0) {
        adminUser = existingUser.rows[0];
        console.log('✅ Admin user exists:', adminUser.name);
      } else {
        console.log('🔧 Creating admin user...');
        const hashedPassword = await bcrypt.hash('admin123', 12);
        const newUser = await client.query(`
          INSERT INTO users (email, name, password, role) 
          VALUES ($1, $2, $3, $4)
          RETURNING id, email, name, role
        `, ['admin@example.com', 'Admin User', hashedPassword, 'ADMIN']);
        
        adminUser = newUser.rows[0];
        console.log('✅ Admin user created:', adminUser.name);
      }
      
      // 2. Create Customer Data Management Space
      console.log('\n🏢 Creating Customer Data Management Space...');
      const space = await client.query(`
        INSERT INTO spaces (
          name, description, is_default, is_active, created_by, slug,
          icon, logo_url, features, sidebar_config,
          enable_assignments, enable_bulk_activity, enable_workflows, enable_dashboard
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, name, slug
      `, [
        'Customer Data Management',
        'Comprehensive customer data management system for tracking customer information, interactions, and business relationships',
        true, // is_default
        true, // is_active
        adminUser.id,
        'customer-data-management',
        'users', // icon
        null, // logo_url
        JSON.stringify({
          assignments: true,
          bulk_activity: true,
          workflows: true,
          dashboard: true
        }),
        JSON.stringify({
          style: {
            backgroundType: 'color',
            backgroundColor: '#1e40af',
            fontColor: '#ffffff',
            size: 'medium'
          },
          menu: [
            { title: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard' },
            { title: 'Customers', href: '/customers', icon: 'users' },
            { title: 'Data Models', href: '/data-models', icon: 'database' },
            { title: 'Reports', href: '/reports', icon: 'bar-chart' },
            { title: 'Settings', href: '/settings', icon: 'settings' }
          ]
        }),
        true, // enable_assignments
        true, // enable_bulk_activity
        true, // enable_workflows
        true  // enable_dashboard
      ]);
      
      const newSpace = space.rows[0];
      console.log('✅ Customer Data Management Space created:', newSpace.name);
      
      // 3. Add admin user to space
      console.log('\n👥 Adding admin user to space...');
      await client.query(`
        INSERT INTO space_members (space_id, user_id, role)
        VALUES ($1, $2, $3)
      `, [newSpace.id, adminUser.id, 'ADMIN']);
      console.log('✅ Admin user added to space');
      
      // 4. Create Customer Data Model
      console.log('\n📊 Creating Customer Data Model...');
      const dataModel = await client.query(`
        INSERT INTO data_models (name, description, created_by, sort_order)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name
      `, [
        'Customer Information',
        'Comprehensive customer data model for managing customer information, contact details, and business relationships',
        adminUser.id,
        1
      ]);
      
      const newDataModel = dataModel.rows[0];
      console.log('✅ Customer Data Model created:', newDataModel.name);
      
      // 5. Link data model to space
      console.log('\n🔗 Linking data model to space...');
      await client.query(`
        INSERT INTO data_model_spaces (data_model_id, space_id)
        VALUES ($1, $2)
      `, [newDataModel.id, newSpace.id]);
      console.log('✅ Data model linked to space');
      
      // 6. Create Customer Attributes with Options
      console.log('\n🏷️ Creating Customer Attributes...');
      const customerAttributes = [
        // Basic Information
        { 
          name: 'First Name', 
          type: 'text', 
          description: 'Customer first name',
          required: true
        },
        { 
          name: 'Last Name', 
          type: 'text', 
          description: 'Customer last name',
          required: true
        },
        { 
          name: 'Email', 
          type: 'email', 
          description: 'Primary email address',
          required: true
        },
        { 
          name: 'Phone', 
          type: 'text', 
          description: 'Primary phone number',
          required: false
        },
        { 
          name: 'Company', 
          type: 'text', 
          description: 'Company or organization name',
          required: false
        },
        { 
          name: 'Job Title', 
          type: 'text', 
          description: 'Job title or position',
          required: false
        },
        
        // Address Information
        { 
          name: 'Street Address', 
          type: 'text', 
          description: 'Street address',
          required: false
        },
        { 
          name: 'City', 
          type: 'text', 
          description: 'City',
          required: false
        },
        { 
          name: 'State/Province', 
          type: 'text', 
          description: 'State or province',
          required: false
        },
        { 
          name: 'Postal Code', 
          type: 'text', 
          description: 'Postal or ZIP code',
          required: false
        },
        { 
          name: 'Country', 
          type: 'select', 
          description: 'Country',
          required: false,
          options: ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 'Japan', 'Other']
        },
        
        // Business Information
        { 
          name: 'Industry', 
          type: 'select', 
          description: 'Industry or sector',
          required: false,
          options: ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Government', 'Non-profit', 'Other']
        },
        { 
          name: 'Company Size', 
          type: 'select', 
          description: 'Number of employees',
          required: false,
          options: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
        },
        { 
          name: 'Annual Revenue', 
          type: 'select', 
          description: 'Annual revenue range',
          required: false,
          options: ['< $1M', '$1M - $10M', '$10M - $50M', '$50M - $100M', '$100M - $500M', '> $500M']
        },
        
        // Customer Status
        { 
          name: 'Customer Status', 
          type: 'select', 
          description: 'Current customer status',
          required: true,
          options: ['Lead', 'Prospect', 'Customer', 'VIP', 'Inactive', 'Churned']
        },
        { 
          name: 'Customer Since', 
          type: 'date', 
          description: 'Date became a customer',
          required: false
        },
        { 
          name: 'Last Contact', 
          type: 'date', 
          description: 'Last contact date',
          required: false
        },
        { 
          name: 'Next Follow-up', 
          type: 'date', 
          description: 'Next scheduled follow-up',
          required: false
        },
        
        // Additional Information
        { 
          name: 'Priority', 
          type: 'select', 
          description: 'Customer priority level',
          required: false,
          options: ['Low', 'Medium', 'High', 'Critical']
        },
        { 
          name: 'Source', 
          type: 'select', 
          description: 'How they found us',
          required: false,
          options: ['Website', 'Referral', 'Social Media', 'Advertisement', 'Trade Show', 'Cold Call', 'Other']
        },
        { 
          name: 'Tags', 
          type: 'text', 
          description: 'Comma-separated tags for categorization',
          required: false
        },
        { 
          name: 'Notes', 
          type: 'textarea', 
          description: 'Additional notes and comments',
          required: false
        }
      ];
      
      const createdAttributes = [];
      for (const attr of customerAttributes) {
        const attribute = await client.query(`
          INSERT INTO attributes (name, code, type, data_model_id, description)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, name, type
        `, [attr.name, attr.code, attr.type, newDataModel.id, attr.description]);
        
        createdAttributes.push(attribute.rows[0]);
        console.log(`  ✅ Created attribute: ${attr.name} (${attr.type})`);
      }
      
      console.log(`✅ Created ${createdAttributes.length} customer attributes`);
      
      // 7. Create sample customer records
      console.log('\n👥 Creating sample customer records...');
      const sampleCustomers = [
        {
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@techcorp.com',
          phone: '+1-555-0123',
          company: 'TechCorp Solutions',
          jobTitle: 'CEO',
          industry: 'Technology',
          companySize: '51-200',
          annualRevenue: '$10M - $50M',
          customerStatus: 'Customer',
          customerSince: '2023-01-15',
          lastContact: '2024-01-10',
          nextFollowUp: '2024-02-10',
          priority: 'High',
          source: 'Website',
          tags: 'enterprise,tech,high-value',
          notes: 'Important customer with high priority. Very responsive to communication.'
        },
        {
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@innovate.com',
          phone: '+1-555-0456',
          company: 'Innovate Inc',
          jobTitle: 'Marketing Director',
          industry: 'Marketing',
          companySize: '11-50',
          annualRevenue: '$1M - $10M',
          customerStatus: 'Prospect',
          lastContact: '2024-01-05',
          nextFollowUp: '2024-01-20',
          priority: 'Medium',
          source: 'Referral',
          tags: 'startup,marketing,potential',
          notes: 'Interested in our marketing automation features. Follow up scheduled.'
        },
        {
          firstName: 'Michael',
          lastName: 'Brown',
          email: 'michael.brown@global.com',
          phone: '+1-555-0789',
          company: 'Global Enterprises',
          jobTitle: 'Operations Manager',
          industry: 'Manufacturing',
          companySize: '1000+',
          annualRevenue: '> $500M',
          customerStatus: 'VIP',
          customerSince: '2022-06-01',
          lastContact: '2024-01-08',
          nextFollowUp: '2024-01-25',
          priority: 'Critical',
          source: 'Trade Show',
          tags: 'enterprise,manufacturing,vip',
          notes: 'VIP customer with large enterprise needs. Dedicated account manager assigned.'
        },
        {
          firstName: 'Emily',
          lastName: 'Davis',
          email: 'emily.davis@healthcare.org',
          phone: '+1-555-0321',
          company: 'Healthcare Solutions',
          jobTitle: 'IT Director',
          industry: 'Healthcare',
          companySize: '201-500',
          annualRevenue: '$50M - $100M',
          customerStatus: 'Customer',
          customerSince: '2023-08-20',
          lastContact: '2024-01-12',
          nextFollowUp: '2024-02-01',
          priority: 'High',
          source: 'Website',
          tags: 'healthcare,compliance,security',
          notes: 'Healthcare customer with strict compliance requirements. Security-focused.'
        },
        {
          firstName: 'David',
          lastName: 'Wilson',
          email: 'david.wilson@startup.io',
          phone: '+1-555-0654',
          company: 'StartupCo',
          jobTitle: 'Founder',
          industry: 'Technology',
          companySize: '1-10',
          annualRevenue: '< $1M',
          customerStatus: 'Lead',
          lastContact: '2024-01-15',
          nextFollowUp: '2024-01-22',
          priority: 'Medium',
          source: 'Social Media',
          tags: 'startup,tech,early-stage',
          notes: 'Early-stage startup. Price-sensitive but high growth potential.'
        }
      ];
      
      for (const customer of sampleCustomers) {
        // Create data record
        const dataRecord = await client.query(`
          INSERT INTO data_records (data_model_id, created_by)
          VALUES ($1, $2)
          RETURNING id
        `, [newDataModel.id, adminUser.id]);
        
        const recordId = dataRecord.rows[0].id;
        
        // Create attribute values
        const attributeMap = {
          'First Name': customer.firstName,
          'Last Name': customer.lastName,
          'Email': customer.email,
          'Phone': customer.phone,
          'Company': customer.company,
          'Job Title': customer.jobTitle,
          'Industry': customer.industry,
          'Company Size': customer.companySize,
          'Annual Revenue': customer.annualRevenue,
          'Customer Status': customer.customerStatus,
          'Customer Since': customer.customerSince,
          'Last Contact': customer.lastContact,
          'Next Follow-up': customer.nextFollowUp,
          'Priority': customer.priority,
          'Source': customer.source,
          'Tags': customer.tags,
          'Notes': customer.notes
        };
        
        for (const [attrName, value] of Object.entries(attributeMap)) {
          if (value) {
            const attr = createdAttributes.find(a => a.name === attrName);
            if (attr) {
              await client.query(`
                INSERT INTO data_record_values (data_record_id, attribute_id, value)
                VALUES ($1, $2, $3)
              `, [recordId, attr.id, value]);
            }
          }
        }
        
        console.log(`  ✅ Created customer: ${customer.firstName} ${customer.lastName} (${customer.company})`);
      }
      
      // 8. Create system settings
      console.log('\n⚙️ Creating system settings...');
      const systemSettings = [
        { key: 'app_name', value: 'Customer Data Management' },
        { key: 'app_version', value: '1.0.0' },
        { key: 'default_currency', value: 'USD' },
        { key: 'timezone', value: 'UTC' },
        { key: 'date_format', value: 'YYYY-MM-DD' },
        { key: 'items_per_page', value: '25' },
        { key: 'enable_notifications', value: 'true' },
        { key: 'enable_audit_log', value: 'true' },
        { key: 'max_file_size', value: '10485760' }, // 10MB
        { key: 'allowed_file_types', value: 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif' }
      ];
      
      for (const setting of systemSettings) {
        await client.query(`
          INSERT INTO system_settings (key, value)
          VALUES ($1, $2)
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `, [setting.key, setting.value]);
      }
      
      console.log('✅ System settings created');
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('\n🎉 Customer Data Management Space Setup Complete!');
      console.log('\n📋 Summary:');
      console.log(`  ✅ Space: ${newSpace.name} (${newSpace.slug})`);
      console.log(`  ✅ Data Model: ${newDataModel.name}`);
      console.log(`  ✅ Attributes: ${createdAttributes.length} customer attributes`);
      console.log(`  ✅ Sample Data: ${sampleCustomers.length} customer records`);
      console.log(`  ✅ System Settings: ${systemSettings.length} configuration settings`);
      console.log(`  ✅ Admin User: ${adminUser.name} (${adminUser.email})`);
      
      console.log('\n🎯 Login Credentials:');
      console.log('  Email: admin@example.com');
      console.log('  Password: admin123');
      
      console.log('\n🚀 Ready to use! The Customer Data Management space includes:');
      console.log('  - Complete customer data model with 20+ attributes');
      console.log('  - Sample customer records with realistic data');
      console.log('  - System settings and configuration');
      console.log('  - Proper space and user management');
      console.log('  - Attribute options for dropdowns and selects');
      
      console.log('\n📊 Customer Attributes Created:');
      console.log('  - Basic Info: First Name, Last Name, Email, Phone, Company, Job Title');
      console.log('  - Address: Street, City, State, Postal Code, Country');
      console.log('  - Business: Industry, Company Size, Annual Revenue');
      console.log('  - Status: Customer Status, Customer Since, Last Contact, Next Follow-up');
      console.log('  - Additional: Priority, Source, Tags, Notes');
      
      console.log('\n👥 Sample Customers:');
      sampleCustomers.forEach((customer, index) => {
        console.log(`  ${index + 1}. ${customer.firstName} ${customer.lastName} (${customer.company}) - ${customer.customerStatus}`);
      });
      
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('❌ Error during setup, transaction rolled back:', error.message);
      throw error;
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

createCustomerSpaceComplete();
