-- Import Profiles Migration
-- This migration creates tables for managing import profiles and their sharing configurations

-- Import Profiles table
CREATE TABLE IF NOT EXISTS import_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    data_model VARCHAR(100) NOT NULL,
    file_types TEXT[] NOT NULL DEFAULT ARRAY['csv', 'xlsx'], -- Allowed file types
    header_row INTEGER NOT NULL DEFAULT 1, -- Row number where headers are located
    data_start_row INTEGER NOT NULL DEFAULT 2, -- Row number where data starts
    chunk_size INTEGER NOT NULL DEFAULT 1000, -- Number of items per chunk
    max_items INTEGER, -- Maximum number of items to import (null = no limit)
    import_type VARCHAR(20) NOT NULL DEFAULT 'insert' CHECK (import_type IN ('insert', 'upsert', 'delete')),
    primary_key_attribute VARCHAR(100), -- Primary key attribute for upsert/delete operations
    date_format VARCHAR(50) DEFAULT 'YYYY-MM-DD', -- Date format for parsing
    time_format VARCHAR(50) DEFAULT 'HH:mm:ss', -- Time format for parsing
    boolean_format VARCHAR(20) DEFAULT 'true/false', -- Boolean format (true/false, yes/no, 1/0, etc.)
    attribute_mapping JSONB NOT NULL DEFAULT '{}', -- Mapping of file columns to data model attributes
    attribute_options JSONB NOT NULL DEFAULT '{}', -- Options for select/multi-select attributes
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Import Profile Sharing table
CREATE TABLE IF NOT EXISTS import_profile_sharing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES import_profiles(id) ON DELETE CASCADE,
    sharing_type VARCHAR(20) NOT NULL CHECK (sharing_type IN ('all_users', 'group', 'specific_users')),
    target_id UUID REFERENCES users(id) ON DELETE CASCADE, -- For specific_users
    target_group VARCHAR(100), -- For group sharing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_import_profiles_created_by ON import_profiles(created_by);
CREATE INDEX IF NOT EXISTS idx_import_profiles_data_model ON import_profiles(data_model);
CREATE INDEX IF NOT EXISTS idx_import_profiles_is_public ON import_profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_import_profiles_import_type ON import_profiles(import_type);
CREATE INDEX IF NOT EXISTS idx_import_profile_sharing_profile_id ON import_profile_sharing(profile_id);
CREATE INDEX IF NOT EXISTS idx_import_profile_sharing_type ON import_profile_sharing(sharing_type);
CREATE INDEX IF NOT EXISTS idx_import_profile_sharing_target_id ON import_profile_sharing(target_id);

-- RLS Policies for import_profiles
ALTER TABLE import_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view profiles they created or public profiles
CREATE POLICY "Users can view their own import profiles and public profiles" ON import_profiles
    FOR SELECT USING (
        created_by = auth.uid() OR 
        is_public = true OR
        EXISTS (
            SELECT 1 FROM import_profile_sharing ips 
            WHERE ips.profile_id = import_profiles.id 
            AND (
                ips.sharing_type = 'all_users' OR
                (ips.sharing_type = 'specific_users' AND ips.target_id = auth.uid())
            )
        )
    );

-- Users can create profiles
CREATE POLICY "Users can create import profiles" ON import_profiles
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update their own profiles
CREATE POLICY "Users can update their own import profiles" ON import_profiles
    FOR UPDATE USING (created_by = auth.uid());

-- Users can delete their own profiles
CREATE POLICY "Users can delete their own import profiles" ON import_profiles
    FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for import_profile_sharing
ALTER TABLE import_profile_sharing ENABLE ROW LEVEL SECURITY;

-- Users can view sharing configurations for profiles they created
CREATE POLICY "Users can view sharing for their import profiles" ON import_profile_sharing
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM import_profiles ip 
            WHERE ip.id = import_profile_sharing.profile_id 
            AND ip.created_by = auth.uid()
        )
    );

-- Users can manage sharing for their own profiles
CREATE POLICY "Users can manage sharing for their import profiles" ON import_profile_sharing
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM import_profiles ip 
            WHERE ip.id = import_profile_sharing.profile_id 
            AND ip.created_by = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_import_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_import_profiles_updated_at
    BEFORE UPDATE ON import_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_import_profiles_updated_at();

-- Insert some sample import profiles (only if users exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        INSERT INTO import_profiles (
            name, description, data_model, file_types, header_row, data_start_row, 
            chunk_size, max_items, import_type, primary_key_attribute, date_format, 
            time_format, boolean_format, attribute_mapping, attribute_options, 
            is_public, created_by
        ) VALUES
        (
            'Customer Import - Standard',
            'Standard customer import with basic mapping',
            'Customer',
            ARRAY['csv', 'xlsx'],
            1,
            2,
            1000,
            10000,
            'upsert',
            'email',
            'YYYY-MM-DD',
            'HH:mm:ss',
            'true/false',
            '{"firstName": "first_name", "lastName": "last_name", "email": "email", "phone": "phone_number"}',
            '{"status": ["active", "inactive", "pending"], "industry": ["technology", "finance", "healthcare"]}',
            true,
            (SELECT id FROM users LIMIT 1)
        ),
        (
            'Company Import - Bulk',
            'Bulk company import for large datasets',
            'Company',
            ARRAY['csv'],
            1,
            2,
            5000,
            50000,
            'insert',
            null,
            'MM/DD/YYYY',
            'HH:mm',
            'yes/no',
            '{"name": "company_name", "industry": "sector", "website": "url", "phone": "contact_phone"}',
            '{"industry": ["technology", "finance", "healthcare", "manufacturing", "retail"]}',
            false,
            (SELECT id FROM users LIMIT 1)
        );

        -- Insert sharing configurations for the sample profiles
        INSERT INTO import_profile_sharing (profile_id, sharing_type) VALUES
        (
            (SELECT id FROM import_profiles WHERE name = 'Customer Import - Standard'),
            'all_users'
        );
    END IF;
END $$;
