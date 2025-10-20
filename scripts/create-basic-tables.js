#!/usr/bin/env node

const { Pool } = require('pg');

console.log('🔧 Creating Basic Database Tables\n');

async function createTables() {
  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management';
  const pool = new Pool({ connectionString });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Create basic tables that the API needs
    console.log('🔄 Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        role TEXT DEFAULT 'USER',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Users table created');

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

    // Insert some basic data
    console.log('🔄 Inserting basic data...');
    
    // Create a default user
    await client.query(`
      INSERT INTO public.users (id, name, email, role) 
      VALUES ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@example.com', 'SUPER_ADMIN')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Default user created');

    // Create a default space
    await client.query(`
      INSERT INTO public.spaces (id, name, description, is_default, created_by) 
      VALUES ('00000000-0000-0000-0000-000000000001', 'Default Space', 'Default workspace', true, '00000000-0000-0000-0000-000000000001')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Default space created');

    // Add user to space
    await client.query(`
      INSERT INTO public.space_members (space_id, user_id, role) 
      VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'ADMIN')
      ON CONFLICT (space_id, user_id) DO NOTHING;
    `);
    console.log('✅ User added to space');

    // Insert some system settings
    await client.query(`
      INSERT INTO public.system_settings (key, value) VALUES 
      ('app_name', 'Customer Data Management'),
      ('app_version', '1.0.0'),
      ('maintenance_mode', 'false')
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('✅ System settings created');

    // Test the tables
    console.log('\n🔍 Testing tables...');
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

    client.release();
    await pool.end();
    
    console.log('\n🎉 Basic database setup completed!');
    console.log('✅ All required tables created');
    console.log('✅ Default data inserted');
    console.log('✅ Ready to start the application');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    console.error('Full error:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

createTables();
