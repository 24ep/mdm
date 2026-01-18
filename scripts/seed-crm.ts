
import { Pool } from 'pg'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

if (!process.env.DATABASE_URL) {
  console.error('Missing required DATABASE_URL environment variable')
  process.exit(1)
}

async function seedCrmData() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Seeding Customer CRM Data Model...')

    // 1. Get Admin User (Create if not exists)
    let adminUser
    
    // Try to find ANY admin first
    const userResult = await client.query(`
      SELECT * FROM public.users 
      WHERE role IN ('SUPER_ADMIN', 'ADMIN') 
      LIMIT 1
    `)

    if (userResult.rows.length > 0) {
      adminUser = userResult.rows[0]
      console.log(`👤 Using existing admin user: ${adminUser.name || adminUser.email}`)
    } else {
        // Create or Update default admin
        console.log('⚠️ No admin user found. Creating/Updating default admin...')
        const email = 'admin@example.com'
        const userId = randomUUID()
        
        try {
            const upsertResult = await client.query(`
                INSERT INTO public.users (id, name, email, password, role, is_active, created_at, updated_at)
                VALUES ($1, 'Admin User', $2, 'seed_password', 'SUPER_ADMIN', true, NOW(), NOW())
                ON CONFLICT (email) 
                DO UPDATE SET role = 'SUPER_ADMIN'
                RETURNING *
            `, [userId, email])
            
            adminUser = upsertResult.rows[0]
            console.log(`✅ Using (created/updated) Admin User: ${adminUser.email}`)
        } catch (err) {
            console.error('Failed to create admin user:', err)
            throw err
        }
    }

    // 2. Create "Data Management" Space
    let space
    const spaceCheck = await client.query(`
      SELECT * FROM public.spaces 
      WHERE slug = 'data-management'
    `)

    if (spaceCheck.rows.length > 0) {
      space = spaceCheck.rows[0]
      console.log(`📁 Space "Data Management" already exists.`)
    } else {
      const spaceId = randomUUID()
      const spaceRes = await client.query(`
        INSERT INTO public.spaces (id, name, slug, description, is_default, is_active, created_by, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `, [
        spaceId,
        'Data Management',
        'data-management',
        'Space for CRM and Business Data',
        false,
        true,
        adminUser.id
      ])
      space = spaceRes.rows[0]
      console.log(`✅ Created Space: ${space.name}`)
    }

    // Ensure Admin is member
    await client.query(`
      INSERT INTO public.space_members (id, space_id, user_id, role)
      VALUES (gen_random_uuid(), $1, $2, 'ADMIN')
      ON CONFLICT (space_id, user_id) DO NOTHING
    `, [space.id, adminUser.id])

    // 3. Create "Customer CRM" Data Model
    const modelName = 'customer_crm'
    let dataModel
    const modelCheck = await client.query(`
      SELECT * FROM public.data_models 
      WHERE name = $1
    `, [modelName])

    if (modelCheck.rows.length > 0) {
      dataModel = modelCheck.rows[0]
      console.log(`📋 Data Model "${modelName}" already exists.`)
    } else {
      const modelId = randomUUID()
      const modelRes = await client.query(`
        INSERT INTO public.data_models (id, name, description, created_by, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `, [modelId, modelName, 'Customer Relationship Management Data', adminUser.id])
      dataModel = modelRes.rows[0]
      console.log(`✅ Created Data Model: ${dataModel.name}`)
    }

    // Link Model to Space
    await client.query(`
      INSERT INTO public.data_model_spaces (id, data_model_id, space_id, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
      ON CONFLICT (data_model_id, space_id) DO NOTHING
    `, [dataModel.id, space.id])

    // 4. Create Attributes
    const attributes = [
      { name: 'first_name', displayName: 'First Name', type: 'TEXT', required: true, order: 1 },
      { name: 'last_name', displayName: 'Last Name', type: 'TEXT', required: true, order: 2 },
      { name: 'email', displayName: 'Email', type: 'EMAIL', required: true, unique: true, order: 3 },
      { name: 'phone', displayName: 'Phone', type: 'PHONE', order: 4 },
      { name: 'company', displayName: 'Company', type: 'TEXT', order: 5 },
      { name: 'status', displayName: 'Status', type: 'SELECT', order: 6, options: ['Lead', 'Active', 'Churned'] },
      { name: 'contract_file', displayName: 'Contract Attachment', type: 'FILE', order: 7 } // FILE type for attachment
    ]

    for (const attr of attributes) {
      // Check if attribute exists
      const attrCheck = await client.query(`
        SELECT * FROM public.data_model_attributes 
        WHERE data_model_id = $1 AND name = $2
      `, [dataModel.id, attr.name])

      if (attrCheck.rows.length === 0) {
        await client.query(`
          INSERT INTO public.data_model_attributes (
            id, name, display_name, type, is_required, is_unique, "order", 
            options, data_model_id, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        `, [
          randomUUID(),
          attr.name,
          attr.displayName,
          attr.type,
          attr.required || false,
          attr.unique || false,
          attr.order,
          attr.options ? JSON.stringify(attr.options) : null,
          dataModel.id
        ])
        console.log(`   - Created Attribute: ${attr.displayName}`)
      }
    }

    // 5. Seed Data Records
    const sampleData = [
      {
        first_name: 'Alice',
        last_name: 'Wonderland',
        email: 'alice@example.com',
        phone: '123-456-7890',
        company: 'Wonder Corp',
        status: 'Active',
        contract_file: '/uploads/contracts/alice_contract_v1.pdf'
      },
      {
        first_name: 'Bob',
        last_name: 'Builder',
        email: 'bob@construction.com',
        phone: '987-654-3210',
        company: 'BuildIt Inc',
        status: 'Lead',
        contract_file: '/uploads/contracts/bob_proposal.pdf'
      },
      {
        first_name: 'Charlie',
        last_name: 'Chocolate',
        email: 'charlie@factory.com',
        phone: '555-123-4567',
        company: 'Wonka Industries',
        status: 'Churned',
        contract_file: '/uploads/contracts/charlie_exit.docx'
      }
    ]

    console.log(`📊 Seeding ${sampleData.length} records...`)

    // Fetch Attribute IDs map
    const attrMapRes = await client.query(`
      SELECT id, name FROM public.data_model_attributes WHERE data_model_id = $1
    `, [dataModel.id])
    
    const attrMap: Record<string, string> = {}
    attrMapRes.rows.forEach((r: any) => {
      attrMap[r.name] = r.id
    })

    for (const record of sampleData) {
        // Create Record
        const recordId = randomUUID()
        await client.query(`
            INSERT INTO public.data_records (id, data_model_id, created_by, updated_at)
            VALUES ($1, $2, $3, NOW())
        `, [recordId, dataModel.id, adminUser.id])

        // Insert Values
        for (const [key, value] of Object.entries(record)) {
            if (attrMap[key]) {
                await client.query(`
                    INSERT INTO public.data_record_values (id, data_record_id, attribute_id, value, updated_at)
                    VALUES ($1, $2, $3, $4, NOW())
                `, [randomUUID(), recordId, attrMap[key], value])
            }
        }
    }

    console.log('✅ Seeding Completed Successfully!')

  } catch (e) {
    console.error('Error seeding CRM data:', e)
  } finally {
    client.release()
  }
}

seedCrmData()
