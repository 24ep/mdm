-- Final data migration for EAV system
-- This migration converts existing data_models and data_records to the new EAV pattern

BEGIN;

-- Migrate data_model_attributes to eav_attributes (final version)
INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  default_value, options, validation_rules, sort_order, is_visible, is_editable,
  is_auto_increment, auto_increment_prefix, auto_increment_suffix,
  auto_increment_start, auto_increment_padding, current_auto_increment_value,
  metadata, is_active, created_at, updated_at, deleted_at
)
SELECT 
  id,
  name,
  display_name,
  data_model_id as entity_type_id,
  type::text::eav_data_type as data_type,
  is_required,
  is_unique,
  is_unique as is_indexed, -- Use is_unique as index hint
  TRUE as is_searchable,
  TRUE as is_auditable,
  default_value,
  COALESCE(options, '{}'::jsonb) as options,
  COALESCE(validation, '{}'::jsonb) as validation_rules,
  "order" as sort_order,
  TRUE as is_visible,
  TRUE as is_editable,
  FALSE as is_auto_increment,
  '' as auto_increment_prefix,
  '' as auto_increment_suffix,
  1 as auto_increment_start,
  3 as auto_increment_padding,
  0 as current_auto_increment_value,
  jsonb_build_object(
    'original_table', 'data_model_attributes'
  ) as metadata,
  is_active,
  created_at,
  updated_at,
  deleted_at
FROM public.data_model_attributes
WHERE NOT EXISTS (
  SELECT 1 FROM public.eav_attributes ea WHERE ea.id = data_model_attributes.id
);

-- Migrate data_records to eav_entities (final version)
INSERT INTO public.eav_entities (
  id, entity_type_id, is_active, metadata, created_by, created_at, updated_at, deleted_at
)
SELECT 
  dr.id,
  dr.data_model_id as entity_type_id,
  dr.is_active,
  jsonb_build_object(
    'original_table', 'data_records'
  ) as metadata,
  dr.created_by,
  dr.created_at,
  dr.updated_at,
  dr.deleted_at
FROM public.data_records dr
WHERE NOT EXISTS (
  SELECT 1 FROM public.eav_entities ee WHERE ee.id = dr.id
);

-- Migrate data_record_values to eav_values (final version)
INSERT INTO public.eav_values (
  id, entity_id, attribute_id, text_value, number_value, boolean_value, 
  date_value, datetime_value, json_value, created_at, updated_at
)
SELECT 
  drv.id,
  drv.data_record_id as entity_id,
  drv.attribute_id,
  CASE 
    WHEN a.data_type IN ('TEXT', 'EMAIL', 'PHONE', 'URL', 'TEXTAREA', 'SELECT', 'MULTI_SELECT', 'USER', 'USER_MULTI') 
    THEN drv.value
    ELSE NULL
  END as text_value,
  CASE 
    WHEN a.data_type = 'NUMBER' 
    THEN drv.value::DECIMAL
    ELSE NULL
  END as number_value,
  CASE 
    WHEN a.data_type = 'BOOLEAN' 
    THEN drv.value::BOOLEAN
    ELSE NULL
  END as boolean_value,
  CASE 
    WHEN a.data_type = 'DATE' 
    THEN drv.value::DATE
    ELSE NULL
  END as date_value,
  CASE 
    WHEN a.data_type IN ('DATETIME', 'TIMESTAMP') 
    THEN drv.value::TIMESTAMPTZ
    ELSE NULL
  END as datetime_value,
  CASE 
    WHEN a.data_type = 'JSON' 
    THEN drv.value::JSONB
    ELSE NULL
  END as json_value,
  drv.created_at,
  drv.updated_at
FROM public.data_record_values drv
JOIN public.eav_attributes a ON a.id = drv.attribute_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.eav_values ev WHERE ev.id = drv.id
);

-- Create attribute groups for better organization
-- Create a default group for each entity type
INSERT INTO public.attribute_groups (
  id, name, display_name, description, entity_type_id, sort_order, is_collapsible, is_required
)
SELECT 
  gen_random_uuid(),
  'default',
  'Default Attributes',
  'Default attribute group',
  et.id,
  0,
  FALSE,
  FALSE
FROM public.entity_types et
WHERE NOT EXISTS (
  SELECT 1 FROM public.attribute_groups ag WHERE ag.entity_type_id = et.id
);

-- Update eav_attributes to reference the default group
UPDATE public.eav_attributes 
SET attribute_group_id = (
  SELECT ag.id 
  FROM public.attribute_groups ag 
  WHERE ag.entity_type_id = eav_attributes.entity_type_id 
  AND ag.name = 'default'
)
WHERE attribute_group_id IS NULL;

COMMIT;
