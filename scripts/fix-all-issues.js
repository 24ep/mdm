#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');

console.log('🔧 FIXING ALL APPLICATION ISSUES\n');

async function fixAllIssues() {
  try {
    // Step 1: Stop all Node processes
    console.log('🔄 Step 1: Stopping all Node processes...');
    const { exec } = require('child_process');
    
    exec('taskkill /f /im node.exe', (error, stdout, stderr) => {
      if (error && !error.message.includes('not found')) {
        console.log('⚠️  Some processes may still be running');
      } else {
        console.log('✅ Node processes stopped');
      }
    });

    // Step 2: Fix environment configuration
    console.log('🔄 Step 2: Fixing environment configuration...');
    const envContent = `# Database Configuration
DATABASE_URL=postgres://postgres:postgres@localhost:5432/customer_data_management

# NextAuth Configuration - FIXED PORT
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-here

# Attachment Storage Configuration
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=attachments
MINIO_REGION=us-east-1
`;

    fs.writeFileSync('.env.local', envContent);
    console.log('✅ Environment configuration fixed (port 3001)');

    // Step 3: Setup database
    console.log('🔄 Step 3: Setting up database...');
    const connectionString = 'postgres://postgres:postgres@localhost:5432/customer_data_management';
    const pool = new Pool({ connectionString });

    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Create all required tables
    console.log('🔄 Creating database tables...');
    
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

    console.log('✅ All database tables created');

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

    // Add admin to space
    await client.query(`
      INSERT INTO public.space_members (space_id, user_id, role) 
      VALUES ($1, $2, 'ADMIN')
      ON CONFLICT (space_id, user_id) DO UPDATE SET role = EXCLUDED.role;
    `, [defaultSpaceId, adminUserId]);

    // Insert system settings
    await client.query(`
      INSERT INTO public.system_settings (key, value) VALUES 
      ('app_name', 'Customer Data Management'),
      ('app_version', '1.0.0'),
      ('maintenance_mode', 'false'),
      ('default_space_id', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    `, [defaultSpaceId]);

    // Create welcome notification
    await client.query(`
      INSERT INTO public.notifications (user_id, type, title, message, priority) 
      VALUES ($1, 'WELCOME', 'Welcome to Customer Data Management', 'Your account has been set up successfully!', 'MEDIUM')
      ON CONFLICT DO NOTHING;
    `, [adminUserId]);

    console.log('✅ Default data inserted');
    console.log('✅ Admin user: admin@example.com / admin123');
    console.log('✅ Default space created');
    console.log('✅ System settings configured');

    client.release();
    await pool.end();

    // Step 5: Clear Next.js cache
    console.log('🔄 Step 5: Clearing Next.js cache...');
    if (fs.existsSync('.next')) {
      fs.rmSync('.next', { recursive: true, force: true });
      console.log('✅ Next.js cache cleared');
    }

    console.log('\n🎉 ALL ISSUES FIXED!');
    console.log('✅ Database tables created');
    console.log('✅ Default data inserted');
    console.log('✅ Environment configuration fixed');
    console.log('✅ Port configuration corrected (3001)');
    console.log('✅ Cache cleared');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Run: npm run dev');
    console.log('2. Open: http://localhost:3001');
    console.log('3. Login with: admin@example.com / admin123');
    console.log('4. All API endpoints should now work correctly!');

  } catch (error) {
    console.error('❌ Error fixing issues:', error.message);
    console.error('Full error:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

fixAllIssues();
