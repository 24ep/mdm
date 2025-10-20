#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');

console.log('🔧 SETTING UP DATABASE PROPERLY\n');

async function setupDatabase() {
  try {
    // Step 1: Create proper .env.local file
    console.log('🔄 Step 1: Creating .env.local with correct configuration...');
    const envContent = `# Database Configuration - PostgreSQL (not Supabase)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/customer_data_management

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-here

# Application Settings
NEXT_PUBLIC_APP_NAME=Customer Data Management
NEXT_PUBLIC_API_URL=http://localhost:3001

# Attachment Storage Configuration
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=attachments
MINIO_REGION=us-east-1
`;

    fs.writeFileSync('.env.local', envContent);
    console.log('✅ .env.local created with PostgreSQL configuration (port 5432)');

    // Step 2: Test database connection
    console.log('🔄 Step 2: Testing database connection...');
    const connectionString = 'postgres://postgres:postgres@localhost:5432/customer_data_management';
    const pool = new Pool({ connectionString });

    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');

    // Step 3: Create all required tables
    console.log('🔄 Step 3: Creating database tables...');
    
    // Users table with password column
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

    // Spaces table
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

    // Space members table
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

    // System settings table
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

    // Notifications table
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

    // Step 4: Insert default data
    console.log('🔄 Step 4: Inserting default data...');
    
    // Create admin user
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
    console.log('✅ Admin user created: admin@example.com / admin123');

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

    // Add admin to space
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

    // Create welcome notification
    await client.query(`
      INSERT INTO public.notifications (user_id, type, title, message, priority) 
      VALUES ($1, 'WELCOME', 'Welcome to Customer Data Management', 'Your account has been set up successfully!', 'MEDIUM')
      ON CONFLICT DO NOTHING;
    `, [adminUserId]);
    console.log('✅ Welcome notification created');

    // Step 5: Verify setup
    console.log('🔄 Step 5: Verifying database setup...');
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

    console.log('\n🎉 DATABASE SETUP COMPLETED!');
    console.log('✅ PostgreSQL database configured correctly');
    console.log('✅ All required tables created');
    console.log('✅ Default data inserted');
    console.log('✅ Admin user: admin@example.com / admin123');
    console.log('✅ Environment configuration fixed');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Stop current processes: taskkill /f /im node.exe');
    console.log('2. Clear cache: rmdir /s /q .next');
    console.log('3. Start application: npm run dev');
    console.log('4. Open: http://localhost:3001');
    console.log('5. Login with: admin@example.com / admin123');
    console.log('6. All 500 errors should be resolved!');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error('Full error:', error);
  }
}

setupDatabase();
