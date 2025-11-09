-- Add Kong Gateway instances management table
BEGIN;

-- Create kong_instances table
CREATE TABLE IF NOT EXISTS public.kong_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  admin_url TEXT NOT NULL,
  admin_api_key TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  last_connected TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_kong_instances_name ON public.kong_instances(name);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_kong_instances_status ON public.kong_instances(status);

-- Create index on is_active for filtering active instances
CREATE INDEX IF NOT EXISTS idx_kong_instances_is_active ON public.kong_instances(is_active);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_kong_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kong_instances_updated_at
  BEFORE UPDATE ON public.kong_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_kong_instances_updated_at();

COMMIT;

