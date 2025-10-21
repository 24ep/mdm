const { Pool } = require('pg');
const { execSync } = require('child_process');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/customer_data_management'
});

async function fixDatabaseSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing database schema...');
    
    // Fix attributes table
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attributes' 
      AND column_name IN ('description', 'is_required', 'validation_rules', 'display_order')
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    
    if (!existingColumns.includes('description')) {
      console.log('➕ Adding description column to attributes table...');
      await client.query(`ALTER TABLE attributes ADD COLUMN description TEXT`);
    }
    
    if (!existingColumns.includes('is_required')) {
      console.log('➕ Adding is_required column to attributes table...');
      await client.query(`ALTER TABLE attributes ADD COLUMN is_required BOOLEAN DEFAULT false`);
    }
    
    if (!existingColumns.includes('validation_rules')) {
      console.log('➕ Adding validation_rules column to attributes table...');
      await client.query(`ALTER TABLE attributes ADD COLUMN validation_rules JSONB`);
    }
    
    if (!existingColumns.includes('display_order')) {
      console.log('➕ Adding display_order column to attributes table...');
      await client.query(`ALTER TABLE attributes ADD COLUMN display_order INTEGER DEFAULT 0`);
    }
    
    console.log('✅ Database schema fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function installPrisma() {
  try {
    console.log('📦 Installing Prisma packages...');
    execSync('npm install prisma @prisma/client', { stdio: 'inherit' });
    console.log('✅ Prisma packages installed!');
    
    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated!');
    
    console.log('🚀 Pushing schema to database...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Database schema synchronized!');
    
  } catch (error) {
    console.error('❌ Error with Prisma setup:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await fixDatabaseSchema();
    await installPrisma();
    console.log('🎉 ORM setup complete!');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
