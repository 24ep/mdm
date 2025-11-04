BEGIN;

-- Function indexes for UUID columns cast to text
-- These indexes support efficient queries when using column::text = $1 pattern
-- (required for Prisma's $queryRawUnsafe which passes parameters as text)
-- 
-- These indexes allow PostgreSQL to use indexes even when columns are cast to text,
-- maintaining query performance while working with Prisma's parameter binding

-- Index for data_model_attributes.data_model_id (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_data_model_attributes_model_id_text 
ON public.data_model_attributes ((data_model_id::text))
WHERE is_active = TRUE AND deleted_at IS NULL;

-- Index for data_models.id
CREATE INDEX IF NOT EXISTS idx_data_models_id_text 
ON public.data_models ((id::text))
WHERE deleted_at IS NULL;

-- Index for data_records.data_model_id
CREATE INDEX IF NOT EXISTS idx_data_records_model_id_text 
ON public.data_records ((data_model_id::text))
WHERE deleted_at IS NULL;

-- Index for data_model_attributes joins (for LEFT JOIN queries)
CREATE INDEX IF NOT EXISTS idx_data_model_attributes_model_id_active 
ON public.data_model_attributes (data_model_id, is_active, deleted_at)
WHERE is_active = TRUE AND deleted_at IS NULL;

-- Additional indexes for common query patterns
-- Index for data_model_spaces junction table (if it exists and has deleted_at)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'data_model_spaces' 
    AND column_name = 'deleted_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_data_model_spaces_model_id_text 
    ON public.data_model_spaces ((data_model_id::text))
    WHERE deleted_at IS NULL;

    CREATE INDEX IF NOT EXISTS idx_data_model_spaces_space_id_text 
    ON public.data_model_spaces ((space_id::text))
    WHERE deleted_at IS NULL;
  ELSE
    -- Create indexes without WHERE clause if deleted_at doesn't exist
    CREATE INDEX IF NOT EXISTS idx_data_model_spaces_model_id_text 
    ON public.data_model_spaces ((data_model_id::text));

    CREATE INDEX IF NOT EXISTS idx_data_model_spaces_space_id_text 
    ON public.data_model_spaces ((space_id::text));
  END IF;
END $$;

COMMIT;

