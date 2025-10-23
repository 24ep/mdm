-- Convert hardcoded reference tables to EAV entities
-- This migration converts companies, sources, industries, events, positions, 
-- business_profiles, titles, and call_workflow_statuses to EAV entities

BEGIN;

-- Step 1: Create entity types for each hardcoded table
INSERT INTO public.entity_types (
  id, name, display_name, description, is_active, sort_order, 
  metadata, created_at, updated_at, deleted_at
)
SELECT 
  gen_random_uuid(),
  'company',
  'Company',
  'Company information',
  TRUE,
  1,
  jsonb_build_object(
    'original_table', 'companies',
    'icon', 'building',
    'color', 'blue'
  ),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
WHERE NOT EXISTS (SELECT 1 FROM public.entity_types WHERE name = 'company')

UNION ALL

SELECT 
  gen_random_uuid(),
  'source',
  'Source',
  'Lead source information',
  TRUE,
  2,
  jsonb_build_object(
    'original_table', 'sources',
    'icon', 'source',
    'color', 'green'
  ),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
WHERE NOT EXISTS (SELECT 1 FROM public.entity_types WHERE name = 'source')

UNION ALL

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
  'event',
  'Event',
  'Event information',
  TRUE,
  4,
  jsonb_build_object(
    'original_table', 'events',
    'icon', 'calendar',
    'color', 'purple'
  ),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
WHERE NOT EXISTS (SELECT 1 FROM public.entity_types WHERE name = 'event')

UNION ALL

SELECT 
  gen_random_uuid(),
  'position',
  'Position',
  'Job position information',
  TRUE,
  5,
  jsonb_build_object(
    'original_table', 'positions',
    'icon', 'briefcase',
    'color', 'indigo'
  ),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
WHERE NOT EXISTS (SELECT 1 FROM public.entity_types WHERE name = 'position')

UNION ALL

SELECT 
  gen_random_uuid(),
  'business_profile',
  'Business Profile',
  'Business profile information',
  TRUE,
  6,
  jsonb_build_object(
    'original_table', 'business_profiles',
    'icon', 'profile',
    'color', 'teal'
  ),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
WHERE NOT EXISTS (SELECT 1 FROM public.entity_types WHERE name = 'business_profile')

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
WHERE NOT EXISTS (SELECT 1 FROM public.entity_types WHERE name = 'title')

UNION ALL

SELECT 
  gen_random_uuid(),
  'call_workflow_status',
  'Call Workflow Status',
  'Call workflow status information',
  TRUE,
  8,
  jsonb_build_object(
    'original_table', 'call_workflow_statuses',
    'icon', 'phone',
    'color', 'red'
  ),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
WHERE NOT EXISTS (SELECT 1 FROM public.entity_types WHERE name = 'call_workflow_status');

-- Step 2: Create attributes for each entity type
-- Company attributes
INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'name',
  'Company Name',
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
FROM public.entity_types et WHERE et.name = 'company'

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
FROM public.entity_types et WHERE et.name = 'company'

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
FROM public.entity_types et WHERE et.name = 'company';

-- Source attributes
INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'name',
  'Source Name',
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
FROM public.entity_types et WHERE et.name = 'source'

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
FROM public.entity_types et WHERE et.name = 'source'

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
FROM public.entity_types et WHERE et.name = 'source';

-- Industry attributes
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

UNION ALL

SELECT 
  gen_random_uuid(),
  'parent_id',
  'Parent Industry',
  et.id,
  'REFERENCE'::eav_data_type,
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
  4,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'industry';

-- Event attributes
INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'name',
  'Event Name',
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
FROM public.entity_types et WHERE et.name = 'event'

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
FROM public.entity_types et WHERE et.name = 'event'

UNION ALL

SELECT 
  gen_random_uuid(),
  'start_date',
  'Start Date',
  et.id,
  'DATE'::eav_data_type,
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
FROM public.entity_types et WHERE et.name = 'event'

UNION ALL

SELECT 
  gen_random_uuid(),
  'end_date',
  'End Date',
  et.id,
  'DATE'::eav_data_type,
  FALSE,
  FALSE,
  FALSE,
  TRUE,
  TRUE,
  4,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'event'

UNION ALL

SELECT 
  gen_random_uuid(),
  'location',
  'Location',
  et.id,
  'TEXT'::eav_data_type,
  FALSE,
  FALSE,
  FALSE,
  TRUE,
  TRUE,
  5,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'event'

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
  6,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'event';

-- Position attributes
INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'name',
  'Position Name',
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
FROM public.entity_types et WHERE et.name = 'position'

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
FROM public.entity_types et WHERE et.name = 'position'

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
FROM public.entity_types et WHERE et.name = 'position';

-- Business Profile attributes
INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'name',
  'Business Profile Name',
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
FROM public.entity_types et WHERE et.name = 'business_profile'

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
FROM public.entity_types et WHERE et.name = 'business_profile'

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
FROM public.entity_types et WHERE et.name = 'business_profile';

-- Title attributes
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
FROM public.entity_types et WHERE et.name = 'title';

-- Call Workflow Status attributes
INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'name',
  'Status Name',
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
FROM public.entity_types et WHERE et.name = 'call_workflow_status'

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
FROM public.entity_types et WHERE et.name = 'call_workflow_status'

UNION ALL

SELECT 
  gen_random_uuid(),
  'color',
  'Color',
  et.id,
  'TEXT'::eav_data_type,
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
FROM public.entity_types et WHERE et.name = 'call_workflow_status'

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
  4,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'call_workflow_status';

