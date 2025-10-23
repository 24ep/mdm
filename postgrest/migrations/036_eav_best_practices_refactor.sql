-- EAV Best Practices Refactor
-- This migration implements a comprehensive EAV pattern following best practices

BEGIN;

-- Create enhanced data types for better type safety
DO $$ BEGIN
  CREATE TYPE eav_data_type AS ENUM (
    'TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'DATETIME', 'EMAIL', 'PHONE', 'URL', 
    'SELECT', 'MULTI_SELECT', 'TEXTAREA', 'JSON', 'BLOB', 'FILE', 'USER', 
    'USER_MULTI', 'REFERENCE', 'REFERENCE_MULTI', 'CURRENCY', 'PERCENTAGE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;

DO $$ BEGIN
  CREATE TYPE attribute_cardinality AS ENUM ('SINGLE', 'MULTIPLE');
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;

DO $$ BEGIN
  CREATE TYPE attribute_scope AS ENUM ('GLOBAL', 'ENTITY_TYPE', 'INSTANCE');
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;

-- Entity Types (enhanced data models)
CREATE TABLE IF NOT EXISTS public.entity_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.entity_types(id) ON DELETE SET NULL,
  is_abstract BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Attribute Groups for better organization
CREATE TABLE IF NOT EXISTS public.attribute_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type_id UUID REFERENCES public.entity_types(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  is_collapsible BOOLEAN DEFAULT TRUE,
  is_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Attributes table
CREATE TABLE IF NOT EXISTS public.eav_attributes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Entity relationship
  entity_type_id UUID REFERENCES public.entity_types(id) ON DELETE CASCADE,
  attribute_group_id UUID REFERENCES public.attribute_groups(id) ON DELETE SET NULL,
  
  -- Data type and constraints
  data_type eav_data_type NOT NULL,
  cardinality attribute_cardinality DEFAULT 'SINGLE',
  scope attribute_scope DEFAULT 'INSTANCE',
  
  -- Validation and constraints
  is_required BOOLEAN DEFAULT FALSE,
  is_unique BOOLEAN DEFAULT FALSE,
  is_indexed BOOLEAN DEFAULT FALSE,
  is_searchable BOOLEAN DEFAULT TRUE,
  is_auditable BOOLEAN DEFAULT TRUE,
  
  -- Default values and options
  default_value TEXT,
  options JSONB DEFAULT '{}',
  validation_rules JSONB DEFAULT '{}',
  
  -- UI and display
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  is_editable BOOLEAN DEFAULT TRUE,
  help_text TEXT,
  placeholder TEXT,
  
  -- Reference attributes (for foreign keys)
  reference_entity_type_id UUID REFERENCES public.entity_types(id) ON DELETE SET NULL,
  reference_display_field VARCHAR(255),
  
  -- Auto-increment support
  is_auto_increment BOOLEAN DEFAULT FALSE,
  auto_increment_prefix VARCHAR(50) DEFAULT '',
  auto_increment_suffix VARCHAR(50) DEFAULT '',
  auto_increment_start INTEGER DEFAULT 1,
  auto_increment_padding INTEGER DEFAULT 3,
  current_auto_increment_value INTEGER DEFAULT 0,
  
  -- External system integration
  external_column VARCHAR(255),
  external_mapping JSONB DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(entity_type_id, name),
  CONSTRAINT valid_reference CHECK (
    (data_type IN ('REFERENCE', 'REFERENCE_MULTI') AND reference_entity_type_id IS NOT NULL) OR
    (data_type NOT IN ('REFERENCE', 'REFERENCE_MULTI') AND reference_entity_type_id IS NULL)
  )
);

-- Enhanced Entity Instances (replaces data_records)
CREATE TABLE IF NOT EXISTS public.eav_entities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type_id UUID NOT NULL REFERENCES public.entity_types(id) ON DELETE CASCADE,
  external_id VARCHAR(255), -- For external system integration
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Index for performance
  UNIQUE(entity_type_id, external_id)
);

-- Enhanced Values table with type-specific columns for performance
CREATE TABLE IF NOT EXISTS public.eav_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.eav_entities(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES public.eav_attributes(id) ON DELETE CASCADE,
  
  -- Type-specific value columns for better performance
  text_value TEXT,
  number_value DECIMAL(20,6),
  boolean_value BOOLEAN,
  date_value DATE,
  datetime_value TIMESTAMPTZ,
  json_value JSONB,
  blob_value BYTEA,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(entity_id, attribute_id),
  
  -- Ensure only one value column is populated
  CONSTRAINT single_value_check CHECK (
    (text_value IS NOT NULL)::INTEGER +
    (number_value IS NOT NULL)::INTEGER +
    (boolean_value IS NOT NULL)::INTEGER +
    (date_value IS NOT NULL)::INTEGER +
    (datetime_value IS NOT NULL)::INTEGER +
    (json_value IS NOT NULL)::INTEGER +
    (blob_value IS NOT NULL)::INTEGER = 1
  )
);

