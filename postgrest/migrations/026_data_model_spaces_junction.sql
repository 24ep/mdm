-- Create junction table for many-to-many relationship between data_models and spaces
CREATE TABLE IF NOT EXISTS data_model_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_model_id UUID NOT NULL REFERENCES data_models(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    UNIQUE(data_model_id, space_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_data_model_spaces_data_model_id ON data_model_spaces(data_model_id);
CREATE INDEX IF NOT EXISTS idx_data_model_spaces_space_id ON data_model_spaces(space_id);

-- Migrate existing data_model.space_id to the junction table
INSERT INTO data_model_spaces (data_model_id, space_id, created_at)
SELECT id, space_id, created_at
FROM data_models 
WHERE space_id IS NOT NULL
ON CONFLICT (data_model_id, space_id) DO NOTHING;
