-- Reports and Dashboards Module Database Schema
-- This schema supports reports from multiple sources: Built-in, Power BI, Grafana, Looker Studio

-- Report Categories (for organizing reports)
CREATE TABLE IF NOT EXISTS public.report_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.report_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    UNIQUE(name, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_report_categories_parent_id ON public.report_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_report_categories_deleted_at ON public.report_categories(deleted_at);

-- Report Folders (for organizing reports)
CREATE TABLE IF NOT EXISTS public.report_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.report_folders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    UNIQUE(name, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_report_folders_parent_id ON public.report_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_report_folders_deleted_at ON public.report_folders(deleted_at);

-- Reports Table (supports all source types)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    source VARCHAR(50) NOT NULL CHECK (source IN ('BUILT_IN', 'POWER_BI', 'GRAFANA', 'LOOKER_STUDIO')),
    category_id UUID REFERENCES public.report_categories(id) ON DELETE SET NULL,
    folder_id UUID REFERENCES public.report_folders(id) ON DELETE SET NULL,
    
    -- Common attributes for all sources
    owner VARCHAR(255),
    link TEXT,
    workspace VARCHAR(255),
    embed_url TEXT,
    
    -- Metadata (JSONB for flexible storage of source-specific data)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Status and visibility
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_source ON public.reports(source);
CREATE INDEX IF NOT EXISTS idx_reports_category_id ON public.reports(category_id);
CREATE INDEX IF NOT EXISTS idx_reports_folder_id ON public.reports(folder_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON public.reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_deleted_at ON public.reports(deleted_at);
CREATE INDEX IF NOT EXISTS idx_reports_is_active ON public.reports(is_active);
CREATE INDEX IF NOT EXISTS idx_reports_metadata ON public.reports USING GIN(metadata);

-- Report Spaces (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.report_spaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(report_id, space_id)
);

CREATE INDEX IF NOT EXISTS idx_report_spaces_report_id ON public.report_spaces(report_id);
CREATE INDEX IF NOT EXISTS idx_report_spaces_space_id ON public.report_spaces(space_id);

-- Report Permissions (for fine-grained access control)
CREATE TABLE IF NOT EXISTS public.report_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission VARCHAR(50) NOT NULL CHECK (permission IN ('view', 'edit', 'delete', 'share')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    UNIQUE(report_id, user_id, role_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_report_permissions_report_id ON public.report_permissions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_permissions_user_id ON public.report_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_report_permissions_role_id ON public.report_permissions(role_id);

-- Report Integrations (for external service configurations)
CREATE TABLE IF NOT EXISTS public.report_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    source VARCHAR(50) NOT NULL CHECK (source IN ('power-bi', 'grafana', 'looker-studio')),
    access_type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_report_integrations_source ON public.report_integrations(source);
CREATE INDEX IF NOT EXISTS idx_report_integrations_space_id ON public.report_integrations(space_id);
CREATE INDEX IF NOT EXISTS idx_report_integrations_created_by ON public.report_integrations(created_by);
CREATE INDEX IF NOT EXISTS idx_report_integrations_deleted_at ON public.report_integrations(deleted_at);
CREATE INDEX IF NOT EXISTS idx_report_integrations_config ON public.report_integrations USING GIN(config);

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_report_categories_updated_at BEFORE UPDATE ON public.report_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_folders_updated_at BEFORE UPDATE ON public.report_folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_integrations_updated_at BEFORE UPDATE ON public.report_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

