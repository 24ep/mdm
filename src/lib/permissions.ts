export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
  level: 'space' | 'model' | 'attribute' | 'record'
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  isSystem: boolean
  level: 'space' | 'global'
}

export interface UserPermissions {
  userId: string
  spaceId?: string
  role: Role
  permissions: Permission[]
  inheritedFrom: string[]
}

// System Permissions
export const SYSTEM_PERMISSIONS: Permission[] = [
  // Space Level
  { id: 'space:view', name: 'View Space', description: 'View space content and data', resource: 'space', action: 'view', level: 'space' },
  { id: 'space:edit', name: 'Edit Space', description: 'Modify space settings and configuration', resource: 'space', action: 'edit', level: 'space' },
  { id: 'space:admin', name: 'Admin Space', description: 'Full administrative access to space', resource: 'space', action: 'admin', level: 'space' },
  { id: 'space:delete', name: 'Delete Space', description: 'Delete space and all its content', resource: 'space', action: 'delete', level: 'space' },
  
  // Model Level
  { id: 'model:view', name: 'View Models', description: 'View data models in space', resource: 'model', action: 'view', level: 'model' },
  { id: 'model:create', name: 'Create Models', description: 'Create new data models', resource: 'model', action: 'create', level: 'model' },
  { id: 'model:edit', name: 'Edit Models', description: 'Modify existing data models', resource: 'model', action: 'edit', level: 'model' },
  { id: 'model:delete', name: 'Delete Models', description: 'Delete data models', resource: 'model', action: 'delete', level: 'model' },
  
  // Attribute Level
  { id: 'attribute:view', name: 'View Attributes', description: 'View model attributes', resource: 'attribute', action: 'view', level: 'attribute' },
  { id: 'attribute:create', name: 'Create Attributes', description: 'Create new attributes', resource: 'attribute', action: 'create', level: 'attribute' },
  { id: 'attribute:edit', name: 'Edit Attributes', description: 'Modify existing attributes', resource: 'attribute', action: 'edit', level: 'attribute' },
  { id: 'attribute:delete', name: 'Delete Attributes', description: 'Delete attributes', resource: 'attribute', action: 'delete', level: 'attribute' },
  
  // Record Level
  { id: 'record:view', name: 'View Records', description: 'View data records', resource: 'record', action: 'view', level: 'record' },
  { id: 'record:create', name: 'Create Records', description: 'Create new data records', resource: 'record', action: 'create', level: 'record' },
  { id: 'record:edit', name: 'Edit Records', description: 'Modify existing records', resource: 'record', action: 'edit', level: 'record' },
  { id: 'record:delete', name: 'Delete Records', description: 'Delete data records', resource: 'record', action: 'delete', level: 'record' },
  
  // Bulk Operations
  { id: 'bulk:import', name: 'Bulk Import', description: 'Import data in bulk', resource: 'bulk', action: 'import', level: 'record' },
  { id: 'bulk:export', name: 'Bulk Export', description: 'Export data in bulk', resource: 'bulk', action: 'export', level: 'record' },
  { id: 'bulk:edit', name: 'Bulk Edit', description: 'Edit multiple records at once', resource: 'bulk', action: 'edit', level: 'record' },
  { id: 'bulk:delete', name: 'Bulk Delete', description: 'Delete multiple records at once', resource: 'bulk', action: 'delete', level: 'record' },
  
  // User Management
  { id: 'user:invite', name: 'Invite Users', description: 'Invite users to space', resource: 'user', action: 'invite', level: 'space' },
  { id: 'user:manage', name: 'Manage Users', description: 'Manage user roles and permissions', resource: 'user', action: 'manage', level: 'space' },
  
  // Workflows
  { id: 'workflow:view', name: 'View Workflows', description: 'View workflow definitions', resource: 'workflow', action: 'view', level: 'space' },
  { id: 'workflow:create', name: 'Create Workflows', description: 'Create new workflows', resource: 'workflow', action: 'create', level: 'space' },
  { id: 'workflow:edit', name: 'Edit Workflows', description: 'Modify existing workflows', resource: 'workflow', action: 'edit', level: 'space' },
  { id: 'workflow:execute', name: 'Execute Workflows', description: 'Execute workflow instances', resource: 'workflow', action: 'execute', level: 'space' },
]

// System Roles
export const SYSTEM_ROLES: Role[] = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Full access to everything',
    permissions: SYSTEM_PERMISSIONS,
    isSystem: true,
    level: 'space'
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access except space deletion',
    permissions: SYSTEM_PERMISSIONS.filter(p => p.id !== 'space:delete'),
    isSystem: true,
    level: 'space'
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Can create, edit, and view content',
    permissions: SYSTEM_PERMISSIONS.filter(p => 
      ['model:view', 'model:create', 'model:edit', 'attribute:view', 'attribute:create', 'attribute:edit', 'record:view', 'record:create', 'record:edit', 'bulk:import', 'bulk:export', 'bulk:edit'].includes(p.id)
    ),
    isSystem: true,
    level: 'space'
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access',
    permissions: SYSTEM_PERMISSIONS.filter(p => p.action === 'view'),
    isSystem: true,
    level: 'space'
  },
  {
    id: 'contributor',
    name: 'Contributor',
    description: 'Can create and edit records, view models',
    permissions: SYSTEM_PERMISSIONS.filter(p => 
      ['model:view', 'attribute:view', 'record:view', 'record:create', 'record:edit', 'bulk:export'].includes(p.id)
    ),
    isSystem: true,
    level: 'space'
  }
]

export class PermissionManager {
  private permissions: Permission[]
  private roles: Role[]

  constructor() {
    this.permissions = SYSTEM_PERMISSIONS
    this.roles = SYSTEM_ROLES
  }

  hasPermission(userPermissions: UserPermissions, permissionId: string): boolean {
    return userPermissions.permissions.some(p => p.id === permissionId)
  }

  hasAnyPermission(userPermissions: UserPermissions, permissionIds: string[]): boolean {
    return permissionIds.some(id => this.hasPermission(userPermissions, id))
  }

  hasAllPermissions(userPermissions: UserPermissions, permissionIds: string[]): boolean {
    return permissionIds.every(id => this.hasPermission(userPermissions, id))
  }

  canAccessResource(userPermissions: UserPermissions, resource: string, action: string): boolean {
    return userPermissions.permissions.some(p => p.resource === resource && p.action === action)
  }

  getEffectivePermissions(userPermissions: UserPermissions): Permission[] {
    return userPermissions.permissions
  }

  getRolePermissions(roleId: string): Permission[] {
    const role = this.roles.find(r => r.id === roleId)
    return role?.permissions || []
  }

  createCustomRole(name: string, description: string, permissions: string[], level: 'space' | 'global'): Role {
    const rolePermissions = this.permissions.filter(p => permissions.includes(p.id))
    return {
      id: `custom_${Date.now()}`,
      name,
      description,
      permissions: rolePermissions,
      isSystem: false,
      level
    }
  }

  validatePermissionHierarchy(permissions: string[]): boolean {
    // Check if user has required permissions for their role level
    const hasSpaceAdmin = permissions.includes('space:admin')
    const hasModelEdit = permissions.includes('model:edit')
    const hasAttributeEdit = permissions.includes('attribute:edit')
    
    // If user has attribute edit, they should have model edit
    if (hasAttributeEdit && !hasModelEdit) {
      return false
    }
    
    // If user has model edit, they should have space view
    if (hasModelEdit && !permissions.includes('space:view')) {
      return false
    }
    
    return true
  }
}

export const permissionManager = new PermissionManager()
