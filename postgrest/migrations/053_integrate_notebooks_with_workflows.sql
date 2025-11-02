-- Integrate Notebooks with Workflows
-- This migration adds notebook execution as a workflow action type

BEGIN;

-- Add notebook execution action types to workflow_actions
-- Update the action_type constraint/enum if needed
-- For now, we'll use TEXT so it's flexible

-- Add notebook_id column to workflow_actions for notebook execution actions
ALTER TABLE public.workflow_actions
  ADD COLUMN IF NOT EXISTS notebook_id TEXT, -- Reference to notebook for execution
  ADD COLUMN IF NOT EXISTS action_config JSONB; -- Additional config for complex actions

-- Add index for notebook actions
CREATE INDEX IF NOT EXISTS idx_workflow_actions_notebook_id ON public.workflow_actions(notebook_id) WHERE notebook_id IS NOT NULL;

-- Add workflow_id to notebook_schedules for workflow-triggered notebooks
ALTER TABLE public.notebook_schedules
  ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS triggered_by_workflow BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_notebook_schedules_workflow_id ON public.notebook_schedules(workflow_id) WHERE workflow_id IS NOT NULL;

-- Add notebook execution results to workflow execution details
-- This allows workflows to track notebook execution results
ALTER TABLE public.workflow_executions
  ADD COLUMN IF NOT EXISTS notebook_executions JSONB; -- Array of notebook execution IDs/results

COMMIT;

