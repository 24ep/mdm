BEGIN;

-- Add slug column (temporarily nullable)
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill slug from name; ensure uniqueness by appending short id when needed
DO $$
DECLARE r RECORD;
BEGIN
  -- Populate slug if null
  UPDATE public.spaces s
  SET slug = LOWER(REGEXP_REPLACE(COALESCE(NULLIF(s.name, ''), 'space'), '[^a-zA-Z0-9]+', '-', 'g'))
  WHERE s.slug IS NULL;

  -- Resolve empties to 'space'
  UPDATE public.spaces s SET slug = 'space' WHERE (s.slug IS NULL OR s.slug = '');

  -- Make unique by appending short id for duplicates
  FOR r IN (
    SELECT slug, ARRAY_AGG(id) AS ids
    FROM public.spaces
    GROUP BY slug
    HAVING COUNT(*) > 1
  ) LOOP
    -- Keep first id as-is, append suffix for the rest
    WITH ordered AS (
      SELECT id, ROW_NUMBER() OVER () AS rn
      FROM UNNEST(r.ids) id
    )
    UPDATE public.spaces s
    SET slug = r.slug || '-' || SUBSTRING(s.id::text FROM 1 FOR 8)
    FROM ordered o
    WHERE s.id = o.id AND o.rn > 1;
  END LOOP;
END $$;

-- Enforce constraints and index
ALTER TABLE public.spaces ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_spaces_slug ON public.spaces(slug);

COMMIT;

