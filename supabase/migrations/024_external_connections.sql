-- External connections and data model source type
BEGIN;

-- Enum for data model source type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'data_model_source_type') THEN
    CREATE TYPE data_model_source_type AS ENUM ('INTERNAL', 'EXTERNAL');
  END IF;
END $$;

-- Table to store external database connection configurations
CREATE TABLE IF NOT EXISTS public.external_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  db_type TEXT NOT NULL, -- 'postgres' | 'mysql'
  host TEXT NOT NULL,
  port INTEGER,
  database TEXT,
  username TEXT,
  password TEXT, -- consider vault/secret manager in production
  options JSONB, -- ssl, schemas, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_external_connections_space_id ON public.external_connections(space_id);
CREATE INDEX IF NOT EXISTS idx_external_connections_is_active ON public.external_connections(is_active);

-- Extend data_models with external source configuration
ALTER TABLE public.data_models
  ADD COLUMN IF NOT EXISTS source_type data_model_source_type DEFAULT 'INTERNAL',
  ADD COLUMN IF NOT EXISTS external_connection_id UUID REFERENCES public.external_connections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS external_schema TEXT,
  ADD COLUMN IF NOT EXISTS external_table TEXT,
  ADD COLUMN IF NOT EXISTS external_primary_key TEXT;

-- Optional: mapping rules per attribute (kept simple here; can be expanded later)
ALTER TABLE public.data_model_attributes
  ADD COLUMN IF NOT EXISTS external_column TEXT;

COMMIT;


