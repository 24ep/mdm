-- Add missing entity types and migrate data
BEGIN;

-- Add missing entity types
INSERT INTO public.entity_types (
  id, name, display_name, description, is_active, sort_order, 
  metadata, created_at, updated_at, deleted_at
)
SELECT 
  gen_random_uuid(),
  'industry',
  'Industry',
  'Industry classification',
  TRUE,
  3,
  jsonb_build_object(
    'original_table', 'industries',
    'icon', 'industry',
    'color', 'orange'
  ),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
WHERE NOT EXISTS (SELECT 1 FROM public.entity_types WHERE name = 'industry')

UNION ALL

SELECT 
  gen_random_uuid(),
  'title',
  'Title',
  'Job title information',
  TRUE,
  7,
  jsonb_build_object(
    'original_table', 'titles',
    'icon', 'badge',
    'color', 'pink'
  ),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
WHERE NOT EXISTS (SELECT 1 FROM public.entity_types WHERE name = 'title');

-- Add basic attributes for industry
INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'name',
  'Industry Name',
  et.id,
  'TEXT'::eav_data_type,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  1,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'industry'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'name')

UNION ALL

SELECT 
  gen_random_uuid(),
  'description',
  'Description',
  et.id,
  'TEXTAREA'::eav_data_type,
  FALSE,
  FALSE,
  FALSE,
  TRUE,
  TRUE,
  2,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'industry'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'description')

UNION ALL

SELECT 
  gen_random_uuid(),
  'is_active',
  'Active',
  et.id,
  'BOOLEAN'::eav_data_type,
  FALSE,
  FALSE,
  FALSE,
  TRUE,
  TRUE,
  3,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'industry'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'is_active');

-- Add basic attributes for title
INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'name',
  'Title Name',
  et.id,
  'TEXT'::eav_data_type,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  1,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'title'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'name')

UNION ALL

SELECT 
  gen_random_uuid(),
  'description',
  'Description',
  et.id,
  'TEXTAREA'::eav_data_type,
  FALSE,
  FALSE,
  FALSE,
  TRUE,
  TRUE,
  2,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'title'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'description')

UNION ALL

SELECT 
  gen_random_uuid(),
  'is_active',
  'Active',
  et.id,
  'BOOLEAN'::eav_data_type,
  FALSE,
  FALSE,
  FALSE,
  TRUE,
  TRUE,
  3,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'title'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'is_active');

-- Migrate existing data to EAV entities
-- Migrate industries
INSERT INTO public.eav_entities (id, entity_type_id, is_active, metadata, created_at, updated_at, deleted_at)
SELECT 
  i.id,
  et.id as entity_type_id,
  COALESCE(i.is_active, TRUE),
  jsonb_build_object('original_table', 'industries'),
  COALESCE(i.created_at, NOW()),
  COALESCE(i.updated_at, NOW()),
  i.deleted_at
FROM public.industries i
CROSS JOIN public.entity_types et
WHERE et.name = 'industry'
AND NOT EXISTS (SELECT 1 FROM public.eav_entities ee WHERE ee.id = i.id);

-- Migrate titles
INSERT INTO public.eav_entities (id, entity_type_id, is_active, metadata, created_at, updated_at, deleted_at)
SELECT 
  t.id,
  et.id as entity_type_id,
  COALESCE(t.is_active, TRUE),
  jsonb_build_object('original_table', 'titles'),
  COALESCE(t.created_at, NOW()),
  COALESCE(t.updated_at, NOW()),
  t.deleted_at
FROM public.titles t
CROSS JOIN public.entity_types et
WHERE et.name = 'title'
AND NOT EXISTS (SELECT 1 FROM public.eav_entities ee WHERE ee.id = t.id);

-- Migrate values for industries - name
INSERT INTO public.eav_values (
  id, entity_id, attribute_id, text_value, number_value, boolean_value, 
  date_value, datetime_value, json_value, blob_value, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  i.name,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.industries i
JOIN public.eav_entities ee ON ee.id = i.id
JOIN public.eav_attributes ea ON ea.entity_type_id = ee.entity_type_id AND ea.name = 'name'
WHERE NOT EXISTS (
  SELECT 1 FROM public.eav_values ev 
  WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id
);

-- Migrate values for industries - description
INSERT INTO public.eav_values (
  id, entity_id, attribute_id, text_value, number_value, boolean_value, 
  date_value, datetime_value, json_value, blob_value, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  i.description,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.industries i
JOIN public.eav_entities ee ON ee.id = i.id
JOIN public.eav_attributes ea ON ea.entity_type_id = ee.entity_type_id AND ea.name = 'description'
WHERE i.description IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.eav_values ev 
  WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id
);

-- Migrate values for industries - is_active
INSERT INTO public.eav_values (
  id, entity_id, attribute_id, text_value, number_value, boolean_value, 
  date_value, datetime_value, json_value, blob_value, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  NULL,
  NULL,
  COALESCE(i.is_active, TRUE),
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.industries i
JOIN public.eav_entities ee ON ee.id = i.id
JOIN public.eav_attributes ea ON ea.entity_type_id = ee.entity_type_id AND ea.name = 'is_active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.eav_values ev 
  WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id
);

-- Migrate values for titles - name
INSERT INTO public.eav_values (
  id, entity_id, attribute_id, text_value, number_value, boolean_value, 
  date_value, datetime_value, json_value, blob_value, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  t.name,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.titles t
JOIN public.eav_entities ee ON ee.id = t.id
JOIN public.eav_attributes ea ON ea.entity_type_id = ee.entity_type_id AND ea.name = 'name'
WHERE NOT EXISTS (
  SELECT 1 FROM public.eav_values ev 
  WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id
);

-- Migrate values for titles - description
INSERT INTO public.eav_values (
  id, entity_id, attribute_id, text_value, number_value, boolean_value, 
  date_value, datetime_value, json_value, blob_value, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  t.description,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.titles t
JOIN public.eav_entities ee ON ee.id = t.id
JOIN public.eav_attributes ea ON ea.entity_type_id = ee.entity_type_id AND ea.name = 'description'
WHERE t.description IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.eav_values ev 
  WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id
);

-- Migrate values for titles - is_active
INSERT INTO public.eav_values (
  id, entity_id, attribute_id, text_value, number_value, boolean_value, 
  date_value, datetime_value, json_value, blob_value, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  NULL,
  NULL,
  COALESCE(t.is_active, TRUE),
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.titles t
JOIN public.eav_entities ee ON ee.id = t.id
JOIN public.eav_attributes ea ON ea.entity_type_id = ee.entity_type_id AND ea.name = 'is_active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.eav_values ev 
  WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id
);

COMMIT;
