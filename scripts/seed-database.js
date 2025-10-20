#!/usr/bin/env node

const { Pool } = require('pg');

console.log('🌱 Seeding Database with Complete Setup\n');

async function seedDatabase() {
  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management';
  const pool = new Pool({ connectionString });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Create extensions
    console.log('🔄 Creating extensions...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    console.log('✅ Extensions created');

    // Create users table with all required columns
    console.log('🔄 Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'USER',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Users table created');

    // Create spaces table
    console.log('🔄 Creating spaces table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.spaces (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        is_default BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES public.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE,
        slug TEXT UNIQUE
      );
    `);
    console.log('✅ Spaces table created');

    // Create space_members table
    console.log('🔄 Creating space_members table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.space_members (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'MEMBER',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(space_id, user_id)
      );
    `);
    console.log('✅ Space members table created');

    // Create system_settings table
    console.log('🔄 Creating system_settings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.system_settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ System settings table created');

    // Create notifications table
    console.log('🔄 Creating notifications table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        priority TEXT DEFAULT 'MEDIUM',
        status TEXT DEFAULT 'UNREAD',
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        action_url TEXT,
        action_label TEXT,
        expires_at TIMESTAMP WITH TIME ZONE,
        read_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Notifications table created');

    // Create data_models table
    console.log('🔄 Creating data_models table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.data_models (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
        created_by UUID REFERENCES public.users(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE,
        folder_id UUID,
        space_ids UUID[] DEFAULT '{}'
      );
    `);
    console.log('✅ Data models table created');

    // Create attributes table
    console.log('🔄 Creating attributes table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.attributes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        data_model_id UUID REFERENCES public.data_models(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        type TEXT NOT NULL,
        is_required BOOLEAN DEFAULT false,
        is_unique BOOLEAN DEFAULT false,
        options JSONB,
        created_by UUID REFERENCES public.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(data_model_id, code)
      );
    `);
    console.log('✅ Attributes table created');

    // Create folders table
    console.log('🔄 Creating folders table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.folders (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
        parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
        created_by UUID REFERENCES public.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Folders table created');

    // Create space_attachment_storage table
    console.log('🔄 Creating space_attachment_storage table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.space_attachment_storage (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        config JSONB NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES public.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Space attachment storage table created');

    // Create attachment_files table
    console.log('🔄 Creating attachment_files table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.attachment_files (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
        data_model_id UUID REFERENCES public.data_models(id) ON DELETE CASCADE,
        attribute_id UUID REFERENCES public.attributes(id) ON DELETE CASCADE,
        record_id UUID,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT,
        mime_type TEXT,
        uploaded_by UUID REFERENCES public.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Attachment files table created');

    // Insert default data
    console.log('🔄 Inserting default data...');
    
    // Create default admin user
    const adminUserId = '00000000-0000-0000-0000-000000000001';
    await client.query(`
      INSERT INTO public.users (id, name, email, password, role) 
      VALUES ($1, 'Admin User', 'admin@example.com', crypt('admin123', gen_salt('bf')), 'SUPER_ADMIN')
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        role = EXCLUDED.role;
    `, [adminUserId]);
    console.log('✅ Default admin user created (email: admin@example.com, password: admin123)');

    // Create default space
    const defaultSpaceId = '00000000-0000-0000-0000-000000000001';
    await client.query(`
      INSERT INTO public.spaces (id, name, description, is_default, created_by) 
      VALUES ($1, 'Default Space', 'Default workspace for the application', true, $2)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        is_default = EXCLUDED.is_default;
    `, [defaultSpaceId, adminUserId]);
    console.log('✅ Default space created');

    // Add admin user to default space
    await client.query(`
      INSERT INTO public.space_members (space_id, user_id, role) 
      VALUES ($1, $2, 'ADMIN')
      ON CONFLICT (space_id, user_id) DO UPDATE SET role = EXCLUDED.role;
    `, [defaultSpaceId, adminUserId]);
    console.log('✅ Admin user added to default space');

    // Insert system settings
    await client.query(`
      INSERT INTO public.system_settings (key, value) VALUES 
      ('app_name', 'Customer Data Management'),
      ('app_version', '1.0.0'),
      ('maintenance_mode', 'false'),
      ('default_space_id', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    `, [defaultSpaceId]);
    console.log('✅ System settings created');

    // Create a sample data model
    const sampleModelId = '00000000-0000-0000-0000-000000000002';
    await client.query(`
      INSERT INTO public.data_models (id, name, description, space_id, created_by) 
      VALUES ($1, 'Sample Data Model', 'A sample data model for testing', $2, $3)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description;
    `, [sampleModelId, defaultSpaceId, adminUserId]);
    console.log('✅ Sample data model created');

    // Create sample attributes
    await client.query(`
      INSERT INTO public.attributes (data_model_id, name, code, type, is_required, created_by) VALUES 
      ($1, 'Name', 'name', 'TEXT', true, $2),
      ($1, 'Email', 'email', 'EMAIL', true, $2),
      ($1, 'Phone', 'phone', 'PHONE', false, $2),
      ($1, 'Status', 'status', 'SELECT', false, $2)
      ON CONFLICT (data_model_id, code) DO NOTHING;
    `, [sampleModelId, adminUserId]);
    console.log('✅ Sample attributes created');

    // Create a welcome notification
    await client.query(`
      INSERT INTO public.notifications (user_id, type, title, message, priority) 
      VALUES ($1, 'WELCOME', 'Welcome to Customer Data Management', 'Your account has been set up successfully!', 'MEDIUM')
      ON CONFLICT DO NOTHING;
    `, [adminUserId]);
    console.log('✅ Welcome notification created');

    // Test the setup
    console.log('\n🔍 Testing database setup...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📋 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Test user count
    const userCount = await client.query('SELECT COUNT(*) as count FROM public.users');
    console.log(`👥 Users in database: ${userCount.rows[0].count}`);

    // Test space count
    const spaceCount = await client.query('SELECT COUNT(*) as count FROM public.spaces');
    console.log(`🏢 Spaces in database: ${spaceCount.rows[0].count}`);

    client.release();
    await pool.end();
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('✅ All required tables created');
    console.log('✅ Default data inserted');
    console.log('✅ Admin user: admin@example.com / admin123');
    console.log('✅ Default space created');
    console.log('✅ Sample data model created');
    console.log('✅ Ready to start the application');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error('Full error:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

seedDatabase();
