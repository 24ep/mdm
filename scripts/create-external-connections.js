const { Pool } = require('pg')
require('dotenv').config()

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres'
const pool = new Pool({ connectionString: databaseUrl })

async function main() {
  const client = await pool.connect()
  try {
    console.log('Creating external_connections table...')
    
    // Create enum type if it doesn't exist
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'data_model_source_type') THEN
          CREATE TYPE data_model_source_type AS ENUM ('INTERNAL', 'EXTERNAL');
        END IF;
      END $$;
    `)
    
    // Create external_connections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.external_connections (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        db_type TEXT NOT NULL,
        host TEXT NOT NULL,
        port INTEGER,
        database TEXT,
        username TEXT,
        password TEXT,
        options JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      )
    `)
    
    console.log('Creating indexes...')
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_external_connections_space_id ON public.external_connections(space_id)
    `)
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_external_connections_is_active ON public.external_connections(is_active)
    `)
    
    console.log('Adding columns to data_models table...')
    
    // Add columns to data_models table
    await client.query(`
      ALTER TABLE public.data_models
        ADD COLUMN IF NOT EXISTS source_type data_model_source_type DEFAULT 'INTERNAL',
        ADD COLUMN IF NOT EXISTS external_connection_id UUID REFERENCES public.external_connections(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS external_schema TEXT,
        ADD COLUMN IF NOT EXISTS external_table TEXT,
        ADD COLUMN IF NOT EXISTS external_primary_key TEXT
    `)
    
    console.log('Adding column to data_model_attributes table...')
    
    // Add column to data_model_attributes table
    await client.query(`
      ALTER TABLE public.data_model_attributes
        ADD COLUMN IF NOT EXISTS external_column TEXT
    `)
    
    console.log('External connections table created successfully!')
    
  } catch (e) {
    console.error('Error:', e)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
