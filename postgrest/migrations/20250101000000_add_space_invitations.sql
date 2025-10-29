-- Create space_invitations table
CREATE TABLE IF NOT EXISTS space_invitations (
  id SERIAL PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  token VARCHAR(255) NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_space_invitations_space_id ON space_invitations(space_id);
CREATE INDEX IF NOT EXISTS idx_space_invitations_email ON space_invitations(email);
CREATE INDEX IF NOT EXISTS idx_space_invitations_token ON space_invitations(token);
CREATE INDEX IF NOT EXISTS idx_space_invitations_expires_at ON space_invitations(expires_at);

-- Add RLS policies
ALTER TABLE space_invitations ENABLE ROW LEVEL SECURITY;

-- Policy for space members to view invitations for their spaces
CREATE POLICY "Space members can view invitations for their spaces" ON space_invitations
  FOR SELECT USING (
    space_id IN (
      SELECT space_id FROM space_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for space admins/owners to manage invitations
CREATE POLICY "Space admins can manage invitations" ON space_invitations
  FOR ALL USING (
    space_id IN (
      SELECT space_id FROM space_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Policy for invited users to view their own invitations
CREATE POLICY "Users can view their own invitations" ON space_invitations
  FOR SELECT USING (email = auth.email());

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_space_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_space_invitations_updated_at
  BEFORE UPDATE ON space_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_space_invitations_updated_at();
