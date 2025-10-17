-- Dashboard System Migration
-- This migration creates the complete dashboard system with builder capabilities

BEGIN;

-- Dashboard types
DO $$ BEGIN
  CREATE TYPE dashboard_type AS ENUM ('CUSTOM', 'TEMPLATE', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE dashboard_visibility AS ENUM ('PRIVATE', 'PUBLIC', 'SHARED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE element_type AS ENUM ('CHART', 'TABLE', 'KPI', 'TEXT', 'IMAGE', 'FILTER', 'MAP', 'GAUGE', 'HEATMAP', 'TREEMAP', 'SCATTER', 'LINE', 'BAR', 'PIE', 'DONUT', 'AREA', 'FUNNEL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE chart_type AS ENUM ('LINE', 'BAR', 'PIE', 'DONUT', 'AREA', 'SCATTER', 'GAUGE', 'HEATMAP', 'TREEMAP', 'FUNNEL', 'TABLE', 'KPI');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Main dashboards table
CREATE TABLE IF NOT EXISTS public.dashboards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type dashboard_type DEFAULT 'CUSTOM',
  visibility dashboard_visibility DEFAULT 'PRIVATE',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  refresh_rate INTEGER DEFAULT 300, -- seconds, 0 for real-time
  is_realtime BOOLEAN DEFAULT false,
  public_link TEXT UNIQUE, -- for public dashboards
  background_color TEXT DEFAULT '#ffffff',
  background_image TEXT,
  font_family TEXT DEFAULT 'Inter',
  font_size INTEGER DEFAULT 14,
  grid_size INTEGER DEFAULT 12, -- for grid layout
  layout_config JSONB DEFAULT '{}', -- layout configuration
  style_config JSONB DEFAULT '{}', -- global style configuration
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Dashboard spaces association (many-to-many)
CREATE TABLE IF NOT EXISTS public.dashboard_spaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dashboard_id UUID REFERENCES public.dashboards(id) ON DELETE CASCADE,
  space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dashboard_id, space_id)
);

-- Dashboard permissions
CREATE TABLE IF NOT EXISTS public.dashboard_permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dashboard_id UUID REFERENCES public.dashboards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'VIEWER', 'EDITOR', 'ADMIN'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dashboard_id, user_id)
);

-- Dashboard elements (charts, tables, text, etc.)
CREATE TABLE IF NOT EXISTS public.dashboard_elements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dashboard_id UUID REFERENCES public.dashboards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type element_type NOT NULL,
  chart_type chart_type,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 4,
  height INTEGER DEFAULT 3,
  z_index INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}', -- element-specific configuration
  style JSONB DEFAULT '{}', -- element styling
  data_config JSONB DEFAULT '{}', -- data source and query configuration
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard datasources (connections to data models, assignments, etc.)
CREATE TABLE IF NOT EXISTS public.dashboard_datasources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dashboard_id UUID REFERENCES public.dashboards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'DATA_MODEL', 'ASSIGNMENT', 'EXTERNAL', 'CUSTOM_QUERY'
  source_id UUID, -- ID of the data model, assignment, etc.
  config JSONB DEFAULT '{}', -- datasource-specific configuration
  query_config JSONB DEFAULT '{}', -- query configuration
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard filters (global filters that affect multiple elements)
CREATE TABLE IF NOT EXISTS public.dashboard_filters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dashboard_id UUID REFERENCES public.dashboards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  filter_type TEXT NOT NULL, -- 'SELECT', 'MULTI_SELECT', 'DATE_RANGE', 'NUMBER_RANGE', 'TEXT'
  options JSONB DEFAULT '[]', -- for select/multi-select options
  default_value JSONB,
  is_required BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard templates
