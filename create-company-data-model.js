require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management'
});

async function createCompanyDataModel() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🏢 Creating Company Data Model');
    console.log('============================');
    
    // Test connection
    const connectionTest = await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL connection successful!');
    
    // 1. Get admin user
    console.log('\n👤 Getting admin user...');
    const adminUser = await client.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      ['admin@example.com']
    );
    
    if (adminUser.rows.length === 0) {
      console.log('❌ Admin user not found! Please run the customer setup first.');
      return;
    }
    
    const admin = adminUser.rows[0];
    console.log(`✅ Admin user: ${admin.name}`);
    
    // 2. Get customer space
    console.log('\n🏢 Getting customer space...');
    const customerSpace = await client.query(`
      SELECT id, name, slug FROM spaces WHERE slug = 'customer-data-management'
    `);
    
    if (customerSpace.rows.length === 0) {
      console.log('❌ Customer space not found! Please run the customer setup first.');
      return;
    }
    
    const space = customerSpace.rows[0];
    console.log(`✅ Found space: ${space.name} (${space.slug})`);
    
    // 3. Create Company Data Model
    console.log('\n📊 Creating Company Data Model...');
    let companyDataModel;
    const existingDataModel = await client.query(`
      SELECT id, name FROM data_models 
      WHERE name = 'Company Information' AND space_id = $1
    `, [space.id]);
    
    if (existingDataModel.rows.length > 0) {
      companyDataModel = existingDataModel.rows[0];
      console.log(`✅ Found existing data model: ${companyDataModel.name}`);
    } else {
      const dataModel = await client.query(`
        INSERT INTO data_models (name, description, space_id, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, name
      `, [
        'Company Information',
        'Comprehensive company data model with business details, financial information, and organizational structure',
        space.id,
        admin.id
      ]);
      
      companyDataModel = dataModel.rows[0];
      console.log(`✅ Company Data Model created: ${companyDataModel.name}`);
    }
    
    // 4. Link data model to space
    console.log('\n🔗 Linking data model to space...');
    const existingLink = await client.query(`
      SELECT id FROM data_model_spaces WHERE data_model_id = $1 AND space_id = $2
    `, [companyDataModel.id, space.id]);
    
    if (existingLink.rows.length === 0) {
      await client.query(`
        INSERT INTO data_model_spaces (data_model_id, space_id, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
      `, [companyDataModel.id, space.id]);
      console.log('✅ Data model linked to space');
    } else {
      console.log('✅ Data model already linked to space');
    }
    
    // 5. Clear existing attributes and create company attributes
    console.log('\n🏷️ Creating Company Attributes...');
    await client.query(`DELETE FROM attributes WHERE data_model_id = $1`, [companyDataModel.id]);
    console.log('🧹 Cleared existing attributes');
    
    // Create comprehensive company attributes
    const companyAttributes = [
      // Basic Company Information
      { 
        name: 'Company Name', 
        code: 'company_name',
        type: 'text', 
        description: 'Official company name',
        required: true,
        display_order: 1
      },
      { 
        name: 'Legal Name', 
        code: 'legal_name',
        type: 'text', 
        description: 'Legal entity name',
        required: false,
        display_order: 2
      },
      { 
        name: 'DBA Name', 
        code: 'dba_name',
        type: 'text', 
        description: 'Doing Business As name',
        required: false,
        display_order: 3
      },
      { 
        name: 'Company Type', 
        code: 'company_type',
        type: 'select', 
        description: 'Type of business entity',
        required: true,
        display_order: 4,
        options: ['Corporation', 'LLC', 'Partnership', 'Sole Proprietorship', 'Non-Profit', 'Government', 'Other']
      },
      { 
        name: 'Industry', 
        code: 'industry',
        type: 'select', 
        description: 'Primary industry sector',
        required: true,
        display_order: 5,
        options: ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Government', 'Non-profit', 'Real Estate', 'Transportation', 'Energy', 'Entertainment', 'Other']
      },
      { 
        name: 'Website', 
        code: 'website',
        type: 'url', 
        description: 'Company website URL',
        required: false,
        display_order: 6
      },
      { 
        name: 'Email', 
        code: 'email',
        type: 'email', 
        description: 'Primary company email',
        required: false,
        display_order: 7
      },
      { 
        name: 'Phone', 
        code: 'phone',
        type: 'text', 
        description: 'Primary company phone',
        required: false,
        display_order: 8
      },
      
      // Address Information
      { 
        name: 'Headquarters Address', 
        code: 'headquarters_address',
        type: 'textarea', 
        description: 'Main office address',
        required: false,
        display_order: 9
      },
      { 
        name: 'City', 
        code: 'city',
        type: 'text', 
        description: 'Headquarters city',
        required: false,
        display_order: 10
      },
      { 
        name: 'State/Province', 
        code: 'state_province',
        type: 'text', 
        description: 'Headquarters state or province',
        required: false,
        display_order: 11
      },
      { 
        name: 'Postal Code', 
        code: 'postal_code',
        type: 'text', 
        description: 'Headquarters postal code',
        required: false,
        display_order: 12
      },
      { 
        name: 'Country', 
        code: 'country',
        type: 'select', 
        description: 'Headquarters country',
        required: false,
        display_order: 13,
        options: ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 'Japan', 'China', 'India', 'Brazil', 'Mexico', 'Other']
      },
      
      // Business Information
      { 
        name: 'Founded Year', 
        code: 'founded_year',
        type: 'number', 
        description: 'Year the company was founded',
        required: false,
        display_order: 14
      },
      { 
        name: 'Company Size', 
        code: 'company_size',
        type: 'select', 
        description: 'Number of employees',
        required: false,
        display_order: 15,
        options: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10000+']
      },
      { 
        name: 'Annual Revenue', 
        code: 'annual_revenue',
        type: 'select', 
        description: 'Annual revenue range',
        required: false,
        display_order: 16,
        options: ['< $1M', '$1M - $10M', '$10M - $50M', '$50M - $100M', '$100M - $500M', '$500M - $1B', '> $1B']
      },
      { 
        name: 'Business Model', 
        code: 'business_model',
        type: 'select', 
        description: 'Primary business model',
        required: false,
        display_order: 17,
        options: ['B2B', 'B2C', 'B2B2C', 'Marketplace', 'Subscription', 'Freemium', 'Enterprise', 'Other']
      },
      
      // Financial Information
      { 
        name: 'Tax ID', 
        code: 'tax_id',
        type: 'text', 
        description: 'Tax identification number',
        required: false,
        display_order: 18
      },
      { 
        name: 'Registration Number', 
        code: 'registration_number',
        type: 'text', 
        description: 'Business registration number',
        required: false,
        display_order: 19
      },
      { 
        name: 'Stock Symbol', 
        code: 'stock_symbol',
        type: 'text', 
        description: 'Public trading symbol',
        required: false,
        display_order: 20
      },
      { 
        name: 'Exchange', 
        code: 'exchange',
        type: 'select', 
        description: 'Stock exchange',
        required: false,
        display_order: 21,
        options: ['NYSE', 'NASDAQ', 'LSE', 'TSE', 'HKEX', 'SSE', 'BSE', 'Private', 'Other']
      },
      
      // Leadership Information
      { 
        name: 'CEO Name', 
        code: 'ceo_name',
        type: 'text', 
        description: 'Chief Executive Officer name',
        required: false,
        display_order: 22
      },
      { 
        name: 'CEO Email', 
        code: 'ceo_email',
        type: 'email', 
        description: 'CEO email address',
        required: false,
        display_order: 23
      },
      { 
        name: 'CTO Name', 
        code: 'cto_name',
        type: 'text', 
        description: 'Chief Technology Officer name',
        required: false,
        display_order: 24
      },
      { 
        name: 'CFO Name', 
        code: 'cfo_name',
        type: 'text', 
        description: 'Chief Financial Officer name',
        required: false,
        display_order: 25
      },
      
      // Social Media & Online Presence
      { 
        name: 'LinkedIn', 
        code: 'linkedin',
        type: 'url', 
        description: 'LinkedIn company page',
        required: false,
        display_order: 26
      },
      { 
        name: 'Twitter', 
        code: 'twitter',
        type: 'url', 
        description: 'Twitter company profile',
        required: false,
        display_order: 27
      },
      { 
        name: 'Facebook', 
        code: 'facebook',
        type: 'url', 
        description: 'Facebook company page',
        required: false,
        display_order: 28
      },
      { 
        name: 'Instagram', 
        code: 'instagram',
        type: 'url', 
        description: 'Instagram company profile',
        required: false,
        display_order: 29
      },
      
      // Additional Information
      { 
        name: 'Mission Statement', 
        code: 'mission_statement',
        type: 'textarea', 
        description: 'Company mission statement',
        required: false,
        display_order: 30
      },
      { 
        name: 'Company Description', 
        code: 'company_description',
        type: 'textarea', 
        description: 'Detailed company description',
        required: false,
        display_order: 31
      },
      { 
        name: 'Key Products/Services', 
        code: 'key_products',
        type: 'textarea', 
        description: 'Main products or services offered',
        required: false,
        display_order: 32
      },
      { 
        name: 'Target Market', 
        code: 'target_market',
        type: 'textarea', 
        description: 'Primary target market',
        required: false,
        display_order: 33
      },
      { 
        name: 'Competitive Advantages', 
        code: 'competitive_advantages',
        type: 'textarea', 
        description: 'Key competitive advantages',
        required: false,
        display_order: 34
      },
      { 
        name: 'Company Status', 
        code: 'company_status',
        type: 'select', 
        description: 'Current company status',
        required: true,
        display_order: 35,
        options: ['Active', 'Inactive', 'Acquired', 'Merged', 'Dissolved', 'Public', 'Private', 'Startup', 'Established']
      },
      { 
        name: 'Last Updated', 
        code: 'last_updated',
        type: 'date', 
        description: 'Last time company information was updated',
        required: false,
        display_order: 36
      },
      { 
        name: 'Notes', 
        code: 'notes',
        type: 'textarea', 
        description: 'Additional notes and comments',
        required: false,
        display_order: 37
      }
    ];
    
    const createdAttributes = [];
    for (const attr of companyAttributes) {
      const attribute = await client.query(`
        INSERT INTO attributes (name, code, type, data_model_id, description, is_required, display_order, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, name, type, code
      `, [attr.name, attr.code, attr.type, companyDataModel.id, attr.description, attr.required, attr.display_order]);
      
      createdAttributes.push(attribute.rows[0]);
      console.log(`  ✅ Created attribute: ${attr.name} (${attr.type})`);
      
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
    
    console.log(`✅ Created ${createdAttributes.length} company attributes`);
    
    // 6. Migrate to data_model_attributes table
    console.log('\n🔄 Migrating to data_model_attributes table...');
    await client.query(`DELETE FROM data_model_attributes WHERE data_model_id = $1`, [companyDataModel.id]);
    
    for (const attr of createdAttributes) {
      await client.query(`
        INSERT INTO data_model_attributes (
          id, data_model_id, attribute_id, name, display_name, type, data_type, 
          is_required, is_unique, default_value, validation, options, 
          "order", is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
      `, [
        attr.id,
        companyDataModel.id,
        attr.id,
        attr.name,
        attr.name,
        attr.type,
        attr.type,
        attr.required || false,
        false,
        null,
        null,
        null,
        attr.display_order || 0,
        true,
        new Date(),
        new Date()
      ]);
    }
    
    console.log(`✅ Migrated ${createdAttributes.length} attributes to data_model_attributes`);
    
    // 7. Create sample company records
    console.log('\n🏢 Creating sample company records...');
    const sampleCompanies = [
      {
        name: 'TechCorp Solutions',
        values: {
          company_name: 'TechCorp Solutions',
          legal_name: 'TechCorp Solutions Inc.',
          company_type: 'Corporation',
          industry: 'Technology',
          website: 'https://www.techcorp.com',
          email: 'info@techcorp.com',
          phone: '+1-555-0123',
          headquarters_address: '123 Tech Street, Suite 100',
          city: 'San Francisco',
          state_province: 'CA',
          postal_code: '94105',
          country: 'United States',
          founded_year: 2015,
          company_size: '51-200',
          annual_revenue: '$10M - $50M',
          business_model: 'B2B',
          ceo_name: 'John Smith',
          ceo_email: 'john.smith@techcorp.com',
          cto_name: 'Sarah Johnson',
          linkedin: 'https://linkedin.com/company/techcorp-solutions',
          mission_statement: 'Empowering businesses through innovative technology solutions',
          company_description: 'Leading provider of enterprise software solutions for mid-market companies',
          key_products: 'CRM Software, Analytics Platform, Integration Tools',
          target_market: 'Mid-market enterprises in technology, healthcare, and finance',
          company_status: 'Active'
        }
      },
      {
        name: 'HealthPlus Medical',
        values: {
          company_name: 'HealthPlus Medical',
          legal_name: 'HealthPlus Medical Group LLC',
          company_type: 'LLC',
          industry: 'Healthcare',
          website: 'https://www.healthplus.com',
          email: 'contact@healthplus.com',
          phone: '+1-555-0456',
          headquarters_address: '456 Medical Plaza',
          city: 'Boston',
          state_province: 'MA',
          postal_code: '02101',
          country: 'United States',
          founded_year: 2010,
          company_size: '201-500',
          annual_revenue: '$50M - $100M',
          business_model: 'B2C',
          ceo_name: 'Dr. Michael Chen',
          ceo_email: 'michael.chen@healthplus.com',
          cfo_name: 'Lisa Davis',
          linkedin: 'https://linkedin.com/company/healthplus-medical',
          mission_statement: 'Improving healthcare outcomes through innovative medical solutions',
          company_description: 'Comprehensive healthcare provider specializing in preventive care and chronic disease management',
          key_products: 'Primary Care Services, Specialty Clinics, Telemedicine Platform',
          target_market: 'Patients in the greater Boston metropolitan area',
          company_status: 'Active'
        }
      },
      {
        name: 'RetailMax Stores',
        values: {
          company_name: 'RetailMax Stores',
          legal_name: 'RetailMax Corporation',
          company_type: 'Corporation',
          industry: 'Retail',
          website: 'https://www.retailmax.com',
          email: 'info@retailmax.com',
          phone: '+1-555-0789',
          headquarters_address: '789 Commerce Blvd',
          city: 'Chicago',
          state_province: 'IL',
          postal_code: '60601',
          country: 'United States',
          founded_year: 2005,
          company_size: '501-1000',
          annual_revenue: '$100M - $500M',
          business_model: 'B2C',
          ceo_name: 'Robert Wilson',
          ceo_email: 'robert.wilson@retailmax.com',
          cto_name: 'Jennifer Brown',
          cfo_name: 'David Miller',
          linkedin: 'https://linkedin.com/company/retailmax-stores',
          mission_statement: 'Making quality products accessible to everyone',
          company_description: 'National retail chain specializing in consumer electronics and home goods',
          key_products: 'Electronics, Home Appliances, Furniture, Clothing',
          target_market: 'Middle-class families and young professionals',
          company_status: 'Active'
        }
      },
      {
        name: 'FinanceCorp International',
        values: {
          company_name: 'FinanceCorp International',
          legal_name: 'FinanceCorp International Ltd.',
          company_type: 'Corporation',
          industry: 'Finance',
          website: 'https://www.financecorp.com',
          email: 'contact@financecorp.com',
          phone: '+1-555-0321',
          headquarters_address: '321 Wall Street',
          city: 'New York',
          state_province: 'NY',
          postal_code: '10005',
          country: 'United States',
          founded_year: 1995,
          company_size: '1001-5000',
          annual_revenue: '$500M - $1B',
          business_model: 'B2B',
          ceo_name: 'Emily Davis',
          ceo_email: 'emily.davis@financecorp.com',
          cto_name: 'Mark Thompson',
          cfo_name: 'Susan Lee',
          stock_symbol: 'FCORP',
          exchange: 'NYSE',
          linkedin: 'https://linkedin.com/company/financecorp-international',
          mission_statement: 'Providing innovative financial solutions for global markets',
          company_description: 'Leading investment bank and financial services provider',
          key_products: 'Investment Banking, Wealth Management, Corporate Finance, Trading',
          target_market: 'High-net-worth individuals and institutional investors',
          company_status: 'Public'
        }
      },
      {
        name: 'StartupIO',
        values: {
          company_name: 'StartupIO',
          legal_name: 'StartupIO Inc.',
          company_type: 'Corporation',
          industry: 'Technology',
          website: 'https://www.startupio.com',
          email: 'hello@startupio.com',
          phone: '+1-555-0654',
          headquarters_address: '654 Innovation Drive',
          city: 'Austin',
          state_province: 'TX',
          postal_code: '73301',
          country: 'United States',
          founded_year: 2022,
          company_size: '1-10',
          annual_revenue: '< $1M',
          business_model: 'B2B',
          ceo_name: 'David Wilson',
          ceo_email: 'david.wilson@startupio.com',
          cto_name: 'Alex Rodriguez',
          linkedin: 'https://linkedin.com/company/startupio',
          mission_statement: 'Accelerating startup success through innovative tools and services',
          company_description: 'Early-stage startup providing productivity tools for other startups',
          key_products: 'Project Management Software, Analytics Dashboard, Team Collaboration Tools',
          target_market: 'Early-stage startups and small businesses',
          company_status: 'Startup'
        }
      }
    ];
    
    const createdRecords = [];
    for (const company of sampleCompanies) {
      const record = await client.query(`
        INSERT INTO data_records (data_model_id, name, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, name
      `, [companyDataModel.id, company.name, admin.id]);
      
      const newRecord = record.rows[0];
      createdRecords.push(newRecord);
      
      // Create record values for each attribute
      for (const [key, value] of Object.entries(company.values)) {
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
      
      console.log(`  ✅ Created company record: ${company.name}`);
    }
    
    console.log(`✅ Created ${createdRecords.length} sample company records`);
    
    // 8. Verify the setup
    console.log('\n🔍 Verifying setup...');
    
    // Check attributes
    const attributeCount = await client.query(`
      SELECT COUNT(*) as count FROM attributes WHERE data_model_id = $1
    `, [companyDataModel.id]);
    console.log(`📊 Attributes created: ${attributeCount.rows[0].count}`);
    
    // Check data_model_attributes
    const dataModelAttributeCount = await client.query(`
      SELECT COUNT(*) as count FROM data_model_attributes WHERE data_model_id = $1
    `, [companyDataModel.id]);
    console.log(`📋 Data model attributes: ${dataModelAttributeCount.rows[0].count}`);
    
    // Check records
    const recordCount = await client.query(`
      SELECT COUNT(*) as count FROM data_records WHERE data_model_id = $1
    `, [companyDataModel.id]);
    console.log(`🏢 Company records created: ${recordCount.rows[0].count}`);
    
    // Check record values
    const valueCount = await client.query(`
      SELECT COUNT(*) as count FROM data_record_values drv
      JOIN data_records dr ON drv.record_id = dr.id
      WHERE dr.data_model_id = $1
    `, [companyDataModel.id]);
    console.log(`📝 Record values created: ${valueCount.rows[0].count}`);
    
    await client.query('COMMIT');
    console.log('\n🎉 Company Data Model setup complete!');
    console.log('=====================================');
    console.log(`📊 Space: ${space.name} (${space.slug})`);
    console.log(`📋 Data Model: ${companyDataModel.name}`);
    console.log(`🏷️ Attributes: ${attributeCount.rows[0].count}`);
    console.log(`🏢 Company Records: ${recordCount.rows[0].count}`);
    console.log(`📝 Record Values: ${valueCount.rows[0].count}`);
    console.log('\n✅ Company data model should now be visible in the UI!');
    
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
    await createCompanyDataModel();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
