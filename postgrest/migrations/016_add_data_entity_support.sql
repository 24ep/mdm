-- Add support for data entity attributes
-- This migration adds columns to support data entity relationships

-- Add columns to data_model_attributes for data entity configuration
ALTER TABLE public.data_model_attributes 
ADD COLUMN data_entity_model_id UUID REFERENCES public.data_models(id),
ADD COLUMN data_entity_attribute_id UUID REFERENCES public.data_model_attributes(id);

-- Add auto-increment configuration columns
ALTER TABLE public.data_model_attributes 
ADD COLUMN is_auto_increment BOOLEAN DEFAULT FALSE,
ADD COLUMN auto_increment_prefix TEXT DEFAULT '',
ADD COLUMN auto_increment_suffix TEXT DEFAULT '',
ADD COLUMN auto_increment_start INTEGER DEFAULT 1,
ADD COLUMN auto_increment_padding INTEGER DEFAULT 3,
ADD COLUMN current_auto_increment_value INTEGER DEFAULT 0;

-- Add index for better query performance
CREATE INDEX idx_data_model_attributes_entity_model ON public.data_model_attributes(data_entity_model_id);
CREATE INDEX idx_data_model_attributes_entity_attribute ON public.data_model_attributes(data_entity_attribute_id);

-- Update existing attributes to have proper primary key handling
-- Set id as primary key for all existing attributes where name is 'id'
UPDATE public.data_model_attributes 
SET is_unique = true, is_required = true 
WHERE name = 'id' AND data_type = 'text';

-- Note: Attribute options are stored in the JSONB 'options' field of data_model_attributes
-- This provides better performance and keeps options as part of the attribute details
-- Format: [{"value": "option1", "label": "Option 1", "color": "#3B82F6", "sort_order": 0}]
