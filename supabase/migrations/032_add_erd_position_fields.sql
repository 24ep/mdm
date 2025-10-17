-- Add ERD position fields to data_models table
ALTER TABLE public.data_models 
ADD COLUMN IF NOT EXISTS erd_position_x INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS erd_position_y INTEGER DEFAULT 100;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_data_models_erd_position 
ON public.data_models(erd_position_x, erd_position_y);

-- Add comment for documentation
COMMENT ON COLUMN public.data_models.erd_position_x IS 'X coordinate for ERD diagram positioning';
COMMENT ON COLUMN public.data_models.erd_position_y IS 'Y coordinate for ERD diagram positioning';
