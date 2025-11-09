-- Audit Logging Table for Reports Module
CREATE TABLE IF NOT EXISTS public.report_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'view', 'share', 'export', etc.
    resource_type VARCHAR(50) NOT NULL, -- 'report', 'category', 'folder', 'integration', 'permission'
    resource_id UUID, -- ID of the resource (report_id, category_id, etc.)
    details JSONB, -- Additional details about the action
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_audit_logs_user_id ON public.report_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_report_audit_logs_resource ON public.report_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_report_audit_logs_action ON public.report_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_report_audit_logs_created_at ON public.report_audit_logs(created_at DESC);

-- Report Versions Table
CREATE TABLE IF NOT EXISTS public.report_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(report_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_report_versions_report_id ON public.report_versions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_versions_created_at ON public.report_versions(created_at DESC);

-- Report Templates Table
CREATE TABLE IF NOT EXISTS public.report_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    source VARCHAR(50) NOT NULL CHECK (source IN ('BUILT_IN', 'POWER_BI', 'GRAFANA', 'LOOKER_STUDIO')),
    category_id UUID REFERENCES public.report_categories(id) ON DELETE SET NULL,
    folder_id UUID REFERENCES public.report_folders(id) ON DELETE SET NULL,
    metadata JSONB, -- Template configuration
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_report_templates_source ON public.report_templates(source);
CREATE INDEX IF NOT EXISTS idx_report_templates_public ON public.report_templates(is_public) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_report_templates_deleted_at ON public.report_templates(deleted_at);

-- Shareable Links Table
CREATE TABLE IF NOT EXISTS public.report_share_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT, -- Optional password protection
    expires_at TIMESTAMPTZ,
    max_views INTEGER,
    view_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_report_share_links_token ON public.report_share_links(token);
CREATE INDEX IF NOT EXISTS idx_report_share_links_report_id ON public.report_share_links(report_id);
CREATE INDEX IF NOT EXISTS idx_report_share_links_expires_at ON public.report_share_links(expires_at);

-- Function to create new report version
CREATE OR REPLACE FUNCTION create_report_version()
RETURNS TRIGGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
    FROM public.report_versions
    WHERE report_id = NEW.id;
    
    INSERT INTO public.report_versions (report_id, version_number, name, description, metadata, created_by)
    VALUES (NEW.id, next_version, NEW.name, NEW.description, NEW.metadata, NEW.created_by);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create version on report update
CREATE TRIGGER report_version_trigger
AFTER UPDATE ON public.reports
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name OR 
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.metadata IS DISTINCT FROM NEW.metadata)
EXECUTE FUNCTION create_report_version();

