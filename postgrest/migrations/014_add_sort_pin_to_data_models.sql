BEGIN;

-- Add sort_order and is_pinned columns to data_models
ALTER TABLE public.data_models
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Update existing models with default sort order
UPDATE public.data_models 
SET sort_order = EXTRACT(EPOCH FROM created_at)::INTEGER 
WHERE sort_order = 0;

COMMIT;
