-- Enhancements for data sync: retry logic, validation, alerts
BEGIN;

-- Add retry configuration to sync schedules
ALTER TABLE public.data_sync_schedules
  ADD COLUMN IF NOT EXISTS retry_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS retry_delay_seconds INTEGER DEFAULT 300, -- 5 minutes default
  ADD COLUMN IF NOT EXISTS retry_backoff_multiplier DECIMAL DEFAULT 2.0,
  ADD COLUMN IF NOT EXISTS current_retry_count INTEGER DEFAULT 0;

-- Add validation rules table
CREATE TABLE IF NOT EXISTS public.data_sync_validation_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sync_schedule_id UUID REFERENCES public.data_sync_schedules(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'required', 'type', 'format', 'range', 'custom'
  rule_config JSONB, -- Configuration for the rule (e.g., regex, min/max, allowed values)
  error_message TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_sync_validation_rules_sync_schedule_id ON public.data_sync_validation_rules(sync_schedule_id);

-- Add alerts table for sync monitoring
CREATE TABLE IF NOT EXISTS public.data_sync_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sync_schedule_id UUID REFERENCES public.data_sync_schedules(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'failure_threshold', 'record_count_anomaly', 'duration_anomaly', 'error_rate'
  alert_config JSONB, -- Configuration for the alert (thresholds, conditions)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_sync_alerts_sync_schedule_id ON public.data_sync_alerts(sync_schedule_id);

-- Add alert history table
CREATE TABLE IF NOT EXISTS public.data_sync_alert_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  alert_id UUID REFERENCES public.data_sync_alerts(id) ON DELETE CASCADE,
  sync_schedule_id UUID REFERENCES public.data_sync_schedules(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES public.data_sync_executions(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'error', 'critical'
  message TEXT NOT NULL,
  details JSONB,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_sync_alert_history_alert_id ON public.data_sync_alert_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_alert_history_sync_schedule_id ON public.data_sync_alert_history(sync_schedule_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_alert_history_acknowledged ON public.data_sync_alert_history(acknowledged) WHERE acknowledged = false;
CREATE INDEX IF NOT EXISTS idx_data_sync_alert_history_created_at ON public.data_sync_alert_history(created_at DESC);

-- Add recovery actions table
CREATE TABLE IF NOT EXISTS public.data_sync_recovery_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sync_schedule_id UUID REFERENCES public.data_sync_schedules(id) ON DELETE CASCADE,
  error_pattern TEXT, -- Pattern to match errors (regex or substring)
  recovery_action TEXT NOT NULL, -- 'skip', 'retry', 'fallback_query', 'notify_only'
  recovery_config JSONB, -- Configuration for recovery (fallback query, etc.)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_sync_recovery_actions_sync_schedule_id ON public.data_sync_recovery_actions(sync_schedule_id);

COMMIT;

