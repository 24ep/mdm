-- Notebook Versions Migration
-- This migration creates version control system for notebooks

BEGIN;

-- Notebook versions table
CREATE TABLE IF NOT EXISTS public.notebook_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  notebook_id TEXT NOT NULL, -- Notebook identifier (can be file path or UUID)
  space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  notebook_data JSONB NOT NULL, -- Full notebook JSON data
  commit_message TEXT,
  commit_description TEXT,
  branch_name TEXT DEFAULT 'main',
  tags TEXT[], -- Version tags like ['v1.0.0']
  change_summary JSONB, -- Summary of changes: { files_added: [], files_modified: [], files_deleted: [], lines_added: 0, lines_deleted: 0 }
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_current BOOLEAN DEFAULT false,
  
  -- Ensure unique version numbers per notebook
  UNIQUE(notebook_id, version_number)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notebook_versions_notebook_id ON public.notebook_versions(notebook_id);
CREATE INDEX IF NOT EXISTS idx_notebook_versions_space_id ON public.notebook_versions(space_id);
CREATE INDEX IF NOT EXISTS idx_notebook_versions_created_at ON public.notebook_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notebook_versions_current ON public.notebook_versions(notebook_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_notebook_versions_branch ON public.notebook_versions(notebook_id, branch_name);

-- Function to get next version number for a notebook
CREATE OR REPLACE FUNCTION get_next_notebook_version(notebook_uuid TEXT)
RETURNS INTEGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM public.notebook_versions
  WHERE notebook_id = notebook_uuid;
  
  RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set is_current when inserting new version
CREATE OR REPLACE FUNCTION set_current_notebook_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Set all other versions of this notebook to not current
  UPDATE public.notebook_versions
  SET is_current = false
  WHERE notebook_id = NEW.notebook_id AND id != NEW.id;
  
  -- Set the new version as current if is_current is true
  IF NEW.is_current = true THEN
    NEW.is_current = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set current version
CREATE TRIGGER notebook_version_set_current
  AFTER INSERT ON public.notebook_versions
  FOR EACH ROW
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION set_current_notebook_version();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notebook_version_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notebook_version_updated_at
  BEFORE UPDATE ON public.notebook_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_notebook_version_timestamp();

COMMIT;

