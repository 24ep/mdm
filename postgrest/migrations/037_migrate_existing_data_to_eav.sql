-- Migrate existing data to new EAV structure
-- This migration converts existing data_models and data_records to the new EAV pattern

BEGIN;

-- Migrate data_models to entity_types
INSERT INTO public.entity_types (
  id, name, display_name, description, is_active, sort_order, 
  metadata, created_at, updated_at, deleted_at
)
SELECT 
  id,
  name,
  COALESCE(display_name, name) as display_name,
  description,
  is_active,
  sort_order,
  jsonb_build_object(
    'original_table', 'data_models',
    'icon', icon,
    'slug', slug,
    'features', features,
    'sidebar_config', sidebar_config,
    'enable_assignments', enable_assignments,
    'enable_bulk_activity', enable_bulk_activity,
    'enable_workflows', enable_workflows,
    'enable_dashboard', enable_dashboard
  ) as metadata,
  created_at,
  updated_at,
  deleted_at
FROM public.data_models
WHERE NOT EXISTS (
  SELECT 1 FROM public.entity_types et WHERE et.id = data_models.id
);

-- Migrate data_model_attributes to eav_attributes
INSERT INTO public.eav_attributes (
  id, name, display_name, description, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  default_value, options, validation_rules, sort_order, is_visible, is_editable,
  is_auto_increment, auto_increment_prefix, auto_increment_suffix,
  auto_increment_start, auto_increment_padding, current_auto_increment_value,
  external_column, metadata, is_active, created_at, updated_at, deleted_at
)
SELECT 
  id,
  name,
  display_name,
  description,
  data_model_id as entity_type_id,
  type::eav_data_type as data_type,
  is_required,
  is_unique,
  is_unique as is_indexed, -- Use is_unique as index hint
  TRUE as is_searchable,
  TRUE as is_auditable,
  default_value,
  COALESCE(options, '{}'::jsonb) as options,
  COALESCE(validation_rules, '{}'::jsonb) as validation_rules,
  "order" as sort_order,
  TRUE as is_visible,
  TRUE as is_editable,
  is_auto_increment,
  auto_increment_prefix,
  auto_increment_suffix,
  auto_increment_start,
  auto_increment_padding,
  current_auto_increment_value,
  external_column,
  jsonb_build_object(
    'original_table', 'data_model_attributes',
    'data_entity_model_id', data_entity_model_id,
    'data_entity_attribute_id', data_entity_attribute_id
  ) as metadata,
  is_active,
  created_at,
  updated_at,
  deleted_at
FROM public.data_model_attributes
WHERE NOT EXISTS (
  SELECT 1 FROM public.eav_attributes ea WHERE ea.id = data_model_attributes.id
);

-- Migrate data_records to eav_entities
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

-- Migrate data_record_values to eav_values
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

-- Create views for backward compatibility
CREATE OR REPLACE VIEW public.data_models_compat AS
SELECT 
  et.id,
  et.name,
  et.display_name,
  et.description,
  et.is_active,
  et.sort_order,
  et.metadata->>'icon' as icon,
  et.metadata->>'slug' as slug,
  et.metadata->'features' as features,
  et.metadata->'sidebar_config' as sidebar_config,
  et.metadata->>'enable_assignments'::boolean as enable_assignments,
  et.metadata->>'enable_bulk_activity'::boolean as enable_bulk_activity,
  et.metadata->>'enable_workflows'::boolean as enable_workflows,
  et.metadata->>'enable_dashboard'::boolean as enable_dashboard,
  et.created_at,
  et.updated_at,
  et.deleted_at
FROM public.entity_types et;

CREATE OR REPLACE VIEW public.data_model_attributes_compat AS
SELECT 
  ea.id,
  ea.name,
  ea.display_name,
  ea.description,
  ea.entity_type_id as data_model_id,
  ea.data_type as type,
  ea.is_required,
  ea.is_unique,
  ea.default_value,
  ea.options,
  ea.validation_rules as validation,
  ea.sort_order as "order",
  ea.is_active,
  ea.created_at,
  ea.updated_at,
  ea.deleted_at,
  ea.is_auto_increment,
  ea.auto_increment_prefix,
  ea.auto_increment_suffix,
  ea.auto_increment_start,
  ea.auto_increment_padding,
  ea.current_auto_increment_value,
  ea.external_column
FROM public.eav_attributes ea;

CREATE OR REPLACE VIEW public.data_records_compat AS
SELECT 
  ee.id,
  ee.entity_type_id as data_model_id,
  ee.is_active,
  ee.created_by,
  ee.created_at,
  ee.updated_at,
  ee.deleted_at
FROM public.eav_entities ee;

CREATE OR REPLACE VIEW public.data_record_values_compat AS
SELECT 
  ev.id,
  ev.entity_id as data_record_id,
  ev.attribute_id,
  COALESCE(
    ev.text_value,
    ev.number_value::TEXT,
    ev.boolean_value::TEXT,
    ev.date_value::TEXT,
    ev.datetime_value::TEXT,
    ev.json_value::TEXT
  ) as value,
  ev.created_at,
  ev.updated_at
FROM public.eav_values ev;

-- Create helper functions for backward compatibility
CREATE OR REPLACE FUNCTION get_data_model_attributes(model_id UUID)
RETURNS TABLE(
  id UUID,
  name VARCHAR,
  display_name VARCHAR,
  type VARCHAR,
  is_required BOOLEAN,
  is_unique BOOLEAN,
  default_value TEXT,
  options JSONB,
  validation JSONB,
  "order" INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ea.id,
    ea.name,
    ea.display_name,
    ea.data_type::VARCHAR as type,
    ea.is_required,
    ea.is_unique,
    ea.default_value,
    ea.options,
    ea.validation_rules as validation,
    ea.sort_order as "order",
    ea.is_active,
    ea.created_at,
    ea.updated_at,
    ea.deleted_at
  FROM public.eav_attributes ea
  WHERE ea.entity_type_id = model_id
  AND ea.is_active = TRUE
  ORDER BY ea.sort_order, ea.name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_data_record_values(record_id UUID)
RETURNS TABLE(
  id UUID,
  data_record_id UUID,
  attribute_id UUID,
  value TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ev.id,
    ev.entity_id as data_record_id,
    ev.attribute_id,
    COALESCE(
      ev.text_value,
      ev.number_value::TEXT,
      ev.boolean_value::TEXT,
      ev.date_value::TEXT,
      ev.datetime_value::TEXT,
      ev.json_value::TEXT
    ) as value,
    ev.created_at,
    ev.updated_at
  FROM public.eav_values ev
  WHERE ev.entity_id = record_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance on the new tables
CREATE INDEX IF NOT EXISTS idx_eav_entities_entity_type_active 
  ON public.eav_entities(entity_type_id, is_active) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_eav_values_entity_attribute 
  ON public.eav_values(entity_id, attribute_id);

CREATE INDEX IF NOT EXISTS idx_eav_attributes_entity_type_active 
  ON public.eav_attributes(entity_type_id, is_active) 
  WHERE is_active = TRUE;

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_eav_values_text_search 
  ON public.eav_values USING gin(to_tsvector('english', text_value)) 
  WHERE text_value IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_eav_values_json_search 
  ON public.eav_values USING gin(json_value) 
  WHERE json_value IS NOT NULL;

COMMIT;
