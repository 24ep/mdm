const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addAuditLogColumns() {
  try {
    console.log('Adding ip_address and user_agent columns to audit_logs table...');
    
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        -- Add ip_address column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'audit_logs' 
          AND column_name = 'ip_address'
        ) THEN
          ALTER TABLE public.audit_logs ADD COLUMN ip_address TEXT;
          RAISE NOTICE 'Added ip_address column';
        ELSE
          RAISE NOTICE 'ip_address column already exists';
        END IF;
        
        -- Add user_agent column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'audit_logs' 
          AND column_name = 'user_agent'
        ) THEN
          ALTER TABLE public.audit_logs ADD COLUMN user_agent TEXT;
          RAISE NOTICE 'Added user_agent column';
        ELSE
          RAISE NOTICE 'user_agent column already exists';
        END IF;
      END $$;
    `);
    
    console.log('✅ Migration completed successfully!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.meta) {
      console.error('Error details:', error.meta);
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

addAuditLogColumns();

