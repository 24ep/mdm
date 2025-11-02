-- Integration: Data Sync and Workflows
-- Allows workflows to be triggered after data syncs complete

BEGIN;

-- Add option to workflow schedules to trigger on data sync completion
ALTER TABLE public.workflow_schedules
  ADD COLUMN IF NOT EXISTS trigger_on_sync BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trigger_on_sync_schedule_id UUID REFERENCES public.data_sync_schedules(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_trigger_on_sync 
  ON public.workflow_schedules(trigger_on_sync, trigger_on_sync_schedule_id) 
  WHERE trigger_on_sync = true;

-- Add option to data sync schedules to trigger workflows after completion
ALTER TABLE public.data_sync_schedules
  ADD COLUMN IF NOT EXISTS trigger_workflows_on_success BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trigger_workflows_on_failure BOOLEAN DEFAULT false;

-- Create junction table for sync->workflow relationships
CREATE TABLE IF NOT EXISTS public.data_sync_workflow_triggers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sync_schedule_id UUID REFERENCES public.data_sync_schedules(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
  trigger_on_success BOOLEAN DEFAULT true,
  trigger_on_failure BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sync_schedule_id, workflow_id)
);

CREATE INDEX IF NOT EXISTS idx_sync_workflow_triggers_sync_id 
  ON public.data_sync_workflow_triggers(sync_schedule_id);
CREATE INDEX IF NOT EXISTS idx_sync_workflow_triggers_workflow_id 
  ON public.data_sync_workflow_triggers(workflow_id);

COMMIT;

