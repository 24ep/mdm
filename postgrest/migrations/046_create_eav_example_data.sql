-- Create example data for EAV system
-- This migration populates the EAV system with sample data for testing and demonstration

BEGIN;

-- Step 1: Create additional entity types for examples
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
  jsonb_build_object(
    'icon', 'user',
    'color', 'blue',
    'category', 'business'
  ),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
WHERE NOT EXISTS (SELECT 1 FROM public.entity_types WHERE name = 'customer')

UNION ALL

SELECT 
  gen_random_uuid(),
  'product',
  'Product',
  'Product catalog items',
  TRUE,
  11,
  jsonb_build_object(
    'icon', 'package',
    'color', 'green',
    'category', 'inventory'
  ),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
WHERE NOT EXISTS (SELECT 1 FROM public.entity_types WHERE name = 'product')

UNION ALL

SELECT 
  gen_random_uuid(),
  'order',
  'Order',
  'Customer orders and transactions',
  TRUE,
  12,
  jsonb_build_object(
    'icon', 'shopping-cart',
    'color', 'purple',
    'category', 'sales'
  ),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
WHERE NOT EXISTS (SELECT 1 FROM public.entity_types WHERE name = 'order');

-- Step 2: Create attributes for customer entity type
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
  TRUE,
  FALSE,
  TRUE,
  TRUE,
  TRUE,
  1,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'customer'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'first_name')

UNION ALL

SELECT 
  gen_random_uuid(),
  'last_name',
  'Last Name',
  et.id,
  'TEXT'::eav_data_type,
  TRUE,
  FALSE,
  TRUE,
  TRUE,
  TRUE,
  2,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'customer'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'last_name')

UNION ALL

SELECT 
  gen_random_uuid(),
  'email',
  'Email Address',
  et.id,
  'TEXT'::eav_data_type,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  3,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'customer'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'email')

UNION ALL

SELECT 
  gen_random_uuid(),
  'phone',
  'Phone Number',
  et.id,
  'TEXT'::eav_data_type,
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
FROM public.entity_types et WHERE et.name = 'customer'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'phone')

UNION ALL

SELECT 
  gen_random_uuid(),
  'date_of_birth',
  'Date of Birth',
  et.id,
  'DATE'::eav_data_type,
  FALSE,
  FALSE,
  FALSE,
  FALSE,
  TRUE,
  5,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'customer'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'date_of_birth')

UNION ALL

SELECT 
  gen_random_uuid(),
  'is_vip',
  'VIP Customer',
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
FROM public.entity_types et WHERE et.name = 'customer'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'is_vip')

UNION ALL

SELECT 
  gen_random_uuid(),
  'credit_limit',
  'Credit Limit',
  et.id,
  'NUMBER'::eav_data_type,
  FALSE,
  FALSE,
  FALSE,
  FALSE,
  TRUE,
  7,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'customer'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'credit_limit');

-- Step 3: Create attributes for product entity type
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
FROM public.entity_types et WHERE et.name = 'product'
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
FROM public.entity_types et WHERE et.name = 'product'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'description')

UNION ALL

SELECT 
  gen_random_uuid(),
  'price',
  'Price',
  et.id,
  'NUMBER'::eav_data_type,
  TRUE,
  FALSE,
  FALSE,
  FALSE,
  TRUE,
  3,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'product'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'price')

UNION ALL

SELECT 
  gen_random_uuid(),
  'category',
  'Category',
  et.id,
  'TEXT'::eav_data_type,
  TRUE,
  FALSE,
  TRUE,
  TRUE,
  TRUE,
  4,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'product'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'category')

UNION ALL

SELECT 
  gen_random_uuid(),
  'in_stock',
  'In Stock',
  et.id,
  'BOOLEAN'::eav_data_type,
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
FROM public.entity_types et WHERE et.name = 'product'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'in_stock')

UNION ALL

SELECT 
  gen_random_uuid(),
  'stock_quantity',
  'Stock Quantity',
  et.id,
  'NUMBER'::eav_data_type,
  FALSE,
  FALSE,
  FALSE,
  FALSE,
  TRUE,
  6,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'product'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'stock_quantity');

-- Step 4: Create attributes for order entity type
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
FROM public.entity_types et WHERE et.name = 'order'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'order_number')

UNION ALL

SELECT 
  gen_random_uuid(),
  'order_date',
  'Order Date',
  et.id,
  'DATE'::eav_data_type,
  TRUE,
  FALSE,
  TRUE,
  FALSE,
  TRUE,
  2,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'order'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'order_date')

UNION ALL

SELECT 
  gen_random_uuid(),
  'total_amount',
  'Total Amount',
  et.id,
  'NUMBER'::eav_data_type,
  TRUE,
  FALSE,
  FALSE,
  FALSE,
  TRUE,
  3,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'order'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'total_amount')

