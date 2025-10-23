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
-- Users can view attachment storage config if they are members of the space
CREATE POLICY "Users can view attachment storage config if space member" ON space_attachment_storage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM space_members 
      WHERE space_members.space_id = space_attachment_storage.space_id 
      AND space_members.user_id = auth.uid()
    )
  );

-- Only admins and owners can modify attachment storage config
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
CREATE TRIGGER trigger_update_space_attachment_storage_updated_at
  BEFORE UPDATE ON space_attachment_storage
  FOR EACH ROW
  EXECUTE FUNCTION update_space_attachment_storage_updated_at();

-- Add comment to table
COMMENT ON TABLE space_attachment_storage IS 'Stores attachment storage configuration for each space';
COMMENT ON COLUMN space_attachment_storage.provider IS 'Storage provider: minio, s3, sftp, or ftp';
COMMENT ON COLUMN space_attachment_storage.config IS 'Provider-specific configuration stored as JSON';
