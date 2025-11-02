-- Notebook Schedules Migration
-- This migration creates scheduling system for notebook executions

BEGIN;

-- Notebook schedule frequency types
CREATE TYPE notebook_schedule_type AS ENUM ('once', 'interval', 'daily', 'weekly', 'monthly', 'cron');

-- Notebook schedule status
CREATE TYPE notebook_schedule_status AS ENUM ('active', 'paused', 'completed', 'failed');

-- Notebook execution status
CREATE TYPE notebook_execution_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- Notebook schedules table
CREATE TABLE IF NOT EXISTS public.notebook_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  notebook_id TEXT NOT NULL, -- Notebook identifier (can be file path or UUID)
  space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Schedule configuration
  schedule_type notebook_schedule_type NOT NULL DEFAULT 'daily',
  schedule_config JSONB, -- Cron expression, interval config, or time config
  timezone TEXT DEFAULT 'UTC',
  
  -- Execution control
  enabled BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  max_executions INTEGER, -- Limit number of executions (null = unlimited)
  execution_count INTEGER DEFAULT 0,
  
  -- Status tracking
  status notebook_schedule_status DEFAULT 'active',
  last_run_at TIMESTAMPTZ,
  last_run_status notebook_execution_status,
  last_run_error TEXT,
  next_run_at TIMESTAMPTZ,
  
  -- Parameters and options
  parameters JSONB, -- Parameters to pass to notebook execution
  execute_all_cells BOOLEAN DEFAULT true, -- Whether to execute all cells or specific cells
  cell_ids TEXT[], -- Specific cell IDs to execute (if execute_all_cells is false)
  
  -- Notifications
  notifications JSONB DEFAULT '{
    "enabled": false,
    "onSuccess": false,
    "onFailure": true,
    "onCompletion": false,
    "email": []
  }'::jsonb,
  
  -- Metadata
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notebook_schedules_notebook_id ON public.notebook_schedules(notebook_id);
CREATE INDEX IF NOT EXISTS idx_notebook_schedules_space_id ON public.notebook_schedules(space_id);
CREATE INDEX IF NOT EXISTS idx_notebook_schedules_enabled ON public.notebook_schedules(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_notebook_schedules_next_run ON public.notebook_schedules(next_run_at) WHERE enabled = true AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_notebook_schedules_status ON public.notebook_schedules(status);

-- Notebook schedule executions table (execution history)
CREATE TABLE IF NOT EXISTS public.notebook_schedule_executions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  schedule_id UUID REFERENCES public.notebook_schedules(id) ON DELETE CASCADE NOT NULL,
  notebook_id TEXT NOT NULL,
  
  -- Execution details
  status notebook_execution_status DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Results
  cells_executed INTEGER DEFAULT 0,
  cells_succeeded INTEGER DEFAULT 0,
  cells_failed INTEGER DEFAULT 0,
  output_data JSONB, -- Execution results/outputs
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  
  -- Execution log
  execution_log JSONB,
  
  -- Metadata
  triggered_by TEXT DEFAULT 'schedule', -- 'schedule', 'manual', 'api'
  triggered_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for executions
CREATE INDEX IF NOT EXISTS idx_notebook_executions_schedule_id ON public.notebook_schedule_executions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_notebook_executions_notebook_id ON public.notebook_schedule_executions(notebook_id);
CREATE INDEX IF NOT EXISTS idx_notebook_executions_status ON public.notebook_schedule_executions(status);
CREATE INDEX IF NOT EXISTS idx_notebook_executions_started_at ON public.notebook_schedule_executions(started_at DESC);

-- Function to calculate next run time
CREATE OR REPLACE FUNCTION calculate_notebook_next_run(
  schedule_type_val notebook_schedule_type,
  schedule_config_val JSONB,
  timezone_val TEXT,
  current_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  next_run TIMESTAMPTZ;
  cron_expr TEXT;
  interval_val INTEGER;
  interval_unit TEXT;
  hour_val INTEGER;
  minute_val INTEGER;
  day_of_week_val INTEGER;
  day_of_month_val INTEGER;
BEGIN
  CASE schedule_type_val
    WHEN 'once' THEN
      -- Run once: check if start_date is in the future
      IF schedule_config_val->>'start_date' IS NOT NULL THEN
        next_run := (schedule_config_val->>'start_date')::timestamptz;
        IF next_run <= current_time THEN
          RETURN NULL; -- Already passed
        END IF;
      ELSE
        RETURN NULL; -- No start date specified
      END IF;
      
    WHEN 'interval' THEN
      -- Interval: every X minutes/hours
      interval_val := (schedule_config_val->>'value')::INTEGER;
      interval_unit := COALESCE(schedule_config_val->>'unit', 'minutes');
      IF interval_unit = 'hours' THEN
        next_run := current_time + (interval_val || ' hours')::INTERVAL;
      ELSE
        next_run := current_time + (interval_val || ' minutes')::INTERVAL;
      END IF;
      
    WHEN 'daily' THEN
      -- Daily at specific time
      hour_val := COALESCE((schedule_config_val->>'hour')::INTEGER, 9);
      minute_val := COALESCE((schedule_config_val->>'minute')::INTEGER, 0);
      next_run := DATE_TRUNC('day', current_time AT TIME ZONE timezone_val) + 
                  (hour_val || ' hours')::INTERVAL + 
                  (minute_val || ' minutes')::INTERVAL;
      next_run := next_run AT TIME ZONE timezone_val;
      -- If time has passed today, schedule for tomorrow
      IF next_run <= current_time THEN
        next_run := next_run + '1 day'::INTERVAL;
      END IF;
      
    WHEN 'weekly' THEN
      -- Weekly on specific day and time
      day_of_week_val := COALESCE((schedule_config_val->>'dayOfWeek')::INTEGER, 1); -- 0=Sunday, 1=Monday, etc.
      hour_val := COALESCE((schedule_config_val->>'hour')::INTEGER, 9);
      minute_val := COALESCE((schedule_config_val->>'minute')::INTEGER, 0);
      next_run := DATE_TRUNC('week', current_time AT TIME ZONE timezone_val) + 
                  (day_of_week_val || ' days')::INTERVAL +
                  (hour_val || ' hours')::INTERVAL + 
                  (minute_val || ' minutes')::INTERVAL;
      next_run := next_run AT TIME ZONE timezone_val;
      -- If day has passed this week, schedule for next week
      IF next_run <= current_time THEN
        next_run := next_run + '1 week'::INTERVAL;
      END IF;
      
    WHEN 'monthly' THEN
      -- Monthly on specific day and time
      day_of_month_val := COALESCE((schedule_config_val->>'dayOfMonth')::INTEGER, 1);
      hour_val := COALESCE((schedule_config_val->>'hour')::INTEGER, 9);
      minute_val := COALESCE((schedule_config_val->>'minute')::INTEGER, 0);
      next_run := DATE_TRUNC('month', current_time AT TIME ZONE timezone_val) + 
                  ((day_of_month_val - 1) || ' days')::INTERVAL +
                  (hour_val || ' hours')::INTERVAL + 
                  (minute_val || ' minutes')::INTERVAL;
      next_run := next_run AT TIME ZONE timezone_val;
      -- If day has passed this month, schedule for next month
      IF next_run <= current_time THEN
        next_run := next_run + '1 month'::INTERVAL;
      END IF;
      
    WHEN 'cron' THEN
      -- Cron expression (requires pg_cron extension or external cron parser)
      cron_expr := schedule_config_val->>'expression';
      -- For now, we'll calculate basic cron patterns
      -- Full cron parsing would require a library or extension
      -- This is a simplified version
      RETURN NULL; -- Placeholder - full cron support needs additional implementation
      
    ELSE
      RETURN NULL;
  END CASE;
  
  RETURN next_run;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notebook_schedule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notebook_schedule_updated_at
  BEFORE UPDATE ON public.notebook_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_notebook_schedule_timestamp();

COMMIT;