-- Attribute Dependencies for complex relationships
CREATE TABLE IF NOT EXISTS public.attribute_dependencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dependent_attribute_id UUID NOT NULL REFERENCES public.eav_attributes(id) ON DELETE CASCADE,
  depends_on_attribute_id UUID NOT NULL REFERENCES public.eav_attributes(id) ON DELETE CASCADE,
  condition_type VARCHAR(50) NOT NULL, -- 'EQUALS', 'NOT_EQUALS', 'CONTAINS', 'EXISTS', etc.
  condition_value TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT no_self_dependency CHECK (dependent_attribute_id != depends_on_attribute_id)
);

-- Attribute Inheritance for entity type hierarchies
CREATE TABLE IF NOT EXISTS public.attribute_inheritance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_entity_type_id UUID NOT NULL REFERENCES public.entity_types(id) ON DELETE CASCADE,
  parent_entity_type_id UUID NOT NULL REFERENCES public.entity_types(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES public.eav_attributes(id) ON DELETE CASCADE,
  inheritance_type VARCHAR(50) DEFAULT 'INHERIT', -- 'INHERIT', 'OVERRIDE', 'HIDE'
  overridden_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(child_entity_type_id, attribute_id),
  CONSTRAINT no_self_inheritance CHECK (child_entity_type_id != parent_entity_type_id)
);

