-- Create folders table for organizing data models and other entities
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'data_model', -- 'data_model', 'dashboard', etc.
    space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_space_id ON folders(space_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_type ON folders(type);
CREATE INDEX IF NOT EXISTS idx_folders_created_by ON folders(created_by);

-- Add folder_id column to data_models table
ALTER TABLE data_models 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Create index for folder_id in data_models
CREATE INDEX IF NOT EXISTS idx_data_models_folder_id ON data_models(folder_id);

-- Add RLS policies for folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view folders in spaces they're members of
CREATE POLICY "Users can view folders in their spaces" ON folders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM space_members 
            WHERE space_members.space_id = folders.space_id 
            AND space_members.user_id = auth.uid()
        )
    );

-- Policy: Users can create folders in spaces where they're admin/owner
CREATE POLICY "Admins can create folders" ON folders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM space_members 
            WHERE space_members.space_id = folders.space_id 
            AND space_members.user_id = auth.uid()
            AND space_members.role IN ('admin', 'owner')
        )
    );

-- Policy: Users can update folders in spaces where they're admin/owner
CREATE POLICY "Admins can update folders" ON folders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM space_members 
            WHERE space_members.space_id = folders.space_id 
            AND space_members.user_id = auth.uid()
            AND space_members.role IN ('admin', 'owner')
        )
    );

-- Policy: Users can delete folders in spaces where they're admin/owner
CREATE POLICY "Admins can delete folders" ON folders
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM space_members 
            WHERE space_members.space_id = folders.space_id 
            AND space_members.user_id = auth.uid()
            AND space_members.role IN ('admin', 'owner')
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION update_folders_updated_at();

-- Add constraint to prevent circular references in folder hierarchy
ALTER TABLE folders ADD CONSTRAINT check_no_circular_reference 
CHECK (id != parent_id);

-- Add constraint to ensure parent folder is in the same space
ALTER TABLE folders ADD CONSTRAINT check_parent_same_space 
CHECK (
    parent_id IS NULL OR 
    EXISTS (
        SELECT 1 FROM folders parent 
        WHERE parent.id = folders.parent_id 
        AND parent.space_id = folders.space_id
    )
);
