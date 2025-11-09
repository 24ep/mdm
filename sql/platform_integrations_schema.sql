-- Platform Integrations Table
-- This table stores platform-level integration configurations (not report-specific)

CREATE TABLE IF NOT EXISTS public.platform_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'error')),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_integrations_type ON public.platform_integrations(type);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_status ON public.platform_integrations(status);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_created_by ON public.platform_integrations(created_by);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_deleted_at ON public.platform_integrations(deleted_at) WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON TABLE public.platform_integrations IS 'Platform-level integration configurations for external services';
COMMENT ON COLUMN public.platform_integrations.type IS 'Integration type (e.g., power-bi, grafana, looker-studio, slack, etc.)';
COMMENT ON COLUMN public.platform_integrations.config IS 'JSON configuration for the integration';
COMMENT ON COLUMN public.platform_integrations.status IS 'Integration status: pending, active, inactive, or error';

