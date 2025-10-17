BEGIN;

-- Seed Data Models (idempotent)
INSERT INTO public.data_models (name, display_name, description)
SELECT 'customer', 'Customer', 'Customer master data'
WHERE NOT EXISTS (SELECT 1 FROM public.data_models WHERE name = 'customer');

-- Seed Attributes for Customer
WITH dm AS (
  SELECT id FROM public.data_models WHERE name = 'customer'
)
INSERT INTO public.data_model_attributes (data_model_id, name, display_name, type, is_required, is_unique, default_value, options, validation, "order")
SELECT dm.id, v.name, v.display_name, v.type::attribute_type, v.is_required, v.is_unique, NULL, v.options::jsonb, NULL::jsonb, v.ord
FROM dm,
LATERAL (VALUES
  ('address','Address','TEXTAREA',false,false,NULL,NULL,0),
  ('visitor_type','Visitor Type','SELECT',false,false,NULL,'{"options":["VIP","REGULAR","STAFF"]}',1),
  ('register_type','Register type','SELECT',false,false,NULL,'{"options":["ONLINE","ON_SITE"]}',2),
  ('data_owner','Importer','SELECT',false,false,NULL,'{"options":["SELF","AGENT"]}',3),
  ('visitor_status','Visitor Status','SELECT',false,false,NULL,'{"options":["ACTIVE","INACTIVE"]}',4),
  ('first_name','First name','TEXT',false,false,NULL,NULL,5),
  ('middle_name','Middle name','TEXT',false,false,NULL,NULL,6),
  ('last_name','Last name','TEXT',false,false,NULL,NULL,7),
  ('district','District','TEXT',false,false,NULL,NULL,8),
  ('subdistrict','Sub-District','TEXT',false,false,NULL,NULL,9),
  ('province','Province','TEXT',false,false,NULL,NULL,10),
  ('zip_code','Zip code','TEXT',false,false,NULL,NULL,11),
  ('country','Country','TEXT',false,false,NULL,NULL,12),
  ('country_code','Country Code','TEXT',false,false,NULL,NULL,13),
  ('province_area_code','Province Area Code','TEXT',false,false,NULL,NULL,14),
  ('visitor_consent','Visitor consent','SELECT',false,false,NULL,'{"options":["YES","NO"]}',15),
  ('record_status','Record Status','SELECT',false,false,NULL,'{"options":["ACTIVE","ARCHIVED","PURGED"]}',16),
  ('createdAt','Created at','DATE',false,false,NULL,NULL,20),
  ('createdBy','Created by','TEXT',false,false,NULL,NULL,21),
  ('updatedAt','Last updated at','DATE',false,false,NULL,NULL,22),
  ('updatedBy','Last updated by','TEXT',false,false,NULL,NULL,23),
  ('line_id','Line ID','TEXT',false,false,NULL,NULL,24),
  ('customer_id','Customer ID','TEXT',false,true,NULL,'{"auto":true}',25)
) AS v(name, display_name, type, is_required, is_unique, default_value, options, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM public.data_model_attributes a 
  WHERE a.data_model_id = (SELECT id FROM dm) AND a.name = v.name
);

COMMIT;


