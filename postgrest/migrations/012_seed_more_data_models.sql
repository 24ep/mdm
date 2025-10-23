BEGIN;

-- Seed additional Data Models (idempotent)
INSERT INTO public.data_models (name, display_name, description)
SELECT 'company', 'Company', 'Company master data'
WHERE NOT EXISTS (SELECT 1 FROM public.data_models WHERE name = 'company');

INSERT INTO public.data_models (name, display_name, description)
SELECT 'source', 'Source', 'Source master data'
WHERE NOT EXISTS (SELECT 1 FROM public.data_models WHERE name = 'source');

INSERT INTO public.data_models (name, display_name, description)
SELECT 'industry_category', 'Industry Categories', 'Industry categories master data'
WHERE NOT EXISTS (SELECT 1 FROM public.data_models WHERE name = 'industry_category');

INSERT INTO public.data_models (name, display_name, description)
SELECT 'event', 'Event', 'Event master data'
WHERE NOT EXISTS (SELECT 1 FROM public.data_models WHERE name = 'event');

INSERT INTO public.data_models (name, display_name, description)
SELECT 'position', 'Position', 'Position master data'
WHERE NOT EXISTS (SELECT 1 FROM public.data_models WHERE name = 'position');

INSERT INTO public.data_models (name, display_name, description)
SELECT 'business_profile', 'Business Profile', 'Business profile master data'
WHERE NOT EXISTS (SELECT 1 FROM public.data_models WHERE name = 'business_profile');

INSERT INTO public.data_models (name, display_name, description)
SELECT 'title_name', 'Title Name', 'Title name master data'
WHERE NOT EXISTS (SELECT 1 FROM public.data_models WHERE name = 'title_name');

INSERT INTO public.data_models (name, display_name, description)
SELECT 'call_workflow_status', 'Call Workflow Status', 'Call workflow status master data'
WHERE NOT EXISTS (SELECT 1 FROM public.data_models WHERE name = 'call_workflow_status');

COMMIT;


