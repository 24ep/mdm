-- Migration: Add marketplace fields to report_templates
-- Date: 2024-12-21

-- Add visibility column (private, public, marketplace)
ALTER TABLE public.report_templates 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'private';

-- Add downloads counter for marketplace templates
ALTER TABLE public.report_templates 
ADD COLUMN IF NOT EXISTS downloads INTEGER DEFAULT 0;

-- Add author information for marketplace
ALTER TABLE public.report_templates 
ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);

-- Add preview image for templates
ALTER TABLE public.report_templates 
ADD COLUMN IF NOT EXISTS preview_image TEXT;

-- Add tags for better categorization
ALTER TABLE public.report_templates 
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Update CHECK constraint for source to include CUSTOM_EMBED_LINK
ALTER TABLE public.report_templates 
DROP CONSTRAINT IF EXISTS report_templates_source_check;

ALTER TABLE public.report_templates 
ADD CONSTRAINT report_templates_source_check 
CHECK (source IN ('BUILT_IN', 'BUILT_IN_VISUALIZE', 'CUSTOM_EMBED_LINK', 'POWER_BI', 'GRAFANA', 'LOOKER_STUDIO'));

-- Index for visibility
CREATE INDEX IF NOT EXISTS idx_report_templates_visibility 
ON public.report_templates(visibility) WHERE deleted_at IS NULL;

-- Index for tags
CREATE INDEX IF NOT EXISTS idx_report_templates_tags 
ON public.report_templates USING GIN(tags) WHERE deleted_at IS NULL;
