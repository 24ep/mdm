-- Add Knowledge Base Permissions
INSERT INTO permissions (id, name, description, resource, action)
VALUES 
  (gen_random_uuid(), 'knowledge:read', 'View knowledge collections and documents', 'knowledge', 'read'),
  (gen_random_uuid(), 'knowledge:create', 'Create knowledge collections', 'knowledge', 'create'),
  (gen_random_uuid(), 'knowledge:update', 'Update knowledge collections', 'knowledge', 'update'),
  (gen_random_uuid(), 'knowledge:delete', 'Delete knowledge collections', 'knowledge', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Grant to USER role
DO $$
DECLARE
  user_role_id uuid;
  perm_read_id uuid;
  perm_create_id uuid;
  perm_update_id uuid;
  perm_delete_id uuid;
BEGIN
  SELECT id INTO user_role_id FROM roles WHERE name = 'USER';
  SELECT id INTO perm_read_id FROM permissions WHERE name = 'knowledge:read';
  SELECT id INTO perm_create_id FROM permissions WHERE name = 'knowledge:create';
  SELECT id INTO perm_update_id FROM permissions WHERE name = 'knowledge:update';
  SELECT id INTO perm_delete_id FROM permissions WHERE name = 'knowledge:delete';

  IF user_role_id IS NOT NULL THEN
    INSERT INTO role_permissions (id, role_id, permission_id) VALUES (gen_random_uuid(), user_role_id, perm_read_id) ON CONFLICT DO NOTHING;
    INSERT INTO role_permissions (id, role_id, permission_id) VALUES (gen_random_uuid(), user_role_id, perm_create_id) ON CONFLICT DO NOTHING;
    INSERT INTO role_permissions (id, role_id, permission_id) VALUES (gen_random_uuid(), user_role_id, perm_update_id) ON CONFLICT DO NOTHING;
    INSERT INTO role_permissions (id, role_id, permission_id) VALUES (gen_random_uuid(), user_role_id, perm_delete_id) ON CONFLICT DO NOTHING;
  END IF;
END $$;
