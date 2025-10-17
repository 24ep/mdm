BEGIN;

-- Create spaces table
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create space members table for access control
CREATE TABLE IF NOT EXISTS public.space_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(space_id, user_id)
);

-- Add space_id to existing tables that should be space-scoped
ALTER TABLE public.data_models ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE;
ALTER TABLE public.views ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE;
ALTER TABLE public.import_jobs ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE;
ALTER TABLE public.export_jobs ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE;

-- Add space_id to workflow-related tables (if they exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflows') THEN
        ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for space-related queries
CREATE INDEX IF NOT EXISTS idx_spaces_created_by ON public.spaces(created_by);
CREATE INDEX IF NOT EXISTS idx_spaces_is_default ON public.spaces(is_default);
CREATE INDEX IF NOT EXISTS idx_spaces_is_active ON public.spaces(is_active);
CREATE INDEX IF NOT EXISTS idx_spaces_deleted_at ON public.spaces(deleted_at);

CREATE INDEX IF NOT EXISTS idx_space_members_space_id ON public.space_members(space_id);
CREATE INDEX IF NOT EXISTS idx_space_members_user_id ON public.space_members(user_id);
CREATE INDEX IF NOT EXISTS idx_space_members_role ON public.space_members(role);

-- Create indexes for space-scoped entities
CREATE INDEX IF NOT EXISTS idx_data_models_space_id ON public.data_models(space_id);
CREATE INDEX IF NOT EXISTS idx_assignments_space_id ON public.assignments(space_id);
CREATE INDEX IF NOT EXISTS idx_customers_space_id ON public.customers(space_id);
CREATE INDEX IF NOT EXISTS idx_views_space_id ON public.views(space_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_space_id ON public.import_jobs(space_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_space_id ON public.export_jobs(space_id);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON public.spaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_space_members_updated_at BEFORE UPDATE ON public.space_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to ensure only one default space per user
CREATE OR REPLACE FUNCTION ensure_single_default_space()
RETURNS TRIGGER AS $$
BEGIN
    -- If this space is being set as default, unset all other default spaces for this user
    IF NEW.is_default = true THEN
        UPDATE public.spaces 
        SET is_default = false 
        WHERE created_by = NEW.created_by 
        AND id != NEW.id 
        AND is_default = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure single default space per user
CREATE TRIGGER ensure_single_default_space_trigger
    BEFORE INSERT OR UPDATE ON public.spaces
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_space();

-- Create a function to automatically add space owner as member
CREATE OR REPLACE FUNCTION add_space_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
    -- Add the creator as owner of the space
    INSERT INTO public.space_members (space_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (space_id, user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add space owner as member
CREATE TRIGGER add_space_owner_as_member_trigger
    AFTER INSERT ON public.spaces
    FOR EACH ROW
    EXECUTE FUNCTION add_space_owner_as_member();

COMMIT;
