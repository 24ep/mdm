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
-- Users can view attachment files if they have access to the data model
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

-- Users can insert attachment files if they have access to the data model
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

-- Users can update attachment files if they uploaded them or are admin/owner
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

-- Users can delete attachment files if they uploaded them or are admin/owner
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
CREATE TRIGGER trigger_update_attachment_files_updated_at
  BEFORE UPDATE ON attachment_files
  FOR EACH ROW
  EXECUTE FUNCTION update_attachment_files_updated_at();

-- Add comment to table
COMMENT ON TABLE attachment_files IS 'Stores metadata for uploaded attachment files';
COMMENT ON COLUMN attachment_files.original_name IS 'Original filename when uploaded';
COMMENT ON COLUMN attachment_files.stored_name IS 'Unique filename used for storage';
COMMENT ON COLUMN attachment_files.storage_provider IS 'Storage provider used: minio, s3, sftp, or ftp';
COMMENT ON COLUMN attachment_files.storage_path IS 'Path to file in storage provider';
COMMENT ON COLUMN attachment_files.storage_url IS 'Public URL to file (if available)';
