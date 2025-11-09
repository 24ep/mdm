/**
 * Unified Permissions System
 * Centralized exports for all permission-related utilities
 */

// Re-export RBAC utilities
export { requireAuth, requireRole, hasRole } from '../rbac'

// Re-export API permission middleware
export { requirePermission, requireAnyPermission } from '../api-permissions'

// Re-export permission checker utilities
export { 
  checkPermission, 
  getUserPermissions, 
  canPerformAction, 
  getUserRoleContext 
} from '../permission-checker'

// Re-export permission types if needed
export type { AppRole } from '../rbac'

