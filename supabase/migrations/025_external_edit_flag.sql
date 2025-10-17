-- Allow editing external records flag on data models
BEGIN;

ALTER TABLE public.data_models
  ADD COLUMN IF NOT EXISTS allow_external_edit BOOLEAN DEFAULT false;

COMMIT;


