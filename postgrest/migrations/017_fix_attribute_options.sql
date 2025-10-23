-- Fix attribute options to be part of attribute details, not separate model
-- This migration removes the separate attribute_options table and ensures
-- options are stored in the JSONB options field of data_model_attributes

-- Drop the separate attribute_options table if it exists
DROP TABLE IF EXISTS public.attribute_options;

-- Ensure the options field in data_model_attributes is properly configured
-- (This should already exist from previous migrations, but let's make sure)
ALTER TABLE public.data_model_attributes 
ALTER COLUMN options SET DEFAULT NULL;

-- Add a comment to clarify the purpose of the options field
COMMENT ON COLUMN public.data_model_attributes.options IS 'JSONB field containing attribute options for SELECT/MULTI_SELECT types. Format: [{"value": "option1", "label": "Option 1", "color": "#3B82F6"}]';
