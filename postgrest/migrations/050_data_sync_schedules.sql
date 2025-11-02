-- Data Synchronization Schedules
-- Allows automatic synchronization of external data sources (APIs and databases) into internal data models
BEGIN;

-- Sync schedule types
CREATE TYPE sync_schedule_type AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'CUSTOM_CRON', 'MANUAL');
CREATE TYPE sync_strategy AS ENUM ('FULL_REFRESH', 'INCREMENTAL', 'APPEND');
CREATE TYPE sync_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- Data sync schedules table
CREATE TABLE IF NOT EXISTS public.data_sync_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
  data_model_id UUID REFERENCES public.data_models(id) ON DELETE CASCADE,
  external_connection_id UUID REFERENCES public.external_connections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  schedule_type sync_schedule_type NOT NULL DEFAULT 'MANUAL',
  schedule_config JSONB, -- Cron expression for CUSTOM_CRON, or specific times for others
  sync_strategy sync_strategy NOT NULL DEFAULT 'FULL_REFRESH',
  
  -- Incremental sync configuration (if strategy is INCREMENTAL)
  incremental_key TEXT, -- Column/key to track for incremental syncs
  incremental_timestamp_column TEXT, -- For tracking last sync timestamp
  
  -- Full refresh options
  clear_existing_data BOOLEAN DEFAULT true, -- Whether to clear existing data before sync
  
  -- Filters and transformations
  source_query TEXT, -- Optional SQL query for database sources or API path for API sources
  data_mapping JSONB, -- Field mapping between source and target
  
  -- Status and control
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_run_status sync_status,
  last_run_error TEXT,
  next_run_at TIMESTAMPTZ,
  
  -- Limits and throttling
  max_records_per_sync INTEGER, -- Limit records per sync
  rate_limit_per_minute INTEGER, -- Rate limiting for API calls
  
  -- Notifications
  notify_on_success BOOLEAN DEFAULT false,
  notify_on_failure BOOLEAN DEFAULT true,
  notification_emails TEXT[], -- Email addresses to notify
  
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_data_sync_schedules_space_id ON public.data_sync_schedules(space_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_schedules_data_model_id ON public.data_sync_schedules(data_model_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_schedules_external_connection_id ON public.data_sync_schedules(external_connection_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_schedules_is_active ON public.data_sync_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_data_sync_schedules_next_run_at ON public.data_sync_schedules(next_run_at) WHERE is_active = true AND deleted_at IS NULL;

-- Data sync execution logs
CREATE TABLE IF NOT EXISTS public.data_sync_executions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sync_schedule_id UUID REFERENCES public.data_sync_schedules(id) ON DELETE CASCADE,
  status sync_status NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Execution metrics
  records_fetched INTEGER DEFAULT 0,
  records_processed INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_deleted INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  
  -- Execution details
  execution_log JSONB, -- Detailed log of execution steps
  duration_ms INTEGER, -- Execution duration in milliseconds
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_sync_executions_sync_schedule_id ON public.data_sync_executions(sync_schedule_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_executions_status ON public.data_sync_executions(status);
CREATE INDEX IF NOT EXISTS idx_data_sync_executions_started_at ON public.data_sync_executions(started_at DESC);

-- Add sync schedule reference to data models (optional, for quick lookup)
ALTER TABLE public.data_models
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_status sync_status;

COMMIT;

