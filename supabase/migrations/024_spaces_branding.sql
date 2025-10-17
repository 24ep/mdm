BEGIN;

-- Add branding fields to spaces
ALTER TABLE public.spaces
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMIT;

