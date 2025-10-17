BEGIN;

-- Seed sample data for Customer data model
-- This creates example customer records with all attribute values

-- Get the customer data model ID
WITH customer_model AS (
  SELECT id FROM public.data_models WHERE name = 'customer'
),
-- Get all attribute IDs for the customer model
customer_attributes AS (
  SELECT 
    dma.id as attribute_id,
    dma.name as attribute_name
  FROM public.data_model_attributes dma
  JOIN customer_model cm ON dma.data_model_id = cm.id
),
-- Create sample data records
sample_records AS (
  INSERT INTO public.data_records (data_model_id, is_active)
  SELECT cm.id, true
  FROM customer_model cm
  CROSS JOIN generate_series(1, 10) as record_num
  RETURNING id, data_model_id
),
-- Create sample attribute values for each record
sample_values AS (
  INSERT INTO public.data_record_values (data_record_id, attribute_id, value)
  SELECT 
    sr.id,
    ca.attribute_id,
    CASE ca.attribute_name
      -- Address
      WHEN 'address' THEN 
        CASE (sr.id % 5)
          WHEN 0 THEN '123 Main Street, Downtown District'
          WHEN 1 THEN '456 Oak Avenue, Business Quarter'
          WHEN 2 THEN '789 Pine Road, Residential Area'
          WHEN 3 THEN '321 Elm Street, City Center'
          ELSE '654 Maple Lane, Suburban District'
        END
      
      -- Visitor Type
      WHEN 'visitor_type' THEN 
        CASE (sr.id % 3)
          WHEN 0 THEN 'VIP'
          WHEN 1 THEN 'REGULAR'
          ELSE 'STAFF'
        END
      
      -- Register Type
      WHEN 'register_type' THEN 
        CASE (sr.id % 2)
          WHEN 0 THEN 'ONLINE'
          ELSE 'ON_SITE'
        END
      
      -- Data Owner
      WHEN 'data_owner' THEN 
        CASE (sr.id % 2)
          WHEN 0 THEN 'SELF'
          ELSE 'AGENT'
        END
      
      -- Visitor Status
      WHEN 'visitor_status' THEN 
        CASE (sr.id % 4)
          WHEN 0 THEN 'ACTIVE'
          WHEN 1 THEN 'ACTIVE'
          WHEN 2 THEN 'INACTIVE'
          ELSE 'ACTIVE'
        END
      
      -- First Name
      WHEN 'first_name' THEN 
        CASE (sr.id % 10)
          WHEN 0 THEN 'John'
          WHEN 1 THEN 'Sarah'
          WHEN 2 THEN 'Michael'
          WHEN 3 THEN 'Emily'
          WHEN 4 THEN 'David'
          WHEN 5 THEN 'Lisa'
          WHEN 6 THEN 'Robert'
          WHEN 7 THEN 'Jennifer'
          WHEN 8 THEN 'William'
          ELSE 'Maria'
        END
      
      -- Middle Name
      WHEN 'middle_name' THEN 
        CASE (sr.id % 5)
          WHEN 0 THEN 'James'
          WHEN 1 THEN 'Anne'
          WHEN 2 THEN 'Lee'
          WHEN 3 THEN 'Rose'
          ELSE 'Paul'
        END
      
      -- Last Name
      WHEN 'last_name' THEN 
        CASE (sr.id % 8)
          WHEN 0 THEN 'Smith'
          WHEN 1 THEN 'Johnson'
          WHEN 2 THEN 'Williams'
          WHEN 3 THEN 'Brown'
          WHEN 4 THEN 'Jones'
          WHEN 5 THEN 'Garcia'
          WHEN 6 THEN 'Miller'
          ELSE 'Davis'
        END
      
      -- District
      WHEN 'district' THEN 
        CASE (sr.id % 4)
          WHEN 0 THEN 'Central District'
          WHEN 1 THEN 'North District'
          WHEN 2 THEN 'South District'
          ELSE 'East District'
        END
      
      -- Sub-District
      WHEN 'subdistrict' THEN 
        CASE (sr.id % 6)
          WHEN 0 THEN 'Downtown'
          WHEN 1 THEN 'Midtown'
          WHEN 2 THEN 'Uptown'
          WHEN 3 THEN 'Westside'
          WHEN 4 THEN 'Eastside'
          ELSE 'Northside'
        END
      
      -- Province
      WHEN 'province' THEN 
        CASE (sr.id % 3)
          WHEN 0 THEN 'California'
          WHEN 1 THEN 'New York'
          ELSE 'Texas'
        END
      
      -- Zip Code
      WHEN 'zip_code' THEN 
        CASE (sr.id % 5)
          WHEN 0 THEN '90210'
          WHEN 1 THEN '10001'
          WHEN 2 THEN '77001'
          WHEN 3 THEN '94102'
          ELSE '60601'
        END
      
      -- Country
      WHEN 'country' THEN 'United States'
      
      -- Country Code
      WHEN 'country_code' THEN 'US'
      
      -- Province Area Code
      WHEN 'province_area_code' THEN 
        CASE (sr.id % 3)
          WHEN 0 THEN '213'
          WHEN 1 THEN '212'
          ELSE '713'
        END
      
      -- Visitor Consent
      WHEN 'visitor_consent' THEN 
        CASE (sr.id % 3)
          WHEN 0 THEN 'YES'
          WHEN 1 THEN 'YES'
          ELSE 'NO'
        END
      
      -- Record Status
      WHEN 'record_status' THEN 
        CASE (sr.id % 4)
          WHEN 0 THEN 'ACTIVE'
          WHEN 1 THEN 'ACTIVE'
          WHEN 2 THEN 'ARCHIVED'
          ELSE 'ACTIVE'
        END
      
      -- Created At
      WHEN 'createdAt' THEN 
        (CURRENT_DATE - INTERVAL '1 day' * (sr.id % 30))::text
      
      -- Created By
      WHEN 'createdBy' THEN 
        CASE (sr.id % 3)
          WHEN 0 THEN 'admin@company.com'
          WHEN 1 THEN 'manager@company.com'
          ELSE 'staff@company.com'
        END
      
      -- Updated At
      WHEN 'updatedAt' THEN 
        (CURRENT_DATE - INTERVAL '1 hour' * (sr.id % 24))::text
      
      -- Updated By
      WHEN 'updatedBy' THEN 
        CASE (sr.id % 2)
          WHEN 0 THEN 'admin@company.com'
          ELSE 'system@company.com'
        END
      
      -- Line ID
      WHEN 'line_id' THEN 'LINE_' || LPAD(sr.id::text, 6, '0')
      
      -- Customer ID
      WHEN 'customer_id' THEN 'CUST_' || LPAD(sr.id::text, 6, '0')
      
      ELSE NULL
    END
  FROM sample_records sr
  CROSS JOIN customer_attributes ca
  WHERE ca.attribute_name IN (
    'address', 'visitor_type', 'register_type', 'data_owner', 'visitor_status',
    'first_name', 'middle_name', 'last_name', 'district', 'subdistrict',
    'province', 'zip_code', 'country', 'country_code', 'province_area_code',
    'visitor_consent', 'record_status', 'createdAt', 'createdBy', 'updatedAt',
    'updatedBy', 'line_id', 'customer_id'
  )
  RETURNING data_record_id, attribute_id, value
)
SELECT 'Sample customer data created successfully' as result;

COMMIT;