-- Value History for audit trail
CREATE TABLE IF NOT EXISTS public.eav_value_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.eav_entities(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES public.eav_attributes(id) ON DELETE CASCADE,
  old_text_value TEXT,
  old_number_value DECIMAL(20,6),
  old_boolean_value BOOLEAN,
  old_date_value DATE,
  old_datetime_value TIMESTAMPTZ,
  old_json_value JSONB,
  old_blob_value BYTEA,
  new_text_value TEXT,
  new_number_value DECIMAL(20,6),
  new_boolean_value BOOLEAN,
  new_date_value DATE,
  new_datetime_value TIMESTAMPTZ,
  new_json_value JSONB,
  new_blob_value BYTEA,
  changed_by UUID REFERENCES public.users(id),
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_entity_types_parent_id ON public.entity_types(parent_id);
CREATE INDEX IF NOT EXISTS idx_entity_types_name ON public.entity_types(name);
CREATE INDEX IF NOT EXISTS idx_entity_types_active ON public.entity_types(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_attribute_groups_entity_type ON public.attribute_groups(entity_type_id);
CREATE INDEX IF NOT EXISTS idx_attribute_groups_sort_order ON public.attribute_groups(sort_order);

CREATE INDEX IF NOT EXISTS idx_eav_attributes_entity_type ON public.eav_attributes(entity_type_id);
CREATE INDEX IF NOT EXISTS idx_eav_attributes_group ON public.eav_attributes(attribute_group_id);
CREATE INDEX IF NOT EXISTS idx_eav_attributes_data_type ON public.eav_attributes(data_type);
CREATE INDEX IF NOT EXISTS idx_eav_attributes_active ON public.eav_attributes(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_eav_attributes_indexed ON public.eav_attributes(id) WHERE is_indexed = TRUE;
CREATE INDEX IF NOT EXISTS idx_eav_attributes_searchable ON public.eav_attributes(id) WHERE is_searchable = TRUE;

CREATE INDEX IF NOT EXISTS idx_eav_entities_entity_type ON public.eav_entities(entity_type_id);
CREATE INDEX IF NOT EXISTS idx_eav_entities_active ON public.eav_entities(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_eav_entities_created_by ON public.eav_entities(created_by);
CREATE INDEX IF NOT EXISTS idx_eav_entities_created_at ON public.eav_entities(created_at);

CREATE INDEX IF NOT EXISTS idx_eav_values_entity ON public.eav_values(entity_id);
CREATE INDEX IF NOT EXISTS idx_eav_values_attribute ON public.eav_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_eav_values_text ON public.eav_values(text_value) WHERE text_value IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eav_values_number ON public.eav_values(number_value) WHERE number_value IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eav_values_boolean ON public.eav_values(boolean_value) WHERE boolean_value IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eav_values_date ON public.eav_values(date_value) WHERE date_value IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eav_values_datetime ON public.eav_values(datetime_value) WHERE datetime_value IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attribute_dependencies_dependent ON public.attribute_dependencies(dependent_attribute_id);
CREATE INDEX IF NOT EXISTS idx_attribute_dependencies_depends ON public.attribute_dependencies(depends_on_attribute_id);

CREATE INDEX IF NOT EXISTS idx_attribute_inheritance_child ON public.attribute_inheritance(child_entity_type_id);
CREATE INDEX IF NOT EXISTS idx_attribute_inheritance_parent ON public.attribute_inheritance(parent_entity_type_id);
CREATE INDEX IF NOT EXISTS idx_attribute_inheritance_attribute ON public.attribute_inheritance(attribute_id);

CREATE INDEX IF NOT EXISTS idx_eav_value_history_entity ON public.eav_value_history(entity_id);
CREATE INDEX IF NOT EXISTS idx_eav_value_history_attribute ON public.eav_value_history(attribute_id);
CREATE INDEX IF NOT EXISTS idx_eav_value_history_created_at ON public.eav_value_history(created_at);

-- Create functions for EAV operations

-- Function to get entity values as key-value pairs
CREATE OR REPLACE FUNCTION get_entity_values(entity_uuid UUID)
RETURNS TABLE(attribute_name VARCHAR, value TEXT, data_type eav_data_type) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.name as attribute_name,
    COALESCE(
      v.text_value::TEXT,
      v.number_value::TEXT,
      v.boolean_value::TEXT,
      v.date_value::TEXT,
      v.datetime_value::TEXT,
      v.json_value::TEXT
    ) as value,
    a.data_type
  FROM eav_attributes a
  LEFT JOIN eav_values v ON v.attribute_id = a.id AND v.entity_id = entity_uuid
  WHERE a.is_active = TRUE
  ORDER BY a.sort_order, a.name;
END;
$$ LANGUAGE plpgsql;

-- Function to set entity value
CREATE OR REPLACE FUNCTION set_entity_value(
  entity_uuid UUID,
  attribute_uuid UUID,
  value_text TEXT DEFAULT NULL,
  value_number DECIMAL DEFAULT NULL,
  value_boolean BOOLEAN DEFAULT NULL,
  value_date DATE DEFAULT NULL,
  value_datetime TIMESTAMPTZ DEFAULT NULL,
  value_json JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  attr_data_type eav_data_type;
BEGIN
  -- Get attribute data type
  SELECT data_type INTO attr_data_type 
  FROM eav_attributes 
  WHERE id = attribute_uuid AND is_active = TRUE;
  
  IF attr_data_type IS NULL THEN
    RAISE EXCEPTION 'Attribute not found or inactive';
  END IF;
  
  -- Insert or update value based on data type
  INSERT INTO eav_values (entity_id, attribute_id, text_value, number_value, boolean_value, date_value, datetime_value, json_value)
  VALUES (entity_uuid, attribute_uuid, value_text, value_number, value_boolean, value_date, value_datetime, value_json)
  ON CONFLICT (entity_id, attribute_id) 
  DO UPDATE SET
    text_value = EXCLUDED.text_value,
    number_value = EXCLUDED.number_value,
    boolean_value = EXCLUDED.boolean_value,
    date_value = EXCLUDED.date_value,
    datetime_value = EXCLUDED.datetime_value,
    json_value = EXCLUDED.json_value,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to validate entity values
CREATE OR REPLACE FUNCTION validate_entity_values(entity_uuid UUID)
RETURNS TABLE(attribute_name VARCHAR, is_valid BOOLEAN, error_message TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.name as attribute_name,
    CASE 
      WHEN a.is_required AND v.id IS NULL THEN FALSE
      WHEN a.is_unique AND v.id IS NOT NULL AND EXISTS (
        SELECT 1 FROM eav_values v2 
        JOIN eav_entities e2 ON v2.entity_id = e2.id 
        WHERE v2.attribute_id = a.id 
        AND v2.entity_id != entity_uuid
        AND e2.entity_type_id = (SELECT entity_type_id FROM eav_entities WHERE id = entity_uuid)
        AND (
          (a.data_type = 'TEXT' AND v2.text_value = v.text_value) OR
          (a.data_type = 'NUMBER' AND v2.number_value = v.number_value) OR
          (a.data_type = 'BOOLEAN' AND v2.boolean_value = v.boolean_value) OR
          (a.data_type = 'DATE' AND v2.date_value = v.date_value) OR
          (a.data_type = 'DATETIME' AND v2.datetime_value = v.datetime_value)
        )
      ) THEN FALSE
      ELSE TRUE
    END as is_valid,
    CASE 
      WHEN a.is_required AND v.id IS NULL THEN 'Required field is missing'
      WHEN a.is_unique AND v.id IS NOT NULL AND EXISTS (
        SELECT 1 FROM eav_values v2 
        JOIN eav_entities e2 ON v2.entity_id = e2.id 
        WHERE v2.attribute_id = a.id 
        AND v2.entity_id != entity_uuid
        AND e2.entity_type_id = (SELECT entity_type_id FROM eav_entities WHERE id = entity_uuid)
        AND (
          (a.data_type = 'TEXT' AND v2.text_value = v.text_value) OR
          (a.data_type = 'NUMBER' AND v2.number_value = v.number_value) OR
          (a.data_type = 'BOOLEAN' AND v2.boolean_value = v.boolean_value) OR
          (a.data_type = 'DATE' AND v2.date_value = v.date_value) OR
          (a.data_type = 'DATETIME' AND v2.datetime_value = v.datetime_value)
        )
      ) THEN 'Value must be unique'
      ELSE NULL
    END as error_message
  FROM eav_attributes a
  LEFT JOIN eav_values v ON v.attribute_id = a.id AND v.entity_id = entity_uuid
  WHERE a.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_entity_types_updated_at 
  BEFORE UPDATE ON public.entity_types 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attribute_groups_updated_at 
  BEFORE UPDATE ON public.attribute_groups 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eav_attributes_updated_at 
  BEFORE UPDATE ON public.eav_attributes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eav_entities_updated_at 
  BEFORE UPDATE ON public.eav_entities 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eav_values_updated_at 
  BEFORE UPDATE ON public.eav_values 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for value history
CREATE OR REPLACE FUNCTION track_value_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO eav_value_history (
      entity_id, attribute_id,
      old_text_value, old_number_value, old_boolean_value, old_date_value, old_datetime_value, old_json_value, old_blob_value,
      new_text_value, new_number_value, new_boolean_value, new_date_value, new_datetime_value, new_json_value, new_blob_value,
      changed_by
    ) VALUES (
      NEW.entity_id, NEW.attribute_id,
      OLD.text_value, OLD.number_value, OLD.boolean_value, OLD.date_value, OLD.datetime_value, OLD.json_value, OLD.blob_value,
      NEW.text_value, NEW.number_value, NEW.boolean_value, NEW.date_value, NEW.datetime_value, NEW.json_value, NEW.blob_value,
      current_setting('app.current_user_id', true)::UUID
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO eav_value_history (
      entity_id, attribute_id,
      new_text_value, new_number_value, new_boolean_value, new_date_value, new_datetime_value, new_json_value, new_blob_value,
      changed_by
    ) VALUES (
      NEW.entity_id, NEW.attribute_id,
      NEW.text_value, NEW.number_value, NEW.boolean_value, NEW.date_value, NEW.datetime_value, NEW.json_value, NEW.blob_value,
      current_setting('app.current_user_id', true)::UUID
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_eav_value_changes
  AFTER INSERT OR UPDATE ON public.eav_values
  FOR EACH ROW EXECUTE FUNCTION track_value_changes();

-- Enable RLS
ALTER TABLE public.entity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eav_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eav_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eav_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_inheritance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eav_value_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic implementation)
-- These would need to be customized based on your specific access control requirements

-- Entity Types policies
CREATE POLICY "Users can view active entity types" ON public.entity_types
  FOR SELECT USING (is_active = TRUE);

-- Attribute Groups policies  
CREATE POLICY "Users can view attribute groups" ON public.attribute_groups
  FOR SELECT USING (TRUE);

-- EAV Attributes policies
CREATE POLICY "Users can view active attributes" ON public.eav_attributes
  FOR SELECT USING (is_active = TRUE);

-- EAV Entities policies
CREATE POLICY "Users can view active entities" ON public.eav_entities
  FOR SELECT USING (is_active = TRUE);

-- EAV Values policies
CREATE POLICY "Users can view values" ON public.eav_values
  FOR SELECT USING (TRUE);

-- Attribute Dependencies policies
CREATE POLICY "Users can view attribute dependencies" ON public.attribute_dependencies
  FOR SELECT USING (is_active = TRUE);

-- Attribute Inheritance policies
CREATE POLICY "Users can view attribute inheritance" ON public.attribute_inheritance
  FOR SELECT USING (TRUE);

-- Value History policies
CREATE POLICY "Users can view value history" ON public.eav_value_history
  FOR SELECT USING (TRUE);

COMMIT;
