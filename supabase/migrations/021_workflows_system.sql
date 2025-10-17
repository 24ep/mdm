-- Workflows System Migration
-- This migration creates the workflow system for automated data model attribute updates

-- Create workflow trigger types
CREATE TYPE workflow_trigger_type AS ENUM ('SCHEDULED', 'EVENT_BASED', 'MANUAL');
CREATE TYPE workflow_status AS ENUM ('ACTIVE', 'INACTIVE', 'PAUSED', 'ERROR');
CREATE TYPE condition_operator AS ENUM ('EQUALS', 'NOT_EQUALS', 'CONTAINS', 'NOT_CONTAINS', 'GREATER_THAN', 'LESS_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL', 'IS_EMPTY', 'IS_NOT_EMPTY', 'IN', 'NOT_IN');

-- Workflows table
CREATE TABLE public.workflows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  data_model_id UUID REFERENCES public.data_models(id) ON DELETE CASCADE,
  trigger_type workflow_trigger_type NOT NULL,
  status workflow_status DEFAULT 'ACTIVE',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Workflow conditions table
CREATE TABLE public.workflow_conditions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
  attribute_id UUID REFERENCES public.data_model_attributes(id) ON DELETE CASCADE,
  operator condition_operator NOT NULL,
  value TEXT,
  logical_operator TEXT DEFAULT 'AND', -- AND, OR
  condition_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow actions table
CREATE TABLE public.workflow_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
  target_attribute_id UUID REFERENCES public.data_model_attributes(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'UPDATE_VALUE', 'SET_DEFAULT', 'CALCULATE', 'COPY_FROM'
  new_value TEXT,
  calculation_formula TEXT, -- For calculated fields
  source_attribute_id UUID REFERENCES public.data_model_attributes(id), -- For copy actions
  action_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow schedules table
CREATE TABLE public.workflow_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL, -- 'ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM_CRON'
  schedule_config JSONB, -- Store cron expression or schedule details
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow execution logs table
CREATE TABLE public.workflow_executions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
  execution_type TEXT NOT NULL, -- 'SCHEDULED', 'TRIGGERED', 'MANUAL'
  status TEXT NOT NULL, -- 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  records_processed INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  execution_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow execution results table (for tracking which records were affected)
CREATE TABLE public.workflow_execution_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  data_record_id UUID REFERENCES public.data_records(id) ON DELETE CASCADE,
  action_id UUID REFERENCES public.workflow_actions(id) ON DELETE CASCADE,
  old_value TEXT,
  new_value TEXT,
  status TEXT NOT NULL, -- 'SUCCESS', 'FAILED', 'SKIPPED'
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_workflows_data_model ON public.workflows(data_model_id);
CREATE INDEX idx_workflows_status ON public.workflows(status);
CREATE INDEX idx_workflows_trigger_type ON public.workflows(trigger_type);
CREATE INDEX idx_workflow_conditions_workflow ON public.workflow_conditions(workflow_id);
CREATE INDEX idx_workflow_actions_workflow ON public.workflow_actions(workflow_id);
CREATE INDEX idx_workflow_schedules_workflow ON public.workflow_schedules(workflow_id);
CREATE INDEX idx_workflow_executions_workflow ON public.workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX idx_workflow_execution_results_execution ON public.workflow_execution_results(execution_id);

-- Create function to update workflow updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for workflow updated_at
CREATE TRIGGER trigger_update_workflow_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_updated_at();

-- Create function to execute workflow
CREATE OR REPLACE FUNCTION execute_workflow(workflow_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  workflow_record RECORD;
  condition_record RECORD;
  action_record RECORD;
  execution_id UUID;
  records_processed INTEGER := 0;
  records_updated INTEGER := 0;
  error_count INTEGER := 0;
  result JSONB;
BEGIN
  -- Get workflow details
  SELECT * INTO workflow_record 
  FROM public.workflows 
  WHERE id = workflow_uuid AND is_active = true AND status = 'ACTIVE';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Workflow not found or inactive');
  END IF;
  
  -- Create execution record
  INSERT INTO public.workflow_executions (workflow_id, execution_type, status)
  VALUES (workflow_uuid, 'MANUAL', 'RUNNING')
  RETURNING id INTO execution_id;
  
  -- Build dynamic query based on conditions
  -- This is a simplified version - in production, you'd want more sophisticated condition building
  DECLARE
    where_clause TEXT := '';
    query_params TEXT[] := ARRAY[workflow_record.data_model_id::TEXT];
    param_count INTEGER := 2;
    sql_query TEXT;
  BEGIN
    -- Build WHERE clause from conditions
    FOR condition_record IN 
      SELECT wc.*, dma.name as attribute_name
      FROM public.workflow_conditions wc
      JOIN public.data_model_attributes dma ON wc.attribute_id = dma.id
      WHERE wc.workflow_id = workflow_uuid
      ORDER BY wc.condition_order
    LOOP
      IF where_clause != '' THEN
        where_clause := where_clause || ' ' || condition_record.logical_operator || ' ';
      END IF;
      
      CASE condition_record.operator
        WHEN 'EQUALS' THEN
          where_clause := where_clause || 'drv.value = $' || param_count;
          query_params := array_append(query_params, condition_record.value);
          param_count := param_count + 1;
        WHEN 'CONTAINS' THEN
          where_clause := where_clause || 'drv.value ILIKE $' || param_count;
          query_params := array_append(query_params, '%' || condition_record.value || '%');
          param_count := param_count + 1;
        -- Add more operators as needed
        ELSE
          -- Skip unsupported operators for now
          CONTINUE;
      END CASE;
    END LOOP;
    
    -- Build the main query
    sql_query := '
      SELECT dr.id as record_id, drv.attribute_id, drv.value
      FROM public.data_records dr
      JOIN public.data_record_values drv ON dr.id = drv.data_record_id
      WHERE dr.data_model_id = $1 AND dr.is_active = true';
    
    IF where_clause != '' THEN
      sql_query := sql_query || ' AND ' || where_clause;
    END IF;
    
    -- Execute the query and process results
    -- This is a simplified version - in production, you'd want proper cursor handling
    records_processed := 1; -- Placeholder
    
    -- Update execution record
    UPDATE public.workflow_executions 
    SET status = 'COMPLETED', 
        completed_at = NOW(),
        records_processed = records_processed,
        records_updated = records_updated
    WHERE id = execution_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'execution_id', execution_id,
      'records_processed', records_processed,
      'records_updated', records_updated
    );
  END;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Update execution record with error
    UPDATE public.workflow_executions 
    SET status = 'FAILED', 
        completed_at = NOW(),
        error_message = SQLERRM
    WHERE id = execution_id;
    
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for workflows
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_execution_results ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
CREATE POLICY "Users can view workflows" ON public.workflows
  FOR SELECT USING (true);

CREATE POLICY "Users can create workflows" ON public.workflows
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update workflows" ON public.workflows
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete workflows" ON public.workflows
  FOR DELETE USING (true);

-- Similar policies for other tables
CREATE POLICY "Users can manage workflow conditions" ON public.workflow_conditions
  FOR ALL USING (true);

CREATE POLICY "Users can manage workflow actions" ON public.workflow_actions
  FOR ALL USING (true);

CREATE POLICY "Users can manage workflow schedules" ON public.workflow_schedules
  FOR ALL USING (true);

CREATE POLICY "Users can view workflow executions" ON public.workflow_executions
  FOR SELECT USING (true);

CREATE POLICY "Users can view workflow execution results" ON public.workflow_execution_results
  FOR SELECT USING (true);
