BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Types (idempotent via DO blocks)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE attribute_type AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'EMAIL', 'PHONE', 'URL', 'SELECT', 'MULTI_SELECT', 'TEXTAREA', 'JSON');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add email column to existing users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE public.users ADD COLUMN email TEXT;
    END IF;
END $$;

-- Create indexes for users table (only if email column exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users (is_active);

-- Teams
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Team Members
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  UNIQUE(team_id, user_id)
);

-- Permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL
);

-- Team Permissions
CREATE TABLE IF NOT EXISTS public.team_permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  UNIQUE(team_id, permission_id)
);

-- Roles
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Role Permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

-- Data Models
CREATE TABLE IF NOT EXISTS public.data_models (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Data Model Attributes
CREATE TABLE IF NOT EXISTS public.data_model_attributes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  data_model_id UUID REFERENCES public.data_models(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  type attribute_type NOT NULL,
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,
  default_value TEXT,
  options JSONB,
  validation JSONB,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(data_model_id, name)
);

-- Data Records
CREATE TABLE IF NOT EXISTS public.data_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  data_model_id UUID REFERENCES public.data_models(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Data Record Values
CREATE TABLE IF NOT EXISTS public.data_record_values (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  data_record_id UUID REFERENCES public.data_records(id) ON DELETE CASCADE,
  attribute_id UUID REFERENCES public.data_model_attributes(id) ON DELETE CASCADE,
  value TEXT,
  UNIQUE(data_record_id, attribute_id)
);

-- Companies
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Sources
CREATE TABLE IF NOT EXISTS public.sources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Industries
CREATE TABLE IF NOT EXISTS public.industries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.industries(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Positions
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Business Profiles
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Titles
CREATE TABLE IF NOT EXISTS public.titles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Call Workflow Statuses
CREATE TABLE IF NOT EXISTS public.call_workflow_statuses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  company_id UUID REFERENCES public.companies(id),
  source_id UUID REFERENCES public.sources(id),
  industry_id UUID REFERENCES public.industries(id),
  event_id UUID REFERENCES public.events(id),
  position_id UUID REFERENCES public.positions(id),
  business_profile_id UUID REFERENCES public.business_profiles(id),
  title_id UUID REFERENCES public.titles(id),
  call_workflow_status_id UUID REFERENCES public.call_workflow_statuses(id)
);

-- Customer Custom Attributes
CREATE TABLE IF NOT EXISTS public.customer_custom_attributes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT,
  UNIQUE(customer_id, name)
);

-- Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status assignment_status DEFAULT 'TODO',
  priority priority DEFAULT 'MEDIUM',
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES public.users(id),
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Customer Assignments
CREATE TABLE IF NOT EXISTS public.customer_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  UNIQUE(customer_id, assignment_id)
);

-- Views
CREATE TABLE IF NOT EXISTS public.views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  data_model_id UUID REFERENCES public.data_models(id) ON DELETE CASCADE,
  filters JSONB,
  columns JSONB,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- View Shares