-- Step 3: Migrate existing data to EAV entities
-- Migrate companies
INSERT INTO public.eav_entities (id, entity_type_id, is_active, metadata, created_at, updated_at, deleted_at)
SELECT 
  c.id,
  et.id as entity_type_id,
  c.is_active,
  jsonb_build_object('original_table', 'companies'),
  c.created_at,
  c.updated_at,
  c.deleted_at
FROM public.companies c
CROSS JOIN public.entity_types et
WHERE et.name = 'company'
AND NOT EXISTS (SELECT 1 FROM public.eav_entities ee WHERE ee.id = c.id);

-- Migrate sources
INSERT INTO public.eav_entities (id, entity_type_id, is_active, metadata, created_at, updated_at, deleted_at)
SELECT 
  s.id,
  et.id as entity_type_id,
  s.is_active,
  jsonb_build_object('original_table', 'sources'),
  s.created_at,
  s.updated_at,
  s.deleted_at
FROM public.sources s
CROSS JOIN public.entity_types et
WHERE et.name = 'source'
AND NOT EXISTS (SELECT 1 FROM public.eav_entities ee WHERE ee.id = s.id);

-- Migrate industries
INSERT INTO public.eav_entities (id, entity_type_id, is_active, metadata, created_at, updated_at, deleted_at)
SELECT 
  i.id,
  et.id as entity_type_id,
  i.is_active,
  jsonb_build_object('original_table', 'industries'),
  i.created_at,
  i.updated_at,
  i.deleted_at
FROM public.industries i
CROSS JOIN public.entity_types et
WHERE et.name = 'industry'
AND NOT EXISTS (SELECT 1 FROM public.eav_entities ee WHERE ee.id = i.id);

-- Migrate events
INSERT INTO public.eav_entities (id, entity_type_id, is_active, metadata, created_at, updated_at, deleted_at)
SELECT 
  e.id,
  et.id as entity_type_id,
  e.is_active,
  jsonb_build_object('original_table', 'events'),
  e.created_at,
  e.updated_at,
  e.deleted_at
FROM public.events e
CROSS JOIN public.entity_types et
WHERE et.name = 'event'
AND NOT EXISTS (SELECT 1 FROM public.eav_entities ee WHERE ee.id = e.id);

-- Migrate positions
INSERT INTO public.eav_entities (id, entity_type_id, is_active, metadata, created_at, updated_at, deleted_at)
SELECT 
  p.id,
  et.id as entity_type_id,
  p.is_active,
  jsonb_build_object('original_table', 'positions'),
  p.created_at,
  p.updated_at,
  p.deleted_at
FROM public.positions p
CROSS JOIN public.entity_types et
WHERE et.name = 'position'
AND NOT EXISTS (SELECT 1 FROM public.eav_entities ee WHERE ee.id = p.id);

-- Migrate business profiles
INSERT INTO public.eav_entities (id, entity_type_id, is_active, metadata, created_at, updated_at, deleted_at)
SELECT 
  bp.id,
  et.id as entity_type_id,
  bp.is_active,
  jsonb_build_object('original_table', 'business_profiles'),
  bp.created_at,
  bp.updated_at,
  bp.deleted_at
FROM public.business_profiles bp
CROSS JOIN public.entity_types et
WHERE et.name = 'business_profile'
AND NOT EXISTS (SELECT 1 FROM public.eav_entities ee WHERE ee.id = bp.id);

-- Migrate titles
INSERT INTO public.eav_entities (id, entity_type_id, is_active, metadata, created_at, updated_at, deleted_at)
SELECT 
  t.id,
  et.id as entity_type_id,
  t.is_active,
  jsonb_build_object('original_table', 'titles'),
  t.created_at,
  t.updated_at,
  t.deleted_at
FROM public.titles t
CROSS JOIN public.entity_types et
WHERE et.name = 'title'
AND NOT EXISTS (SELECT 1 FROM public.eav_entities ee WHERE ee.id = t.id);

-- Migrate call workflow statuses
INSERT INTO public.eav_entities (id, entity_type_id, is_active, metadata, created_at, updated_at, deleted_at)
SELECT 
  cws.id,
  et.id as entity_type_id,
  cws.is_active,
  jsonb_build_object('original_table', 'call_workflow_statuses'),
  cws.created_at,
  cws.updated_at,
  cws.deleted_at
FROM public.call_workflow_statuses cws
CROSS JOIN public.entity_types et
WHERE et.name = 'call_workflow_status'
AND NOT EXISTS (SELECT 1 FROM public.eav_entities ee WHERE ee.id = cws.id);

-- Step 4: Create attribute groups for each entity type
INSERT INTO public.attribute_groups (
  id, name, display_name, description, entity_type_id, sort_order, is_collapsible, is_required
)
SELECT 
  gen_random_uuid(),
  'basic_info',
  'Basic Information',
  'Basic information fields',
  et.id,
  1,
  FALSE,
  FALSE
FROM public.entity_types et
WHERE et.name IN ('company', 'source', 'industry', 'event', 'position', 'business_profile', 'title', 'call_workflow_status')
AND NOT EXISTS (
  SELECT 1 FROM public.attribute_groups ag WHERE ag.entity_type_id = et.id AND ag.name = 'basic_info'
);

-- Step 5: Update attributes to reference the basic_info group
UPDATE public.eav_attributes 
SET attribute_group_id = (
  SELECT ag.id 
  FROM public.attribute_groups ag 
  WHERE ag.entity_type_id = eav_attributes.entity_type_id 
  AND ag.name = 'basic_info'
)
WHERE entity_type_id IN (
  SELECT id FROM public.entity_types 
  WHERE name IN ('company', 'source', 'industry', 'event', 'position', 'business_profile', 'title', 'call_workflow_status')
)
AND attribute_group_id IS NULL;

COMMIT;
