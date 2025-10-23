-- Add slug column to data_models, backfill values, enforce uniqueness (excluding soft-deleted rows)

-- 1) Add the column as nullable first
ALTER TABLE public.data_models
ADD COLUMN IF NOT EXISTS slug text;

-- 2) Backfill slug values from name (slugify: lowercase, non-alphanum -> '-', collapse, trim)
UPDATE public.data_models dm
SET slug = NULLIF(
  btrim(
    regexp_replace(
      regexp_replace(lower(dm.name), '[^a-z0-9]+', '-', 'g')
    , '-{2,}', '-', 'g')
  , '-'),
  ''
)
WHERE dm.slug IS NULL;

-- 3) For any rows that still have NULL slug (e.g., empty/invalid names), use 'model' + short hash
UPDATE public.data_models dm
SET slug = 'model-' || substr(md5(dm.id::text), 1, 6)
WHERE dm.slug IS NULL;

-- 4) Resolve duplicates by appending a short per-row suffix
-- This updates ONLY those rows whose slug value appears more than once
WITH duplicate_slugs AS (
  SELECT slug
  FROM public.data_models
  WHERE deleted_at IS NULL
  GROUP BY slug
  HAVING COUNT(*) > 1
)
UPDATE public.data_models dm
SET slug = dm.slug || '-' || substr(md5(dm.id::text), 1, 6)
FROM duplicate_slugs d
WHERE dm.slug = d.slug
  AND dm.deleted_at IS NULL;

-- 5) Enforce NOT NULL
ALTER TABLE public.data_models
ALTER COLUMN slug SET NOT NULL;

-- 6) Add a uniqueness constraint across non-deleted rows (partial unique index)
DO $$ BEGIN
  -- Drop existing index if present (idempotent)
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'data_models_slug_unique_active'
  ) THEN
    DROP INDEX public.data_models_slug_unique_active;
  END IF;
END $$;

CREATE UNIQUE INDEX data_models_slug_unique_active
ON public.data_models (slug)
WHERE deleted_at IS NULL;


