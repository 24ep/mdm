-- Add tags column to spaces table
BEGIN;

-- Add tags column as JSONB array to store space tags
ALTER TABLE public.spaces
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Create GIN index for efficient tag filtering and search
CREATE INDEX IF NOT EXISTS idx_spaces_tags ON public.spaces USING GIN (tags);

-- Add comment to explain the column
COMMENT ON COLUMN public.spaces.tags IS 'Array of tags for categorizing and filtering spaces';

COMMIT;

