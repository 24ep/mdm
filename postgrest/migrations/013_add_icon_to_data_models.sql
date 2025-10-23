BEGIN;

-- Add icon column to data_models (string identifier of icon)
ALTER TABLE public.data_models
  ADD COLUMN IF NOT EXISTS icon TEXT;

COMMIT;


