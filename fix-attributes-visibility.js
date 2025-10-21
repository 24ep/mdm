require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management'
});

async function fixAttributesVisibility() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing Attributes Visibility');
    console.log('===============================');
    
    // 1. Find the customer space
    const customerSpace = await client.query(`
      SELECT id, name, slug FROM spaces WHERE slug = 'customer-data-management'
    `);
    
    if (customerSpace.rows.length === 0) {
      console.log('❌ Customer space not found! Please run the complete setup script first.');
      return;
    }
    
    const space = customerSpace.rows[0];
    console.log(`✅ Found space: ${space.name} (ID: ${space.id})`);
    
    // 2. Find or create the data model
    let dataModel = await client.query(`
      SELECT id, name FROM data_models WHERE space_id = $1 AND name = 'Customer Information'
    `, [space.id]);
    
    if (dataModel.rows.length === 0) {
      console.log('📊 Creating Customer Information data model...');
      const newDataModel = await client.query(`
        INSERT INTO data_models (name, description, space_id, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, name
      `, [
        'Customer Information',
        'Complete customer data model with contact info, business details, and status tracking',
        space.id,
        space.created_by || '00000000-0000-0000-0000-000000000000'
      ]);
      dataModel = newDataModel;
    }
    
    const model = dataModel.rows[0];
    console.log(`✅ Data model: ${model.name} (ID: ${model.id})`);
    
    // 3. Ensure data model is linked to space
    const linkCheck = await client.query(`
      SELECT id FROM data_model_spaces WHERE data_model_id = $1 AND space_id = $2
    `, [model.id, space.id]);
    
    if (linkCheck.rows.length === 0) {
      console.log('🔗 Linking data model to space...');
      await client.query(`
        INSERT INTO data_model_spaces (data_model_id, space_id, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
      `, [model.id, space.id]);
      console.log('✅ Data model linked to space');
    } else {
      console.log('✅ Data model already linked to space');
    }
    
    // 4. Clear existing attributes and create new ones
    console.log('\n🏷️ Creating attributes...');
    await client.query(`DELETE FROM attributes WHERE data_model_id = $1`, [model.id]);
    console.log('🧹 Cleared existing attributes');
    
    // Create essential attributes
    const attributes = [
      { name: 'First Name', code: 'first_name', type: 'text', required: true, order: 1 },
      { name: 'Last Name', code: 'last_name', type: 'text', required: true, order: 2 },
      { name: 'Email', code: 'email', type: 'email', required: true, order: 3 },
      { name: 'Phone', code: 'phone', type: 'text', required: false, order: 4 },
      { name: 'Company', code: 'company', type: 'text', required: false, order: 5 },
      { name: 'Customer Status', code: 'customer_status', type: 'select', required: true, order: 6, options: ['Lead', 'Prospect', 'Customer', 'VIP', 'Inactive'] },
      { name: 'Priority', code: 'priority', type: 'select', required: false, order: 7, options: ['Low', 'Medium', 'High', 'Critical'] },
      { name: 'Notes', code: 'notes', type: 'textarea', required: false, order: 8 }
    ];
    
    const createdAttributes = [];
    for (const attr of attributes) {
      const attribute = await client.query(`
        INSERT INTO attributes (name, code, type, data_model_id, description, is_required, display_order, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, name, type, code
      `, [
        attr.name, 
        attr.code, 
        attr.type, 
        model.id, 
        `Customer ${attr.name.toLowerCase()}`, 
        attr.required, 
        attr.order
      ]);
      
      createdAttributes.push(attribute.rows[0]);
      console.log(`  ✅ Created: ${attr.name} (${attr.type})`);
      
      // Add options for select fields
      if (attr.options) {
        for (let i = 0; i < attr.options.length; i++) {
          await client.query(`
            INSERT INTO attribute_options (attribute_id, value, label, display_order, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
          `, [attribute.rows[0].id, attr.options[i], attr.options[i], i]);
        }
        console.log(`    📋 Added ${attr.options.length} options`);
      }
    }
    
    console.log(`✅ Created ${createdAttributes.length} attributes`);
    
    // 5. Create a sample record
    console.log('\n👥 Creating sample record...');
    const sampleRecord = await client.query(`
      INSERT INTO data_records (data_model_id, name, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, name
    `, [model.id, 'John Smith', space.created_by || '00000000-0000-0000-0000-000000000000']);
    
    const record = sampleRecord.rows[0];
    console.log(`✅ Created record: ${record.name}`);
    
    // Add some sample values
    const sampleValues = {
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@example.com',
      phone: '+1-555-0123',
      company: 'TechCorp Solutions',
      customer_status: 'Customer',
      priority: 'High',
      notes: 'Key decision maker for enterprise software purchases'
    };
    
    for (const [key, value] of Object.entries(sampleValues)) {
      const attribute = createdAttributes.find(attr => attr.code === key);
      if (attribute) {
        await client.query(`
          INSERT INTO data_record_values (record_id, attribute_id, value, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
        `, [record.id, attribute.id, value]);
      }
    }
    
    console.log('✅ Added sample values to record');
    
    // 6. Verify the setup
    console.log('\n🔍 Verifying setup...');
    
    // Check attributes count
    const attrCount = await client.query(`
      SELECT COUNT(*) as count FROM attributes WHERE data_model_id = $1
    `, [model.id]);
    console.log(`📊 Attributes: ${attrCount.rows[0].count}`);
    
    // Check records count
    const recordCount = await client.query(`
      SELECT COUNT(*) as count FROM data_records WHERE data_model_id = $1
    `, [model.id]);
    console.log(`👥 Records: ${recordCount.rows[0].count}`);
    
    // Check the API query that UI might use
    const apiQuery = await client.query(`
      SELECT 
        a.id,
        a.name,
        a.code,
        a.type,
        a.description,
        a.is_required,
        a.display_order
      FROM attributes a
      JOIN data_models dm ON a.data_model_id = dm.id
      JOIN spaces s ON dm.space_id = s.id
      WHERE s.slug = 'customer-data-management'
      ORDER BY a.display_order, a.name
    `);
    
    console.log(`\n📋 API Query Results: ${apiQuery.rows.length} attributes found`);
    if (apiQuery.rows.length > 0) {
      console.log('✅ Attributes should now be visible in the UI!');
      apiQuery.rows.forEach(attr => {
        console.log(`  - ${attr.name} (${attr.type}) - Code: ${attr.code}`);
      });
    } else {
      console.log('❌ Still no attributes found in API query');
    }
    
    console.log('\n🎉 Attributes visibility fix complete!');
    
  } catch (error) {
    console.error('❌ Error fixing attributes visibility:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await fixAttributesVisibility();
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
