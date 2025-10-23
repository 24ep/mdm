-- Create simple example data for EAV system
BEGIN;

-- Create customer entity type
INSERT INTO public.entity_types (
  id, name, display_name, description, is_active, sort_order, 
  metadata, created_at, updated_at, deleted_at
)
SELECT 
  gen_random_uuid(),
  'customer',
  'Customer',
  'Customer information and details',
  TRUE,
  10,
  jsonb_build_object('icon', 'user', 'color', 'blue', 'category', 'business'),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
WHERE NOT EXISTS (SELECT 1 FROM public.entity_types WHERE name = 'customer');

-- Create product entity type
INSERT INTO public.entity_types (
  id, name, display_name, description, is_active, sort_order, 
  metadata, created_at, updated_at, deleted_at
)
SELECT 
  gen_random_uuid(),
  'product',
  'Product',
  'Product catalog items',
  TRUE,
  11,
  jsonb_build_object('icon', 'package', 'color', 'green', 'category', 'inventory'),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
WHERE NOT EXISTS (SELECT 1 FROM public.entity_types WHERE name = 'product');

-- Create order entity type
INSERT INTO public.entity_types (
  id, name, display_name, description, is_active, sort_order, 
  metadata, created_at, updated_at, deleted_at
)
SELECT 
  gen_random_uuid(),
  'order',
  'Order',
  'Customer orders and transactions',
  TRUE,
  12,
  jsonb_build_object('icon', 'shopping-cart', 'color', 'purple', 'category', 'sales'),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
WHERE NOT EXISTS (SELECT 1 FROM public.entity_types WHERE name = 'order');

-- Create customer attributes
INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'first_name',
  'First Name',
  et.id,
  'TEXT'::eav_data_type,
  TRUE, FALSE, TRUE, TRUE, TRUE,
  1, TRUE, TRUE, TRUE,
  NOW(), NOW()
FROM public.entity_types et WHERE et.name = 'customer'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'first_name');

INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'last_name',
  'Last Name',
  et.id,
  'TEXT'::eav_data_type,
  TRUE, FALSE, TRUE, TRUE, TRUE,
  2, TRUE, TRUE, TRUE,
  NOW(), NOW()
FROM public.entity_types et WHERE et.name = 'customer'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'last_name');

INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'email',
  'Email Address',
  et.id,
  'EMAIL'::eav_data_type,
  TRUE, TRUE, TRUE, TRUE, TRUE,
  3, TRUE, TRUE, TRUE,
  NOW(), NOW()
FROM public.entity_types et WHERE et.name = 'customer'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'email');

INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'phone',
  'Phone Number',
  et.id,
  'PHONE'::eav_data_type,
  FALSE, FALSE, FALSE, TRUE, TRUE,
  4, TRUE, TRUE, TRUE,
  NOW(), NOW()
FROM public.entity_types et WHERE et.name = 'customer'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'phone');

INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'is_vip',
  'VIP Customer',
  et.id,
  'BOOLEAN'::eav_data_type,
  FALSE, FALSE, FALSE, TRUE, TRUE,
  5, TRUE, TRUE, TRUE,
  NOW(), NOW()
FROM public.entity_types et WHERE et.name = 'customer'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'is_vip');

-- Create product attributes
INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'name',
  'Product Name',
  et.id,
  'TEXT'::eav_data_type,
  TRUE, TRUE, TRUE, TRUE, TRUE,
  1, TRUE, TRUE, TRUE,
  NOW(), NOW()
FROM public.entity_types et WHERE et.name = 'product'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'name');

INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'price',
  'Price',
  et.id,
  'CURRENCY'::eav_data_type,
  TRUE, FALSE, FALSE, FALSE, TRUE,
  2, TRUE, TRUE, TRUE,
  NOW(), NOW()
FROM public.entity_types et WHERE et.name = 'product'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'price');

INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'category',
  'Category',
  et.id,
  'TEXT'::eav_data_type,
  TRUE, FALSE, TRUE, TRUE, TRUE,
  3, TRUE, TRUE, TRUE,
  NOW(), NOW()
FROM public.entity_types et WHERE et.name = 'product'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'category');

INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'in_stock',
  'In Stock',
  et.id,
  'BOOLEAN'::eav_data_type,
  FALSE, FALSE, FALSE, TRUE, TRUE,
  4, TRUE, TRUE, TRUE,
  NOW(), NOW()
