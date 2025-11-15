import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export interface PermissionCheckOptions {
  resource: string
  action: string
  spaceId?: string | null
  resourceId?: string
}

export interface PermissionResult {
  allowed: boolean
  reason?: string
}

/**
 * Check if user has permission to perform an action on a resource
 */
export async function checkPermission(
  options: PermissionCheckOptions
): Promise<PermissionResult> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return { allowed: false, reason: 'Not authenticated' }
  }

  // Admin users have all permissions
  if (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') {
    return { allowed: true }
  }

  const { resource, action, spaceId } = options
  const userId = session.user.id

  try {
    // Check if user has permission via role
    const permissionId = `${resource}:${action}`
    
    // Check global role permissions
    // Note: Assuming user.role is a string that matches role.name
    const globalRoleCheck = await query(
      `SELECT rp.permission_id
       FROM users u
       JOIN roles r ON r.name = u.role
       JOIN role_permissions rp ON rp.role_id = r.id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE u.id = $1 
       AND (p.name = $2 OR (p.resource = $3 AND p.action = $4))
       LIMIT 1`,
      [userId, permissionId, resource, action]
    )

    if (globalRoleCheck.rows.length > 0) {
      return { allowed: true }
    }

    // If spaceId is provided, check space-level permissions
    if (spaceId) {
      // Check if user is a member of the space
      const spaceMemberCheck = await query(
        `SELECT sm.role
         FROM space_members sm
         WHERE sm.user_id = $1 AND sm.space_id = $2
         LIMIT 1`,
        [userId, spaceId]
      )

      if (spaceMemberCheck.rows.length === 0) {
        return { allowed: false, reason: 'User is not a member of this space' }
      }

      const spaceRole = spaceMemberCheck.rows[0].role

      // Check space role permissions
      // Note: Space roles are stored as strings in space_members.role
      // They may or may not have corresponding Role entries
      const spaceRoleCheck = await query(
        `SELECT rp.permission_id
         FROM roles r
         JOIN role_permissions rp ON rp.role_id = r.id
         JOIN permissions p ON p.id = rp.permission_id
         WHERE r.name = $1
         AND (p.name = $2 OR (p.resource = $3 AND p.action = $4))
         LIMIT 1`,
        [spaceRole, permissionId, resource, action]
      )

      if (spaceRoleCheck.rows.length > 0) {
        return { allowed: true }
      }

      // Note: Custom permissions via member_permissions table would go here
      // if that table exists in the schema. For now, we rely on role-based permissions.
    }

    // Default: deny if no permission found
    return { allowed: false, reason: 'Insufficient permissions' }
  } catch (error) {
    console.error('Error checking permission:', error)
    // Fail secure: deny on error
    return { allowed: false, reason: 'Error checking permissions' }
  }
}

/**
 * Check if user has permission to access a space
 */
export async function checkSpacePermission(
  spaceId: string,
  userId: string
): Promise<boolean> {
  try {
    // Check if user is a member of the space or is the creator
    const result = await query(
      `SELECT 1
       FROM spaces s
       LEFT JOIN space_members sm ON sm.space_id = s.id AND sm.user_id = $1
       WHERE s.id = $2 
       AND (s.created_by = $1 OR sm.user_id IS NOT NULL)
       AND s.deleted_at IS NULL
       LIMIT 1`,
      [userId, spaceId]
    )

    return result.rows.length > 0
  } catch (error) {
    console.error('Error checking space permission:', error)
    return false
  }
}

/**
 * Check if user can perform action on resource in space
 */
export async function checkSpaceResourcePermission(
  spaceId: string,
  resource: string,
  action: string,
  userId: string
): Promise<boolean> {
  const result = await checkPermission({
    resource,
    action,
    spaceId,
  })

  return result.allowed
}

