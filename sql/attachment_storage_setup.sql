-- Attachment Storage Infrastructure for PostgreSQL
-- Run this script on your PostgreSQL database

-- Create space_attachment_storage table
CREATE TABLE IF NOT EXISTS public.space_attachment_storage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    space_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('minio', 's3', 'sftp', 'ftp')),
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Create attachment_files table
CREATE TABLE IF NOT EXISTS public.attachment_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    space_id UUID NOT NULL,
    data_model_id UUID,
    attribute_id UUID,
    record_id UUID,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_space_attachment_storage_space_id ON public.space_attachment_storage (space_id);
CREATE INDEX IF NOT EXISTS idx_space_attachment_storage_provider ON public.space_attachment_storage (provider);
CREATE INDEX IF NOT EXISTS idx_space_attachment_storage_active ON public.space_attachment_storage (is_active);

CREATE INDEX IF NOT EXISTS idx_attachment_files_space_id ON public.attachment_files (space_id);
CREATE INDEX IF NOT EXISTS idx_attachment_files_data_model_id ON public.attachment_files (data_model_id);
CREATE INDEX IF NOT EXISTS idx_attachment_files_attribute_id ON public.attachment_files (attribute_id);
CREATE INDEX IF NOT EXISTS idx_attachment_files_record_id ON public.attachment_files (record_id);
CREATE INDEX IF NOT EXISTS idx_attachment_files_uploaded_by ON public.attachment_files (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachment_files_uploaded_at ON public.attachment_files (uploaded_at);
CREATE INDEX IF NOT EXISTS idx_attachment_files_deleted_at ON public.attachment_files (deleted_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_space_attachment_storage_updated_at ON public.space_attachment_storage;
CREATE TRIGGER update_space_attachment_storage_updated_at
    BEFORE UPDATE ON public.space_attachment_storage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies (if RLS is enabled)
-- Note: Adjust these policies based on your authentication system

-- Enable RLS on tables
ALTER TABLE public.space_attachment_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachment_files ENABLE ROW LEVEL SECURITY;

-- Create policies for space_attachment_storage
CREATE POLICY "Users can view storage config for their spaces" ON public.space_attachment_storage
    FOR SELECT USING (
        space_id IN (
            SELECT space_id FROM public.space_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Admins can manage storage config for their spaces" ON public.space_attachment_storage
    FOR ALL USING (
        space_id IN (
            SELECT space_id FROM public.space_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Create policies for attachment_files
CREATE POLICY "Users can view files in their spaces" ON public.attachment_files
    FOR SELECT USING (
        space_id IN (
            SELECT space_id FROM public.space_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Users can upload files to their spaces" ON public.attachment_files
    FOR INSERT WITH CHECK (
        space_id IN (
            SELECT space_id FROM public.space_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        ) AND uploaded_by = auth.uid()
    );

CREATE POLICY "Users can delete their own files" ON public.attachment_files
    FOR UPDATE USING (
        uploaded_by = auth.uid() AND
        space_id IN (
            SELECT space_id FROM public.space_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        )
    );

-- Insert default MinIO configuration for existing spaces
INSERT INTO public.space_attachment_storage (space_id, provider, config, is_active)
SELECT 
    id as space_id,
    'minio' as provider,
    '{
        "endpoint": "http://localhost:9000",
        "accessKey": "minioadmin",
        "secretKey": "minioadmin",
        "bucket": "attachments",
        "region": "us-east-1"
    }'::jsonb as config,
    true as is_active
FROM public.spaces
WHERE id NOT IN (
    SELECT space_id FROM public.space_attachment_storage WHERE provider = 'minio'
)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions (adjust based on your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_attachment_storage TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.attachment_files TO your_app_user;
-- GRANT USAGE ON SCHEMA public TO your_app_user;

COMMENT ON TABLE public.space_attachment_storage IS 'Configuration for attachment storage providers per space';
COMMENT ON TABLE public.attachment_files IS 'Metadata for uploaded attachment files';

COMMENT ON COLUMN public.space_attachment_storage.provider IS 'Storage provider: minio, s3, sftp, ftp';
COMMENT ON COLUMN public.space_attachment_storage.config IS 'Provider-specific configuration as JSON';

COMMENT ON COLUMN public.attachment_files.file_path IS 'Path to file in storage provider';
COMMENT ON COLUMN public.attachment_files.record_id IS 'ID of the record this file is attached to';
COMMENT ON COLUMN public.attachment_files.attribute_id IS 'ID of the attribute this file belongs to';