FROM public.entity_types et WHERE et.name = 'product'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'in_stock');

-- Create order attributes
INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'order_number',
  'Order Number',
  et.id,
  'TEXT'::eav_data_type,
  TRUE, TRUE, TRUE, TRUE, TRUE,
  1, TRUE, TRUE, TRUE,
  NOW(), NOW()
FROM public.entity_types et WHERE et.name = 'order'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'order_number');

INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'order_date',
  'Order Date',
  et.id,
  'DATE'::eav_data_type,
  TRUE, FALSE, TRUE, FALSE, TRUE,
  2, TRUE, TRUE, TRUE,
  NOW(), NOW()
FROM public.entity_types et WHERE et.name = 'order'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'order_date');

INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'total_amount',
  'Total Amount',
  et.id,
  'CURRENCY'::eav_data_type,
  TRUE, FALSE, FALSE, FALSE, TRUE,
  3, TRUE, TRUE, TRUE,
  NOW(), NOW()
FROM public.entity_types et WHERE et.name = 'order'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'total_amount');

INSERT INTO public.eav_attributes (
  id, name, display_name, entity_type_id, data_type,
  is_required, is_unique, is_indexed, is_searchable, is_auditable,
  sort_order, is_visible, is_editable, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'status',
  'Order Status',
  et.id,
  'SELECT'::eav_data_type,
  TRUE, FALSE, TRUE, TRUE, TRUE,
  4, TRUE, TRUE, TRUE,
  NOW(), NOW()
FROM public.entity_types et WHERE et.name = 'order'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'status');

-- Create sample entities
INSERT INTO public.eav_entities (id, entity_type_id, is_active, metadata, created_at, updated_at, deleted_at)
SELECT 
  gen_random_uuid(),
  et.id,
  TRUE,
  jsonb_build_object('source', 'example_data', 'name', 'John Doe'),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
FROM public.entity_types et WHERE et.name = 'customer'
AND NOT EXISTS (SELECT 1 FROM public.eav_entities ee WHERE ee.metadata->>'source' = 'example_data' AND ee.entity_type_id = et.id);

INSERT INTO public.eav_entities (id, entity_type_id, is_active, metadata, created_at, updated_at, deleted_at)
SELECT 
  gen_random_uuid(),
  et.id,
  TRUE,
  jsonb_build_object('source', 'example_data', 'name', 'Laptop Pro 15"'),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
FROM public.entity_types et WHERE et.name = 'product'
AND NOT EXISTS (SELECT 1 FROM public.eav_entities ee WHERE ee.metadata->>'source' = 'example_data' AND ee.entity_type_id = et.id);

INSERT INTO public.eav_entities (id, entity_type_id, is_active, metadata, created_at, updated_at, deleted_at)
SELECT 
  gen_random_uuid(),
  et.id,
  TRUE,
  jsonb_build_object('source', 'example_data', 'name', 'ORD-001'),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
FROM public.entity_types et WHERE et.name = 'order'
AND NOT EXISTS (SELECT 1 FROM public.eav_entities ee WHERE ee.metadata->>'source' = 'example_data' AND ee.entity_type_id = et.id);

-- Create sample values for customer
INSERT INTO public.eav_values (id, entity_id, attribute_id, text_value, number_value, boolean_value, date_value, datetime_value, json_value, blob_value, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  'John',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.eav_entities ee
JOIN public.entity_types et ON et.id = ee.entity_type_id
JOIN public.eav_attributes ea ON ea.entity_type_id = et.id
WHERE et.name = 'customer' AND ea.name = 'first_name' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id);

INSERT INTO public.eav_values (id, entity_id, attribute_id, text_value, number_value, boolean_value, date_value, datetime_value, json_value, blob_value, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  'Doe',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.eav_entities ee
JOIN public.entity_types et ON et.id = ee.entity_type_id
JOIN public.eav_attributes ea ON ea.entity_type_id = et.id
WHERE et.name = 'customer' AND ea.name = 'last_name' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id);

INSERT INTO public.eav_values (id, entity_id, attribute_id, text_value, number_value, boolean_value, date_value, datetime_value, json_value, blob_value, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  'john.doe@example.com',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.eav_entities ee
JOIN public.entity_types et ON et.id = ee.entity_type_id
JOIN public.eav_attributes ea ON ea.entity_type_id = et.id
WHERE et.name = 'customer' AND ea.name = 'email' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id);

