-- Add slug to data_models and backfill from name
BEGIN;

-- 1) Add nullable slug column first
ALTER TABLE public.data_models
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2) Backfill slug values based on current name
-- slugify: lower, replace non-alphanumeric with '-', collapse dashes, trim dashes
UPDATE public.data_models dm
SET slug = trim(both '-' from regexp_replace(regexp_replace(lower(dm.name), '[^a-z0-9]+', '-', 'g'), '-{2,}', '-', 'g'))
WHERE slug IS NULL;

-- 3) Ensure uniqueness by appending short suffix where needed
WITH dups AS (
  SELECT id, slug,
         ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at, id) AS rn
  FROM public.data_models
)
UPDATE public.data_models dm
SET slug = CASE WHEN d.rn = 1 THEN dm.slug ELSE dm.slug || '-' || substr(md5(dm.id::text), 1, 6) END
FROM dups d
WHERE d.id = dm.id AND d.rn > 1;

-- 4) Add constraint/index and default not null
ALTER TABLE public.data_models
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_data_models_slug ON public.data_models(slug);

COMMIT;


