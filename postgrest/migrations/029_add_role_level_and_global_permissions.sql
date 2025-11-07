-- Add level field to roles table (global vs space)
ALTER TABLE public.roles 
ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'space' CHECK (level IN ('global', 'space'));

-- Add is_system field to roles table
ALTER TABLE public.roles 
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- Update existing roles to be space-level by default
UPDATE public.roles SET level = 'space' WHERE level IS NULL;

-- Create index for level lookups
CREATE INDEX IF NOT EXISTS idx_roles_level ON public.roles(level);

-- Add global permissions to permissions table if they don't exist
INSERT INTO public.permissions (name, description, resource, action)
SELECT * FROM (VALUES
  ('system:admin', 'System Administration', 'system', 'admin'),
  ('system:manage_users', 'Manage All Users', 'system', 'manage_users'),
  ('system:manage_spaces', 'Manage All Spaces', 'system', 'manage_spaces'),
  ('system:manage_roles', 'Manage Roles and Permissions', 'system', 'manage_roles'),
  ('system:view_analytics', 'View System Analytics', 'system', 'view_analytics'),
  ('system:manage_settings', 'Manage System Settings', 'system', 'manage_settings')
) AS v(name, description, resource, action)
WHERE NOT EXISTS (
  SELECT 1 FROM public.permissions WHERE name = v.name
);

-- Create default global roles if they don't exist
INSERT INTO public.roles (name, description, level, is_system)
SELECT * FROM (VALUES
  ('SUPER_ADMIN', 'Super Administrator - Full system access', 'global', true),
  ('ADMIN', 'Administrator - System management access', 'global', true),
  ('MANAGER', 'Manager - Limited system management', 'global', true),
  ('USER', 'Regular User - Basic access', 'global', true)
) AS v(name, description, level, is_system)
WHERE NOT EXISTS (
  SELECT 1 FROM public.roles WHERE name = v.name AND level = v.level
);

-- Assign permissions to global roles
-- SUPER_ADMIN gets all global permissions
DO $$
DECLARE
  super_admin_id UUID;
  perm_ids UUID[];
BEGIN
  SELECT id INTO super_admin_id FROM public.roles WHERE name = 'SUPER_ADMIN' AND level = 'global' LIMIT 1;
  
  IF super_admin_id IS NOT NULL THEN
    SELECT ARRAY_AGG(id) INTO perm_ids 
    FROM public.permissions 
    WHERE resource = 'system';
    
    IF perm_ids IS NOT NULL THEN
      INSERT INTO public.role_permissions (role_id, permission_id)
      SELECT super_admin_id, unnest(perm_ids)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
  END IF;
END $$;

-- ADMIN gets most global permissions except system admin
DO $$
DECLARE
  admin_id UUID;
  perm_ids UUID[];
BEGIN
  SELECT id INTO admin_id FROM public.roles WHERE name = 'ADMIN' AND level = 'global' LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    SELECT ARRAY_AGG(id) INTO perm_ids 
    FROM public.permissions 
    WHERE resource = 'system' AND action != 'admin';
    
    IF perm_ids IS NOT NULL THEN
      INSERT INTO public.role_permissions (role_id, permission_id)
      SELECT admin_id, unnest(perm_ids)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
  END IF;
END $$;

-- MANAGER gets limited global permissions
DO $$
DECLARE
  manager_id UUID;
  perm_ids UUID[];
BEGIN
  SELECT id INTO manager_id FROM public.roles WHERE name = 'MANAGER' AND level = 'global' LIMIT 1;
  
  IF manager_id IS NOT NULL THEN
    SELECT ARRAY_AGG(id) INTO perm_ids 
    FROM public.permissions 
    WHERE resource = 'system' AND action IN ('view_analytics', 'manage_spaces');
    
    IF perm_ids IS NOT NULL THEN
      INSERT INTO public.role_permissions (role_id, permission_id)
      SELECT manager_id, unnest(perm_ids)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
  END IF;
END $$;