INSERT INTO public.eav_values (id, entity_id, attribute_id, text_value, number_value, boolean_value, date_value, datetime_value, json_value, blob_value, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  '+1-555-0123',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.eav_entities ee
JOIN public.entity_types et ON et.id = ee.entity_type_id
JOIN public.eav_attributes ea ON ea.entity_type_id = et.id
WHERE et.name = 'customer' AND ea.name = 'phone' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id);

INSERT INTO public.eav_values (id, entity_id, attribute_id, text_value, number_value, boolean_value, date_value, datetime_value, json_value, blob_value, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  NULL,
  NULL,
  TRUE,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.eav_entities ee
JOIN public.entity_types et ON et.id = ee.entity_type_id
JOIN public.eav_attributes ea ON ea.entity_type_id = et.id
WHERE et.name = 'customer' AND ea.name = 'is_vip' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id);

-- Create sample values for product
INSERT INTO public.eav_values (id, entity_id, attribute_id, text_value, number_value, boolean_value, date_value, datetime_value, json_value, blob_value, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  'Laptop Pro 15"',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.eav_entities ee
JOIN public.entity_types et ON et.id = ee.entity_type_id
JOIN public.eav_attributes ea ON ea.entity_type_id = et.id
WHERE et.name = 'product' AND ea.name = 'name' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id);

INSERT INTO public.eav_values (id, entity_id, attribute_id, text_value, number_value, boolean_value, date_value, datetime_value, json_value, blob_value, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  NULL,
  1299.99,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.eav_entities ee
JOIN public.entity_types et ON et.id = ee.entity_type_id
JOIN public.eav_attributes ea ON ea.entity_type_id = et.id
WHERE et.name = 'product' AND ea.name = 'price' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id);

INSERT INTO public.eav_values (id, entity_id, attribute_id, text_value, number_value, boolean_value, date_value, datetime_value, json_value, blob_value, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  'Electronics',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.eav_entities ee
JOIN public.entity_types et ON et.id = ee.entity_type_id
JOIN public.eav_attributes ea ON ea.entity_type_id = et.id
WHERE et.name = 'product' AND ea.name = 'category' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id);

INSERT INTO public.eav_values (id, entity_id, attribute_id, text_value, number_value, boolean_value, date_value, datetime_value, json_value, blob_value, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  NULL,
  NULL,
  TRUE,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.eav_entities ee
JOIN public.entity_types et ON et.id = ee.entity_type_id
JOIN public.eav_attributes ea ON ea.entity_type_id = et.id
WHERE et.name = 'product' AND ea.name = 'in_stock' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id);

-- Create sample values for order
INSERT INTO public.eav_values (id, entity_id, attribute_id, text_value, number_value, boolean_value, date_value, datetime_value, json_value, blob_value, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  'ORD-001',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.eav_entities ee
JOIN public.entity_types et ON et.id = ee.entity_type_id
JOIN public.eav_attributes ea ON ea.entity_type_id = et.id
WHERE et.name = 'order' AND ea.name = 'order_number' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id);

INSERT INTO public.eav_values (id, entity_id, attribute_id, text_value, number_value, boolean_value, date_value, datetime_value, json_value, blob_value, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  NULL,
  NULL,
  NULL,
  '2024-01-15'::DATE,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.eav_entities ee
JOIN public.entity_types et ON et.id = ee.entity_type_id
JOIN public.eav_attributes ea ON ea.entity_type_id = et.id
WHERE et.name = 'order' AND ea.name = 'order_date' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id);

INSERT INTO public.eav_values (id, entity_id, attribute_id, text_value, number_value, boolean_value, date_value, datetime_value, json_value, blob_value, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  NULL,
  1329.98,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.eav_entities ee
JOIN public.entity_types et ON et.id = ee.entity_type_id
JOIN public.eav_attributes ea ON ea.entity_type_id = et.id
WHERE et.name = 'order' AND ea.name = 'total_amount' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id);

INSERT INTO public.eav_values (id, entity_id, attribute_id, text_value, number_value, boolean_value, date_value, datetime_value, json_value, blob_value, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  'completed',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.eav_entities ee
JOIN public.entity_types et ON et.id = ee.entity_type_id
JOIN public.eav_attributes ea ON ea.entity_type_id = et.id
WHERE et.name = 'order' AND ea.name = 'status' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id);

COMMIT;
