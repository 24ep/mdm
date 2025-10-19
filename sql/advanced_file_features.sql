-- Advanced File Features Database Schema
-- Run this script on your PostgreSQL database after the basic attachment setup

-- File Categories and Tags
CREATE TABLE IF NOT EXISTS public.file_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    space_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color
    icon VARCHAR(50) DEFAULT 'folder',
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL,
    UNIQUE(space_id, name)
);

CREATE TABLE IF NOT EXISTS public.file_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    space_id UUID NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL,
    UNIQUE(space_id, name)
);

CREATE TABLE IF NOT EXISTS public.file_categorizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES public.attachment_files(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.file_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS public.file_tag_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES public.attachment_files(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.file_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL,
    UNIQUE(file_id, tag_id)
);

-- File Versioning
CREATE TABLE IF NOT EXISTS public.file_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES public.attachment_files(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    change_log TEXT,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    is_current BOOLEAN DEFAULT false,
    UNIQUE(file_id, version_number)
);

-- File Sharing and Permissions
CREATE TABLE IF NOT EXISTS public.file_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES public.attachment_files(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL,
    shared_with VARCHAR(255) NOT NULL, -- user ID or email
    permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('view', 'download', 'edit')),
    is_public BOOLEAN DEFAULT false,
    password_hash VARCHAR(255), -- for password-protected shares
    expires_at TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File Search Index
CREATE TABLE IF NOT EXISTS public.file_search_index (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES public.attachment_files(id) ON DELETE CASCADE,
    search_text TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    tags TEXT[], -- Array of tag names
    categories TEXT[], -- Array of category names
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File Analytics
CREATE TABLE IF NOT EXISTS public.file_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    space_id UUID NOT NULL,
    date DATE NOT NULL,
    total_files INTEGER DEFAULT 0,
    total_size BIGINT DEFAULT 0,
    uploads_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    file_types JSONB DEFAULT '{}', -- {type: count}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(space_id, date)
);

-- File Processing Jobs
CREATE TABLE IF NOT EXISTS public.file_processing_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES public.attachment_files(id) ON DELETE CASCADE,
    processor_type VARCHAR(50) NOT NULL, -- 'resize', 'convert', 'extract', etc.
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    input_config JSONB DEFAULT '{}',
    output_config JSONB DEFAULT '{}',
    result_file_id UUID REFERENCES public.attachment_files(id),
    error_message TEXT,
    progress INTEGER DEFAULT 0, -- 0-100
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- File Backup Configuration
CREATE TABLE IF NOT EXISTS public.file_backup_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    space_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    source_provider VARCHAR(50) NOT NULL,
    target_provider VARCHAR(50) NOT NULL,
    schedule VARCHAR(20) NOT NULL CHECK (schedule IN ('daily', 'weekly', 'monthly')),
    retention_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    last_backup_at TIMESTAMPTZ,
    next_backup_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- File Notifications
CREATE TABLE IF NOT EXISTS public.file_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('upload', 'download', 'share', 'delete', 'quota', 'processing', 'backup')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    file_id UUID REFERENCES public.attachment_files(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- File Quotas
CREATE TABLE IF NOT EXISTS public.file_quotas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    space_id UUID NOT NULL UNIQUE,
    max_files INTEGER DEFAULT 1000,
    max_size BIGINT DEFAULT 1073741824, -- 1GB in bytes
    allowed_file_types TEXT[] DEFAULT '{}',
    current_files INTEGER DEFAULT 0,
    current_size BIGINT DEFAULT 0,
    warning_threshold INTEGER DEFAULT 80, -- percentage
    is_enforced BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File Workflows
CREATE TABLE IF NOT EXISTS public.file_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    space_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS public.file_workflow_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID NOT NULL REFERENCES public.file_workflows(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    approver_role VARCHAR(50) NOT NULL,
    is_required BOOLEAN DEFAULT true,
    step_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.file_workflow_instances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID NOT NULL REFERENCES public.file_workflows(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES public.attachment_files(id) ON DELETE CASCADE,
    current_step_id UUID REFERENCES public.file_workflow_steps(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected', 'cancelled')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_by UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS public.file_workflow_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instance_id UUID NOT NULL REFERENCES public.file_workflow_instances(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES public.file_workflow_steps(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected', 'pending')),
    comments TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_categories_space_id ON public.file_categories (space_id);
CREATE INDEX IF NOT EXISTS idx_file_tags_space_id ON public.file_tags (space_id);
CREATE INDEX IF NOT EXISTS idx_file_categorizations_file_id ON public.file_categorizations (file_id);
CREATE INDEX IF NOT EXISTS idx_file_categorizations_category_id ON public.file_categorizations (category_id);
CREATE INDEX IF NOT EXISTS idx_file_tag_assignments_file_id ON public.file_tag_assignments (file_id);
CREATE INDEX IF NOT EXISTS idx_file_tag_assignments_tag_id ON public.file_tag_assignments (tag_id);

CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON public.file_versions (file_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_version_number ON public.file_versions (version_number);
CREATE INDEX IF NOT EXISTS idx_file_versions_is_current ON public.file_versions (is_current);

CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON public.file_shares (file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with ON public.file_shares (shared_with);
CREATE INDEX IF NOT EXISTS idx_file_shares_is_public ON public.file_shares (is_public);
CREATE INDEX IF NOT EXISTS idx_file_shares_expires_at ON public.file_shares (expires_at);

CREATE INDEX IF NOT EXISTS idx_file_search_index_file_id ON public.file_search_index (file_id);
CREATE INDEX IF NOT EXISTS idx_file_search_index_search_text ON public.file_search_index USING gin(to_tsvector('english', search_text));
CREATE INDEX IF NOT EXISTS idx_file_search_index_tags ON public.file_search_index USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_file_search_index_categories ON public.file_search_index USING gin(categories);

CREATE INDEX IF NOT EXISTS idx_file_analytics_space_id ON public.file_analytics (space_id);
CREATE INDEX IF NOT EXISTS idx_file_analytics_date ON public.file_analytics (date);

CREATE INDEX IF NOT EXISTS idx_file_processing_jobs_file_id ON public.file_processing_jobs (file_id);
CREATE INDEX IF NOT EXISTS idx_file_processing_jobs_status ON public.file_processing_jobs (status);
CREATE INDEX IF NOT EXISTS idx_file_processing_jobs_processor_type ON public.file_processing_jobs (processor_type);

CREATE INDEX IF NOT EXISTS idx_file_notifications_user_id ON public.file_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_file_notifications_is_read ON public.file_notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_file_notifications_type ON public.file_notifications (type);

CREATE INDEX IF NOT EXISTS idx_file_quotas_space_id ON public.file_quotas (space_id);

CREATE INDEX IF NOT EXISTS idx_file_workflows_space_id ON public.file_workflows (space_id);
CREATE INDEX IF NOT EXISTS idx_file_workflow_steps_workflow_id ON public.file_workflow_steps (workflow_id);
CREATE INDEX IF NOT EXISTS idx_file_workflow_instances_workflow_id ON public.file_workflow_instances (workflow_id);
CREATE INDEX IF NOT EXISTS idx_file_workflow_instances_file_id ON public.file_workflow_instances (file_id);
CREATE INDEX IF NOT EXISTS idx_file_workflow_instances_status ON public.file_workflow_instances (status);

-- Create triggers for updated_at
CREATE TRIGGER update_file_categories_updated_at
    BEFORE UPDATE ON public.file_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_shares_updated_at
    BEFORE UPDATE ON public.file_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_backup_configs_updated_at
    BEFORE UPDATE ON public.file_backup_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_workflows_updated_at
    BEFORE UPDATE ON public.file_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_quotas_updated_at
    BEFORE UPDATE ON public.file_quotas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update file quotas
CREATE OR REPLACE FUNCTION update_file_quotas()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.file_quotas 
        SET current_files = current_files + 1, 
            current_size = current_size + NEW.file_size
        WHERE space_id = NEW.space_id;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.file_quotas 
        SET current_size = current_size - OLD.file_size + NEW.file_size
        WHERE space_id = NEW.space_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.file_quotas 
        SET current_files = current_files - 1, 
            current_size = current_size - OLD.file_size
        WHERE space_id = OLD.space_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update quotas
CREATE TRIGGER update_file_quotas_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.attachment_files
    FOR EACH ROW
    EXECUTE FUNCTION update_file_quotas();

-- Create function to update search index
CREATE OR REPLACE FUNCTION update_file_search_index()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.file_search_index (file_id, search_text, file_name, file_type, created_at, updated_at)
        VALUES (NEW.id, 
                LOWER(NEW.file_name || ' ' || COALESCE(NEW.mime_type, '')), 
                NEW.file_name, 
                NEW.mime_type, 
                NOW(), 
                NOW());
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.file_search_index 
        SET search_text = LOWER(NEW.file_name || ' ' || COALESCE(NEW.mime_type, '')),
            file_name = NEW.file_name,
            file_type = NEW.mime_type,
            updated_at = NOW()
        WHERE file_id = NEW.id;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM public.file_search_index WHERE file_id = OLD.id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update search index
CREATE TRIGGER update_file_search_index_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.attachment_files
    FOR EACH ROW
    EXECUTE FUNCTION update_file_search_index();

-- Enable RLS on all tables
ALTER TABLE public.file_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_categorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_backup_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_workflow_approvals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - adjust based on your auth system)
-- Note: These are basic policies - you'll need to customize them based on your authentication system

-- File Categories policies
CREATE POLICY "Users can view categories in their spaces" ON public.file_categories
    FOR SELECT USING (
        space_id IN (
            SELECT space_id FROM public.space_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Admins can manage categories in their spaces" ON public.file_categories
    FOR ALL USING (
        space_id IN (
            SELECT space_id FROM public.space_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- File Tags policies
CREATE POLICY "Users can view tags in their spaces" ON public.file_tags
    FOR SELECT USING (
        space_id IN (
            SELECT space_id FROM public.space_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Users can manage tags in their spaces" ON public.file_tags
    FOR ALL USING (
        space_id IN (
            SELECT space_id FROM public.space_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        )
    );

-- File Versions policies
CREATE POLICY "Users can view file versions in their spaces" ON public.file_versions
    FOR SELECT USING (
        file_id IN (
            SELECT af.id FROM public.attachment_files af
            JOIN public.space_members sm ON af.space_id = sm.space_id
            WHERE sm.user_id = auth.uid() AND sm.role IN ('owner', 'admin', 'member')
        )
    );

-- File Shares policies
CREATE POLICY "Users can view shares for files they have access to" ON public.file_shares
    FOR SELECT USING (
        file_id IN (
            SELECT af.id FROM public.attachment_files af
            JOIN public.space_members sm ON af.space_id = sm.space_id
            WHERE sm.user_id = auth.uid() AND sm.role IN ('owner', 'admin', 'member')
        )
    );

-- File Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.file_notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.file_notifications
    FOR UPDATE USING (user_id = auth.uid());

-- File Quotas policies
CREATE POLICY "Users can view quotas for their spaces" ON public.file_quotas
    FOR SELECT USING (
        space_id IN (
            SELECT space_id FROM public.space_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        )
    );

-- Insert default quotas for existing spaces
INSERT INTO public.file_quotas (space_id, max_files, max_size, allowed_file_types)
SELECT 
    id as space_id,
    1000 as max_files,
    1073741824 as max_size, -- 1GB
    ARRAY['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] as allowed_file_types
FROM public.spaces
WHERE id NOT IN (SELECT space_id FROM public.file_quotas)
ON CONFLICT DO NOTHING;

-- Insert default categories for existing spaces
INSERT INTO public.file_categories (space_id, name, description, color, icon, is_system, created_by)
SELECT 
    s.id as space_id,
    'Documents' as name,
    'Document files' as description,
    '#3B82F6' as color,
    'file-text' as icon,
    true as is_system,
    (SELECT user_id FROM public.space_members WHERE space_id = s.id AND role = 'owner' LIMIT 1) as created_by
FROM public.spaces s
WHERE NOT EXISTS (
    SELECT 1 FROM public.file_categories fc WHERE fc.space_id = s.id AND fc.name = 'Documents'
);

INSERT INTO public.file_categories (space_id, name, description, color, icon, is_system, created_by)
SELECT 
    s.id as space_id,
    'Images' as name,
    'Image files' as description,
    '#10B981' as color,
    'image' as icon,
    true as is_system,
    (SELECT user_id FROM public.space_members WHERE space_id = s.id AND role = 'owner' LIMIT 1) as created_by
FROM public.spaces s
WHERE NOT EXISTS (
    SELECT 1 FROM public.file_categories fc WHERE fc.space_id = s.id AND fc.name = 'Images'
);

INSERT INTO public.file_categories (space_id, name, description, color, icon, is_system, created_by)
SELECT 
    s.id as space_id,
    'Archives' as name,
    'Archive files' as description,
    '#F59E0B' as color,
    'archive' as icon,
    true as is_system,
    (SELECT user_id FROM public.space_members WHERE space_id = s.id AND role = 'owner' LIMIT 1) as created_by
FROM public.spaces s
WHERE NOT EXISTS (
    SELECT 1 FROM public.file_categories fc WHERE fc.space_id = s.id AND fc.name = 'Archives'
);

COMMENT ON TABLE public.file_categories IS 'File categories for organization';
COMMENT ON TABLE public.file_tags IS 'File tags for labeling';
COMMENT ON TABLE public.file_categorizations IS 'File to category assignments';
COMMENT ON TABLE public.file_tag_assignments IS 'File to tag assignments';
COMMENT ON TABLE public.file_versions IS 'File version history';
COMMENT ON TABLE public.file_shares IS 'File sharing and permissions';
COMMENT ON TABLE public.file_search_index IS 'Search index for files';
COMMENT ON TABLE public.file_analytics IS 'File usage analytics';
COMMENT ON TABLE public.file_processing_jobs IS 'File processing jobs';
COMMENT ON TABLE public.file_backup_configs IS 'File backup configurations';
COMMENT ON TABLE public.file_notifications IS 'File-related notifications';
COMMENT ON TABLE public.file_quotas IS 'File storage quotas per space';
COMMENT ON TABLE public.file_workflows IS 'File approval workflows';
COMMENT ON TABLE public.file_workflow_steps IS 'Workflow approval steps';
COMMENT ON TABLE public.file_workflow_instances IS 'Active workflow instances';
COMMENT ON TABLE public.file_workflow_approvals IS 'Workflow approval decisions';