CREATE TABLE IF NOT EXISTS public.dashboard_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  thumbnail_url TEXT,
  template_config JSONB NOT NULL, -- complete dashboard configuration
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard sharing (for public links and specific sharing)
CREATE TABLE IF NOT EXISTS public.dashboard_shares (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dashboard_id UUID REFERENCES public.dashboards(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  share_type TEXT NOT NULL, -- 'PUBLIC', 'PRIVATE', 'PASSWORD_PROTECTED'
  password_hash TEXT, -- for password-protected shares
  expires_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dashboards_created_by ON public.dashboards(created_by);
CREATE INDEX IF NOT EXISTS idx_dashboards_is_default ON public.dashboards(is_default);
CREATE INDEX IF NOT EXISTS idx_dashboards_visibility ON public.dashboards(visibility);
CREATE INDEX IF NOT EXISTS idx_dashboards_public_link ON public.dashboards(public_link);
CREATE INDEX IF NOT EXISTS idx_dashboards_deleted_at ON public.dashboards(deleted_at);

CREATE INDEX IF NOT EXISTS idx_dashboard_spaces_dashboard_id ON public.dashboard_spaces(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_spaces_space_id ON public.dashboard_spaces(space_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_permissions_dashboard_id ON public.dashboard_permissions(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_permissions_user_id ON public.dashboard_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_elements_dashboard_id ON public.dashboard_elements(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_elements_type ON public.dashboard_elements(type);
CREATE INDEX IF NOT EXISTS idx_dashboard_elements_position ON public.dashboard_elements(position_x, position_y);

CREATE INDEX IF NOT EXISTS idx_dashboard_datasources_dashboard_id ON public.dashboard_datasources(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_datasources_source_type ON public.dashboard_datasources(source_type);

CREATE INDEX IF NOT EXISTS idx_dashboard_filters_dashboard_id ON public.dashboard_filters(dashboard_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_shares_dashboard_id ON public.dashboard_shares(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_share_token ON public.dashboard_shares(share_token);

-- RLS Policies
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_datasources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_shares ENABLE ROW LEVEL SECURITY;

-- Dashboard policies
CREATE POLICY "Users can view dashboards they have access to" ON public.dashboards
  FOR SELECT USING (
    created_by = auth.uid() OR
    id IN (
      SELECT dp.dashboard_id FROM dashboard_permissions dp WHERE dp.user_id = auth.uid()
    ) OR
    id IN (
      SELECT ds.dashboard_id FROM dashboard_spaces ds 
      JOIN space_members sm ON sm.space_id = ds.space_id 
      WHERE sm.user_id = auth.uid()
    ) OR
    visibility = 'PUBLIC'
  );

CREATE POLICY "Users can create dashboards" ON public.dashboards
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update dashboards they own or have admin access" ON public.dashboards
  FOR UPDATE USING (
    created_by = auth.uid() OR
    id IN (
      SELECT dp.dashboard_id FROM dashboard_permissions dp 
      WHERE dp.user_id = auth.uid() AND dp.role = 'ADMIN'
    )
  );

CREATE POLICY "Users can delete dashboards they own or have admin access" ON public.dashboards
  FOR DELETE USING (
    created_by = auth.uid() OR
    id IN (
      SELECT dp.dashboard_id FROM dashboard_permissions dp 
      WHERE dp.user_id = auth.uid() AND dp.role = 'ADMIN'
    )
  );

-- Dashboard spaces policies
CREATE POLICY "Users can view dashboard spaces they have access to" ON public.dashboard_spaces
  FOR SELECT USING (
    dashboard_id IN (
      SELECT id FROM dashboards WHERE 
        created_by = auth.uid() OR
        id IN (SELECT dashboard_id FROM dashboard_permissions WHERE user_id = auth.uid()) OR
        id IN (
          SELECT ds.dashboard_id FROM dashboard_spaces ds 
          JOIN space_members sm ON sm.space_id = ds.space_id 
          WHERE sm.user_id = auth.uid()
        ) OR
        visibility = 'PUBLIC'
    )
  );

CREATE POLICY "Users can manage dashboard spaces for dashboards they own" ON public.dashboard_spaces
  FOR ALL USING (
    dashboard_id IN (
      SELECT id FROM dashboards WHERE created_by = auth.uid()
    )
  );

-- Dashboard permissions policies
CREATE POLICY "Users can view dashboard permissions for dashboards they have access to" ON public.dashboard_permissions
  FOR SELECT USING (
    dashboard_id IN (
      SELECT id FROM dashboards WHERE 
        created_by = auth.uid() OR
        id IN (SELECT dashboard_id FROM dashboard_permissions WHERE user_id = auth.uid()) OR
        visibility = 'PUBLIC'
    )
  );

CREATE POLICY "Users can manage dashboard permissions for dashboards they own" ON public.dashboard_permissions
  FOR ALL USING (
    dashboard_id IN (
      SELECT id FROM dashboards WHERE created_by = auth.uid()
    )
  );

-- Dashboard elements policies
CREATE POLICY "Users can view dashboard elements for dashboards they have access to" ON public.dashboard_elements
  FOR SELECT USING (
    dashboard_id IN (
      SELECT id FROM dashboards WHERE 
        created_by = auth.uid() OR
        id IN (SELECT dashboard_id FROM dashboard_permissions WHERE user_id = auth.uid()) OR
        id IN (
          SELECT ds.dashboard_id FROM dashboard_spaces ds 
          JOIN space_members sm ON sm.space_id = ds.space_id 
          WHERE sm.user_id = auth.uid()
        ) OR
        visibility = 'PUBLIC'
    )
  );

CREATE POLICY "Users can manage dashboard elements for dashboards they own or have edit access" ON public.dashboard_elements
  FOR ALL USING (
    dashboard_id IN (
      SELECT id FROM dashboards WHERE 
        created_by = auth.uid() OR
        id IN (
          SELECT dashboard_id FROM dashboard_permissions 
          WHERE user_id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
        )
    )
  );

-- Dashboard datasources policies
CREATE POLICY "Users can view dashboard datasources for dashboards they have access to" ON public.dashboard_datasources
  FOR SELECT USING (
    dashboard_id IN (
      SELECT id FROM dashboards WHERE 
        created_by = auth.uid() OR
        id IN (SELECT dashboard_id FROM dashboard_permissions WHERE user_id = auth.uid()) OR
        id IN (
          SELECT ds.dashboard_id FROM dashboard_spaces ds 
          JOIN space_members sm ON sm.space_id = ds.space_id 
          WHERE sm.user_id = auth.uid()
        ) OR
        visibility = 'PUBLIC'
    )
  );

CREATE POLICY "Users can manage dashboard datasources for dashboards they own or have edit access" ON public.dashboard_datasources
  FOR ALL USING (
    dashboard_id IN (
      SELECT id FROM dashboards WHERE 
        created_by = auth.uid() OR
        id IN (
          SELECT dashboard_id FROM dashboard_permissions 
          WHERE user_id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
        )
    )
  );

-- Dashboard filters policies
CREATE POLICY "Users can view dashboard filters for dashboards they have access to" ON public.dashboard_filters
  FOR SELECT USING (
    dashboard_id IN (
      SELECT id FROM dashboards WHERE 
        created_by = auth.uid() OR
        id IN (SELECT dashboard_id FROM dashboard_permissions WHERE user_id = auth.uid()) OR
        id IN (
          SELECT ds.dashboard_id FROM dashboard_spaces ds 
          JOIN space_members sm ON sm.space_id = ds.space_id 
          WHERE sm.user_id = auth.uid()
        ) OR
        visibility = 'PUBLIC'
    )
  );

CREATE POLICY "Users can manage dashboard filters for dashboards they own or have edit access" ON public.dashboard_filters
  FOR ALL USING (
    dashboard_id IN (
      SELECT id FROM dashboards WHERE 
        created_by = auth.uid() OR
        id IN (
          SELECT dashboard_id FROM dashboard_permissions 
          WHERE user_id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
        )
    )
  );

-- Dashboard templates policies
CREATE POLICY "Users can view active dashboard templates" ON public.dashboard_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create dashboard templates" ON public.dashboard_templates
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update dashboard templates they own" ON public.dashboard_templates
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete dashboard templates they own" ON public.dashboard_templates
  FOR DELETE USING (created_by = auth.uid());

-- Dashboard shares policies
CREATE POLICY "Users can view dashboard shares for dashboards they own" ON public.dashboard_shares
  FOR SELECT USING (
    dashboard_id IN (
      SELECT id FROM dashboards WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage dashboard shares for dashboards they own" ON public.dashboard_shares
  FOR ALL USING (
    dashboard_id IN (
      SELECT id FROM dashboards WHERE created_by = auth.uid()
    )
  );

-- Functions for dashboard management
CREATE OR REPLACE FUNCTION public.generate_dashboard_public_link()
RETURNS TEXT AS $$
BEGIN
  RETURN 'dash_' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to set default dashboard for a space
CREATE OR REPLACE FUNCTION public.set_default_dashboard_for_space(
  p_dashboard_id UUID,
  p_space_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Remove default flag from other dashboards in the same space
  UPDATE public.dashboards 
  SET is_default = false 
  WHERE id IN (
    SELECT d.id FROM dashboards d
    JOIN dashboard_spaces ds ON ds.dashboard_id = d.id
    WHERE ds.space_id = p_space_id AND d.id != p_dashboard_id
  );
  
  -- Set the specified dashboard as default
  UPDATE public.dashboards 
  SET is_default = true 
  WHERE id = p_dashboard_id;
END;
$$ LANGUAGE plpgsql;

-- Function to duplicate a dashboard
CREATE OR REPLACE FUNCTION public.duplicate_dashboard(
  p_dashboard_id UUID,
  p_new_name TEXT,
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_new_dashboard_id UUID;
  v_element RECORD;
  v_datasource RECORD;
  v_filter RECORD;
BEGIN
  -- Create new dashboard
  INSERT INTO public.dashboards (
    name, description, type, visibility, is_default, is_active,
    refresh_rate, is_realtime, background_color, background_image,
    font_family, font_size, grid_size, layout_config, style_config, created_by
  )
  SELECT 
    p_new_name, description, type, 'PRIVATE', false, is_active,
    refresh_rate, is_realtime, background_color, background_image,
    font_family, font_size, grid_size, layout_config, style_config, p_created_by
  FROM public.dashboards WHERE id = p_dashboard_id
  RETURNING id INTO v_new_dashboard_id;
  
  -- Copy dashboard spaces
  INSERT INTO public.dashboard_spaces (dashboard_id, space_id)
  SELECT v_new_dashboard_id, space_id
  FROM public.dashboard_spaces WHERE dashboard_id = p_dashboard_id;
  
  -- Copy dashboard elements
  FOR v_element IN 
    SELECT * FROM public.dashboard_elements WHERE dashboard_id = p_dashboard_id
  LOOP
    INSERT INTO public.dashboard_elements (
      dashboard_id, name, type, chart_type, position_x, position_y,
      width, height, z_index, config, style, data_config, is_visible
    )
    VALUES (
      v_new_dashboard_id, v_element.name, v_element.type, v_element.chart_type,
      v_element.position_x, v_element.position_y, v_element.width, v_element.height,
      v_element.z_index, v_element.config, v_element.style, v_element.data_config,
      v_element.is_visible
    );
  END LOOP;
  
  -- Copy dashboard datasources
  FOR v_datasource IN 
    SELECT * FROM public.dashboard_datasources WHERE dashboard_id = p_dashboard_id
  LOOP
    INSERT INTO public.dashboard_datasources (
      dashboard_id, name, source_type, source_id, config, query_config, is_active
    )
    VALUES (
      v_new_dashboard_id, v_datasource.name, v_datasource.source_type,
      v_datasource.source_id, v_datasource.config, v_datasource.query_config,
      v_datasource.is_active
    );
  END LOOP;
  
  -- Copy dashboard filters
  FOR v_filter IN 
    SELECT * FROM public.dashboard_filters WHERE dashboard_id = p_dashboard_id
  LOOP
    INSERT INTO public.dashboard_filters (
      dashboard_id, name, field_name, filter_type, options, default_value,
      is_required, position
    )
    VALUES (
      v_new_dashboard_id, v_filter.name, v_filter.field_name, v_filter.filter_type,
      v_filter.options, v_filter.default_value, v_filter.is_required, v_filter.position
    );
  END LOOP;
  
  RETURN v_new_dashboard_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;
