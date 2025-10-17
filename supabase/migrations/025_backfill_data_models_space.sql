BEGIN;

-- Backfill data_models.space_id to a default space if missing
DO $$
DECLARE default_space UUID;
BEGIN
  -- Pick a default space; if multiple, choose the earliest created
  SELECT id INTO default_space FROM public.spaces WHERE is_default = true AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1;

  IF default_space IS NULL THEN
    -- Fallback: pick any non-deleted space
    SELECT id INTO default_space FROM public.spaces WHERE deleted_at IS NULL ORDER BY created_at ASC LIMIT 1;
  END IF;

  IF default_space IS NOT NULL THEN
    UPDATE public.data_models
    SET space_id = default_space
    WHERE space_id IS NULL;
  END IF;
END $$;

COMMIT;

