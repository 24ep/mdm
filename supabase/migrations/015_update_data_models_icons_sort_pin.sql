-- Update data models with icons, sort order, and pin status
-- This migration updates existing data models with appropriate icons and organization

-- Update Customer data model (most important - pin and sort first)
UPDATE public.data_models 
SET 
  icon = 'Users',
  sort_order = 1,
  is_pinned = true
WHERE name = 'customer' OR lower(display_name) = 'customer';

-- Update Company data model (second most important)
UPDATE public.data_models 
SET 
  icon = 'Building2',
  sort_order = 2,
  is_pinned = true
WHERE name = 'company' OR lower(display_name) = 'company';

-- Update Event data model (third most important)
UPDATE public.data_models 
SET 
  icon = 'Calendar',
  sort_order = 3,
  is_pinned = true
WHERE name = 'event' OR lower(display_name) = 'event';

-- Update Business Profile data model
UPDATE public.data_models 
SET 
  icon = 'UserCheck',
  sort_order = 4,
  is_pinned = true
WHERE name = 'business_profile' OR lower(display_name) = 'business profile';

-- Update Position data model
UPDATE public.data_models 
SET 
  icon = 'Briefcase',
  sort_order = 5,
  is_pinned = true
WHERE name = 'position' OR lower(display_name) = 'position';

-- Update Industry Categories data model
UPDATE public.data_models 
SET 
  icon = 'GitBranch',
  sort_order = 6,
  is_pinned = true
WHERE name = 'industry_categories' OR lower(display_name) = 'industry categories';

-- Update Source data model
UPDATE public.data_models 
SET 
  icon = 'FolderTree',
  sort_order = 7,
  is_pinned = true
WHERE name = 'source' OR lower(display_name) = 'source';

-- Update Title Name data model
UPDATE public.data_models 
SET 
  icon = 'FileText',
  sort_order = 8,
  is_pinned = true
WHERE name = 'title_name' OR lower(display_name) = 'title name';

-- Update Call Workflow Status data model
UPDATE public.data_models 
SET 
  icon = 'Settings',
  sort_order = 9,
  is_pinned = true
WHERE name = 'call_workflow_status' OR lower(display_name) = 'call workflow status';

-- Verify the updates
SELECT 
  name,
  display_name,
  icon,
  sort_order,
  is_pinned,
  is_active
FROM public.data_models 
WHERE deleted_at IS NULL
ORDER BY sort_order ASC, created_at DESC;
