/**
 * User Management Feature Types
 * Centralized type definitions for the users feature
 */

export interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  avatar?: string
  createdAt: Date
  lastLoginAt?: Date
  defaultSpaceId?: string
  spaces: Array<{
    spaceId: string
    spaceName: string
    role: string
  }>
}

export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
}

export interface Role {
  id: string
  name: string
  description: string
  level: 'global' | 'space'
  isSystem: boolean
  permissions: Permission[]
  userCount?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface UserFormData {
  name: string
  email: string
  role: string
  isActive: boolean
  defaultSpaceId?: string
  spaces?: Array<{
    spaceId: string
    role: string
  }>
}

export interface RoleFormData {
  name: string
  description: string
  level: 'global' | 'space'
  permissions: string[]
}

export interface PermissionTestResult {
  hasPermission: boolean
  reason?: string
  userPermissions?: string[]
  rolePermissions?: string[]
}