UNION ALL

SELECT 
  gen_random_uuid(),
  'status',
  'Order Status',
  et.id,
  'TEXT'::eav_data_type,
  TRUE,
  FALSE,
  TRUE,
  TRUE,
  TRUE,
  4,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM public.entity_types et WHERE et.name = 'order'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'status')

UNION ALL

SELECT 
  gen_random_uuid(),
  'shipping_address',
  'Shipping Address',
  et.id,
  'TEXTAREA'::eav_data_type,
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
FROM public.entity_types et WHERE et.name = 'order'
AND NOT EXISTS (SELECT 1 FROM public.eav_attributes ea WHERE ea.entity_type_id = et.id AND ea.name = 'shipping_address');

-- Step 5: Create sample entities and values
-- Create sample customers
INSERT INTO public.eav_entities (id, entity_type_id, is_active, metadata, created_at, updated_at, deleted_at)
SELECT 
  gen_random_uuid(),
  et.id,
  TRUE,
  jsonb_build_object('source', 'example_data'),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
FROM public.entity_types et WHERE et.name = 'customer'
AND NOT EXISTS (SELECT 1 FROM public.eav_entities ee WHERE ee.metadata->>'source' = 'example_data' AND ee.entity_type_id = et.id);

-- Create sample products
INSERT INTO public.eav_entities (id, entity_type_id, is_active, metadata, created_at, updated_at, deleted_at)
SELECT 
  gen_random_uuid(),
  et.id,
  TRUE,
  jsonb_build_object('source', 'example_data'),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
FROM public.entity_types et WHERE et.name = 'product'
AND NOT EXISTS (SELECT 1 FROM public.eav_entities ee WHERE ee.metadata->>'source' = 'example_data' AND ee.entity_type_id = et.id);

-- Create sample orders
INSERT INTO public.eav_entities (id, entity_type_id, is_active, metadata, created_at, updated_at, deleted_at)
SELECT 
  gen_random_uuid(),
  et.id,
  TRUE,
  jsonb_build_object('source', 'example_data'),
  NOW(),
  NOW(),
  NULL::TIMESTAMPTZ
FROM public.entity_types et WHERE et.name = 'order'
AND NOT EXISTS (SELECT 1 FROM public.eav_entities ee WHERE ee.metadata->>'source' = 'example_data' AND ee.entity_type_id = et.id);

-- Step 6: Create sample values for customers
INSERT INTO public.eav_values (
  id, entity_id, attribute_id, text_value, number_value, boolean_value, 
  date_value, datetime_value, json_value, blob_value, created_at, updated_at
)
-- Customer 1: John Doe
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
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id)

UNION ALL

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
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id)

UNION ALL

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
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id)

UNION ALL

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
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id)

UNION ALL

SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  NULL,
  NULL,
  TRUE,
  '1985-03-15'::DATE,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM public.eav_entities ee
JOIN public.entity_types et ON et.id = ee.entity_type_id
JOIN public.eav_attributes ea ON ea.entity_type_id = et.id
WHERE et.name = 'customer' AND ea.name = 'date_of_birth' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id)

UNION ALL

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
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id)

UNION ALL

SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  NULL,
  10000.00,
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
WHERE et.name = 'customer' AND ea.name = 'credit_limit' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id);

-- Step 7: Create sample values for products
INSERT INTO public.eav_values (
  id, entity_id, attribute_id, text_value, number_value, boolean_value, 
  date_value, datetime_value, json_value, blob_value, created_at, updated_at
)
-- Product 1: Laptop Pro 15"
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
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id)

UNION ALL

SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  'High-performance laptop with 16GB RAM and 512GB SSD',
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
WHERE et.name = 'product' AND ea.name = 'description' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id)

UNION ALL

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
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id)

UNION ALL

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
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id)

UNION ALL

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
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id)

UNION ALL

SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  NULL,
  25,
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
WHERE et.name = 'product' AND ea.name = 'stock_quantity' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id);

-- Step 8: Create sample values for orders
INSERT INTO public.eav_values (
  id, entity_id, attribute_id, text_value, number_value, boolean_value, 
  date_value, datetime_value, json_value, blob_value, created_at, updated_at
)
-- Order 1: ORD-001
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
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id)

UNION ALL

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
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id)

UNION ALL

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
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id)

UNION ALL

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
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id)

UNION ALL

SELECT 
  gen_random_uuid(),
  ee.id,
  ea.id,
  '123 Main St, Anytown, USA 12345',
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
WHERE et.name = 'order' AND ea.name = 'shipping_address' AND ee.metadata->>'source' = 'example_data'
AND NOT EXISTS (SELECT 1 FROM public.eav_values ev WHERE ev.entity_id = ee.id AND ev.attribute_id = ea.id);

COMMIT;
