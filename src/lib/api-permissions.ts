import { NextRequest, NextResponse } from 'next/server'
import { checkPermission, getUserPermissions, canPerformAction, getUserRoleContext } from '@/lib/permission-checker'

/**
 * Middleware to require a specific permission
 * Returns null if permission is granted, or NextResponse with error if denied
 */
export async function requirePermission(
  request: NextRequest,
  permissionId: string,
  spaceId?: string
): Promise<NextResponse | null> {
  const context = await getUserRoleContext(request, spaceId)
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await checkPermission(context, permissionId)
  if (!result.hasPermission) {
    return NextResponse.json(
      { 
        error: 'Forbidden - Insufficient permissions',
        required: permissionId,
        userRole: context.globalRole,
        spaceRole: context.spaceRole
      },
      { status: 403 }
    )
  }

  return null
}

/**
 * Middleware to require any of the specified permissions
 */
export async function requireAnyPermission(
  request: NextRequest,
  permissionIds: string[],
  spaceId?: string
): Promise<NextResponse | null> {
  const context = await getUserRoleContext(request, spaceId)
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userPermissions = await getUserPermissions(context)
  const hasAny = permissionIds.some(id => userPermissions.includes(id))

  if (!hasAny) {
    return NextResponse.json(
      { 
        error: 'Forbidden - Insufficient permissions',
        required: permissionIds,
        userRole: context.globalRole,
        spaceRole: context.spaceRole
      },
      { status: 403 }
    )
  }

  return null
}

/**
 * Middleware to require all of the specified permissions
 */
export async function requireAllPermissions(
  request: NextRequest,
  permissionIds: string[],
  spaceId?: string
): Promise<NextResponse | null> {
  const context = await getUserRoleContext(request, spaceId)
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userPermissions = await getUserPermissions(context)
  const hasAll = permissionIds.every(id => userPermissions.includes(id))

  if (!hasAll) {
    return NextResponse.json(
      { 
        error: 'Forbidden - Insufficient permissions',
        required: permissionIds,
        userRole: context.globalRole,
        spaceRole: context.spaceRole
      },
      { status: 403 }
    )
  }

  return null
}

/**
 * Middleware to require permission to perform action on resource
 */
export async function requireResourceAction(
  request: NextRequest,
  resource: string,
  action: string,
  spaceId?: string
): Promise<NextResponse | null> {
  const context = await getUserRoleContext(request, spaceId)
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const canPerform = await canPerformAction(context, resource, action)
  if (!canPerform) {
    return NextResponse.json(
      { 
        error: 'Forbidden - Insufficient permissions',
        required: `${resource}:${action}`,
        userRole: context.globalRole,
        spaceRole: context.spaceRole
      },
      { status: 403 }
    )
  }

  return null
}

