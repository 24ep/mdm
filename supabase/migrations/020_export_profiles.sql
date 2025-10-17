-- Export Profiles Migration
-- This migration creates tables for managing export profiles and their sharing configurations

-- Export Profiles table
CREATE TABLE IF NOT EXISTS export_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    data_model VARCHAR(100) NOT NULL,
    format VARCHAR(20) NOT NULL DEFAULT 'xlsx',
    columns JSONB NOT NULL DEFAULT '[]',
    filters JSONB NOT NULL DEFAULT '[]',
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Export Profile Sharing table
CREATE TABLE IF NOT EXISTS export_profile_sharing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES export_profiles(id) ON DELETE CASCADE,
    sharing_type VARCHAR(20) NOT NULL CHECK (sharing_type IN ('all_users', 'group', 'specific_users')),
    target_id UUID REFERENCES users(id) ON DELETE CASCADE, -- For specific_users
    target_group VARCHAR(100), -- For group sharing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_export_profiles_created_by ON export_profiles(created_by);
CREATE INDEX IF NOT EXISTS idx_export_profiles_data_model ON export_profiles(data_model);
CREATE INDEX IF NOT EXISTS idx_export_profiles_is_public ON export_profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_export_profile_sharing_profile_id ON export_profile_sharing(profile_id);
CREATE INDEX IF NOT EXISTS idx_export_profile_sharing_type ON export_profile_sharing(sharing_type);
CREATE INDEX IF NOT EXISTS idx_export_profile_sharing_target_id ON export_profile_sharing(target_id);

-- RLS Policies for export_profiles
ALTER TABLE export_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view profiles they created or public profiles
CREATE POLICY "Users can view their own profiles and public profiles" ON export_profiles
    FOR SELECT USING (
        created_by = auth.uid() OR 
        is_public = true OR
        EXISTS (
            SELECT 1 FROM export_profile_sharing eps 
            WHERE eps.profile_id = export_profiles.id 
            AND (
                eps.sharing_type = 'all_users' OR
                (eps.sharing_type = 'specific_users' AND eps.target_id = auth.uid())
            )
        )
    );

-- Users can create profiles
CREATE POLICY "Users can create profiles" ON export_profiles
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update their own profiles
CREATE POLICY "Users can update their own profiles" ON export_profiles
    FOR UPDATE USING (created_by = auth.uid());

-- Users can delete their own profiles
CREATE POLICY "Users can delete their own profiles" ON export_profiles
    FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for export_profile_sharing
ALTER TABLE export_profile_sharing ENABLE ROW LEVEL SECURITY;

-- Users can view sharing configurations for profiles they created
CREATE POLICY "Users can view sharing for their profiles" ON export_profile_sharing
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM export_profiles ep 
            WHERE ep.id = export_profile_sharing.profile_id 
            AND ep.created_by = auth.uid()
        )
    );

-- Users can manage sharing for their own profiles
CREATE POLICY "Users can manage sharing for their profiles" ON export_profile_sharing
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM export_profiles ep 
            WHERE ep.id = export_profile_sharing.profile_id 
            AND ep.created_by = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_export_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_export_profiles_updated_at
    BEFORE UPDATE ON export_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_export_profiles_updated_at();

-- Insert some sample export profiles (only if users exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        INSERT INTO export_profiles (name, description, data_model, format, columns, filters, is_public, created_by) VALUES
        (
            'Customer Active Records',
            'Export all active customer records with basic information',
            'Customer',
            'xlsx',
            '["firstName", "lastName", "email", "phone", "status", "createdAt"]',
            '[{"attribute": "status", "operator": "equals", "value": "active"}]',
            true,
            (SELECT id FROM users LIMIT 1)
        ),
        (
            'Company Technology Sector',
            'Export companies in technology industry',
            'Company',
            'csv',
            '["name", "industry", "website", "phone", "address"]',
            '[{"attribute": "industry", "operator": "equals", "value": "technology"}]',
            false,
            (SELECT id FROM users LIMIT 1)
        );

        -- Insert sharing configurations for the sample profiles
        INSERT INTO export_profile_sharing (profile_id, sharing_type) VALUES
        (
            (SELECT id FROM export_profiles WHERE name = 'Customer Active Records'),
            'all_users'
        );
    END IF;
END $$;
