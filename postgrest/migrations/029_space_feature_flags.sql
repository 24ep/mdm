-- Add per-space feature flags
BEGIN;

ALTER TABLE public.spaces
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{"assignments": true, "bulk_activity": true, "workflows": true, "dashboard": true}'::jsonb;

-- Optional: individual boolean columns if preferred by consumers; keep JSONB as source of truth
ALTER TABLE public.spaces
  ADD COLUMN IF NOT EXISTS enable_assignments BOOLEAN GENERATED ALWAYS AS ((features->>'assignments')::boolean) STORED,
  ADD COLUMN IF NOT EXISTS enable_bulk_activity BOOLEAN GENERATED ALWAYS AS ((features->>'bulk_activity')::boolean) STORED,
  ADD COLUMN IF NOT EXISTS enable_workflows BOOLEAN GENERATED ALWAYS AS ((features->>'workflows')::boolean) STORED,
  ADD COLUMN IF NOT EXISTS enable_dashboard BOOLEAN GENERATED ALWAYS AS ((features->>'dashboard')::boolean) STORED;

COMMIT;


