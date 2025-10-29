-- Create member_permissions table
CREATE TABLE IF NOT EXISTS member_permissions (
  id SERIAL PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(space_id, user_id)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_activities table for activity tracking
CREATE TABLE IF NOT EXISTS user_activities (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_active column to space_members if it doesn't exist
ALTER TABLE space_members 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add updated_at column to space_members if it doesn't exist
ALTER TABLE space_members 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_member_permissions_space_id ON member_permissions(space_id);
CREATE INDEX IF NOT EXISTS idx_member_permissions_user_id ON member_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_space_id ON audit_logs(space_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_space_id ON user_activities(space_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

-- Add RLS policies
ALTER TABLE member_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Policies for member_permissions
CREATE POLICY "Space members can view permissions for their spaces" ON member_permissions
  FOR SELECT USING (
    space_id IN (
      SELECT space_id FROM space_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Space admins can manage permissions" ON member_permissions
  FOR ALL USING (
    space_id IN (
      SELECT space_id FROM space_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Policies for audit_logs
CREATE POLICY "Space members can view audit logs for their spaces" ON audit_logs
  FOR SELECT USING (
    space_id IN (
      SELECT space_id FROM space_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Space members can create audit log entries" ON audit_logs
  FOR INSERT WITH CHECK (
    space_id IN (
      SELECT space_id FROM space_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policies for user_activities
CREATE POLICY "Users can view their own activities" ON user_activities
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own activities" ON user_activities
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add triggers to update updated_at
CREATE OR REPLACE FUNCTION update_member_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_member_permissions_updated_at
  BEFORE UPDATE ON member_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_member_permissions_updated_at();

CREATE OR REPLACE FUNCTION update_space_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_space_members_updated_at
  BEFORE UPDATE ON space_members
  FOR EACH ROW
  EXECUTE FUNCTION update_space_members_updated_at();

-- Sample data insertion removed to avoid conflicts
