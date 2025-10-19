const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigrations() {
  console.log('Applying attachment infrastructure migrations...')

  try {
    // Create space_attachment_storage table
    console.log('Creating space_attachment_storage table...')
    const { error: storageError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create space_attachment_storage table
        CREATE TABLE IF NOT EXISTS space_attachment_storage (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
          provider VARCHAR(20) NOT NULL CHECK (provider IN ('minio', 's3', 'sftp', 'ftp')),
          config JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(space_id)
        );

        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_space_attachment_storage_space_id ON space_attachment_storage(space_id);

        -- Enable RLS
        ALTER TABLE space_attachment_storage ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Users can view attachment storage config if space member" ON space_attachment_storage
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM space_members 
              WHERE space_members.space_id = space_attachment_storage.space_id 
              AND space_members.user_id = auth.uid()
            )
          );

        CREATE POLICY "Admins and owners can modify attachment storage config" ON space_attachment_storage
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM space_members 
              WHERE space_members.space_id = space_attachment_storage.space_id 
              AND space_members.user_id = auth.uid()
              AND space_members.role IN ('admin', 'owner')
            )
          );

        -- Create function to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_space_attachment_storage_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger for updated_at
        DROP TRIGGER IF EXISTS trigger_update_space_attachment_storage_updated_at ON space_attachment_storage;
        CREATE TRIGGER trigger_update_space_attachment_storage_updated_at
          BEFORE UPDATE ON space_attachment_storage
          FOR EACH ROW
          EXECUTE FUNCTION update_space_attachment_storage_updated_at();
      `
    })

    if (storageError) {
      console.error('Error creating space_attachment_storage table:', storageError)
    } else {
      console.log('✅ space_attachment_storage table created successfully')
    }

    // Create attachment_files table
    console.log('Creating attachment_files table...')
    const { error: filesError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create attachment_files table
        CREATE TABLE IF NOT EXISTS attachment_files (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          attribute_id UUID NOT NULL REFERENCES data_model_attributes(id) ON DELETE CASCADE,
          original_name VARCHAR(255) NOT NULL,
          stored_name VARCHAR(255) NOT NULL,
          file_size BIGINT NOT NULL,
          content_type VARCHAR(100) NOT NULL,
          storage_provider VARCHAR(20) NOT NULL CHECK (storage_provider IN ('minio', 's3', 'sftp', 'ftp')),
          storage_path TEXT NOT NULL,
          storage_url TEXT,
          uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for faster lookups
        CREATE INDEX IF NOT EXISTS idx_attachment_files_attribute_id ON attachment_files(attribute_id);
        CREATE INDEX IF NOT EXISTS idx_attachment_files_uploaded_by ON attachment_files(uploaded_by);
        CREATE INDEX IF NOT EXISTS idx_attachment_files_storage_provider ON attachment_files(storage_provider);

        -- Enable RLS
        ALTER TABLE attachment_files ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Users can view attachment files if data model access" ON attachment_files
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM data_model_attributes dma
              JOIN data_models dm ON dma.data_model_id = dm.id
              JOIN space_members sm ON dm.space_id = sm.space_id
              WHERE dma.id = attachment_files.attribute_id
              AND sm.user_id = auth.uid()
            )
          );

        CREATE POLICY "Users can insert attachment files if data model access" ON attachment_files
          FOR INSERT
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM data_model_attributes dma
              JOIN data_models dm ON dma.data_model_id = dm.id
              JOIN space_members sm ON dm.space_id = sm.space_id
              WHERE dma.id = attachment_files.attribute_id
              AND sm.user_id = auth.uid()
            )
          );

        CREATE POLICY "Users can update own attachment files or if admin/owner" ON attachment_files
          FOR UPDATE
          USING (
            uploaded_by = auth.uid() OR
            EXISTS (
              SELECT 1 FROM data_model_attributes dma
              JOIN data_models dm ON dma.data_model_id = dm.id
              JOIN space_members sm ON dm.space_id = sm.space_id
              WHERE dma.id = attachment_files.attribute_id
              AND sm.user_id = auth.uid()
              AND sm.role IN ('admin', 'owner')
            )
          );

        CREATE POLICY "Users can delete own attachment files or if admin/owner" ON attachment_files
          FOR DELETE
          USING (
            uploaded_by = auth.uid() OR
            EXISTS (
              SELECT 1 FROM data_model_attributes dma
              JOIN data_models dm ON dma.data_model_id = dm.id
              JOIN space_members sm ON dm.space_id = sm.space_id
              WHERE dma.id = attachment_files.attribute_id
              AND sm.user_id = auth.uid()
              AND sm.role IN ('admin', 'owner')
            )
          );

        -- Create function to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_attachment_files_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger for updated_at
        DROP TRIGGER IF EXISTS trigger_update_attachment_files_updated_at ON attachment_files;
        CREATE TRIGGER trigger_update_attachment_files_updated_at
          BEFORE UPDATE ON attachment_files
          FOR EACH ROW
          EXECUTE FUNCTION update_attachment_files_updated_at();
      `
    })

    if (filesError) {
      console.error('Error creating attachment_files table:', filesError)
    } else {
      console.log('✅ attachment_files table created successfully')
    }

    console.log('🎉 All migrations applied successfully!')
    console.log('The attachment infrastructure is now ready to use.')

  } catch (error) {
    console.error('Error applying migrations:', error)
    process.exit(1)
  }
}

applyMigrations()