CREATE TABLE IF NOT EXISTS public.view_shares (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  view_id UUID REFERENCES public.views(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  can_edit BOOLEAN DEFAULT false,
  UNIQUE(view_id, user_id, team_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Activities
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import Jobs
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  file_name TEXT NOT NULL,
  data_model_id UUID REFERENCES public.data_models(id) ON DELETE CASCADE,
  status job_status DEFAULT 'PENDING',
  progress INTEGER DEFAULT 0,
  total_rows INTEGER,
  processed_rows INTEGER DEFAULT 0,
  error_rows INTEGER DEFAULT 0,
  errors JSONB,
  mapping JSONB,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Export Jobs
CREATE TABLE IF NOT EXISTS public.export_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  file_name TEXT NOT NULL,
  data_model_id UUID REFERENCES public.data_models(id) ON DELETE CASCADE,
  status job_status DEFAULT 'PENDING',
  progress INTEGER DEFAULT 0,
  filters JSONB,
  columns JSONB,
  format TEXT DEFAULT 'xlsx',
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_source_id ON public.customers(source_id);
CREATE INDEX IF NOT EXISTS idx_customers_industry_id ON public.customers(industry_id);
CREATE INDEX IF NOT EXISTS idx_customers_event_id ON public.customers(event_id);
CREATE INDEX IF NOT EXISTS idx_customers_position_id ON public.customers(position_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_profile_id ON public.customers(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_customers_title_id ON public.customers(title_id);
CREATE INDEX IF NOT EXISTS idx_customers_call_workflow_status_id ON public.customers(call_workflow_status_id);
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON public.customers(deleted_at);

CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON public.assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON public.assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_deleted_at ON public.assignments(deleted_at);

CREATE INDEX IF NOT EXISTS idx_activities_entity_type_entity_id ON public.activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);

CREATE INDEX IF NOT EXISTS idx_comments_entity_type_entity_id ON public.comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

-- Trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers idempotently
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN DROP TRIGGER update_users_updated_at ON public.users; END IF; END $$;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_teams_updated_at') THEN DROP TRIGGER update_teams_updated_at ON public.teams; END IF; END $$;
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_data_models_updated_at') THEN DROP TRIGGER update_data_models_updated_at ON public.data_models; END IF; END $$;
CREATE TRIGGER update_data_models_updated_at BEFORE UPDATE ON public.data_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_data_model_attributes_updated_at') THEN DROP TRIGGER update_data_model_attributes_updated_at ON public.data_model_attributes; END IF; END $$;
CREATE TRIGGER update_data_model_attributes_updated_at BEFORE UPDATE ON public.data_model_attributes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_data_records_updated_at') THEN DROP TRIGGER update_data_records_updated_at ON public.data_records; END IF; END $$;
CREATE TRIGGER update_data_records_updated_at BEFORE UPDATE ON public.data_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_companies_updated_at') THEN DROP TRIGGER update_companies_updated_at ON public.companies; END IF; END $$;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sources_updated_at') THEN DROP TRIGGER update_sources_updated_at ON public.sources; END IF; END $$;
CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON public.sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_industries_updated_at') THEN DROP TRIGGER update_industries_updated_at ON public.industries; END IF; END $$;
CREATE TRIGGER update_industries_updated_at BEFORE UPDATE ON public.industries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_events_updated_at') THEN DROP TRIGGER update_events_updated_at ON public.events; END IF; END $$;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_positions_updated_at') THEN DROP TRIGGER update_positions_updated_at ON public.positions; END IF; END $$;
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_business_profiles_updated_at') THEN DROP TRIGGER update_business_profiles_updated_at ON public.business_profiles; END IF; END $$;
CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_titles_updated_at') THEN DROP TRIGGER update_titles_updated_at ON public.titles; END IF; END $$;
CREATE TRIGGER update_titles_updated_at BEFORE UPDATE ON public.titles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_call_workflow_statuses_updated_at') THEN DROP TRIGGER update_call_workflow_statuses_updated_at ON public.call_workflow_statuses; END IF; END $$;
CREATE TRIGGER update_call_workflow_statuses_updated_at BEFORE UPDATE ON public.call_workflow_statuses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_customers_updated_at') THEN DROP TRIGGER update_customers_updated_at ON public.customers; END IF; END $$;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_assignments_updated_at') THEN DROP TRIGGER update_assignments_updated_at ON public.assignments; END IF; END $$;
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_views_updated_at') THEN DROP TRIGGER update_views_updated_at ON public.views; END IF; END $$;
CREATE TRIGGER update_views_updated_at BEFORE UPDATE ON public.views FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_comments_updated_at') THEN DROP TRIGGER update_comments_updated_at ON public.comments; END IF; END $$;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_import_jobs_updated_at') THEN DROP TRIGGER update_import_jobs_updated_at ON public.import_jobs; END IF; END $$;
CREATE TRIGGER update_import_jobs_updated_at BEFORE UPDATE ON public.import_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_export_jobs_updated_at') THEN DROP TRIGGER update_export_jobs_updated_at ON public.export_jobs; END IF; END $$;
CREATE TRIGGER update_export_jobs_updated_at BEFORE UPDATE ON public.export_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_settings_updated_at') THEN DROP TRIGGER update_system_settings_updated_at ON public.system_settings; END IF; END $$;
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;


