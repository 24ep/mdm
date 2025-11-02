-- Layout Versions Migration
-- This migration creates version control system for space layouts

BEGIN;

-- Layout versions table
CREATE TABLE IF NOT EXISTS public.layout_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  layout_config JSONB NOT NULL,
  change_description TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_current BOOLEAN DEFAULT false,
  
  -- Ensure unique version numbers per space
  UNIQUE(space_id, version_number)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_layout_versions_space_id ON public.layout_versions(space_id);
CREATE INDEX IF NOT EXISTS idx_layout_versions_created_at ON public.layout_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_layout_versions_current ON public.layout_versions(space_id, is_current) WHERE is_current = true;

-- Function to get next version number for a space
CREATE OR REPLACE FUNCTION get_next_layout_version(space_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM public.layout_versions
  WHERE space_id = space_uuid;
  
  RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_layout_version_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER layout_version_updated_at
  BEFORE UPDATE ON public.layout_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_layout_version_timestamp();

COMMIT;

