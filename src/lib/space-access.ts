/**
 * Space Access Utilities
 * Shared utilities for checking user access to spaces
 */

import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { addSecurityHeaders } from './security-headers'

/**
 * Check if user has access to a space
 * Returns true if user is a member or owner of the space
 * 
 * @param spaceId - The space ID to check
 * @param userId - The user ID to check access for
 * @returns Promise<boolean> - True if user has access
 */
export async function checkSpaceAccess(spaceId: string, userId: string): Promise<boolean> {
  // Check if user is a space member
  const spaceMember = await db.spaceMember.findFirst({
    where: {
      spaceId,
      userId,
    },
  })

  // Check if user is the space owner
  const space = await db.space.findFirst({
    where: {
      id: spaceId,
      createdBy: userId,
    },
    select: {
      id: true,
    },
  })

  return !!spaceMember || !!space
}

/**
 * Require space access - throws or returns error response if user doesn't have access
 * 
 * @param spaceId - The space ID to check
 * @param userId - The user ID to check access for
 * @param errorMessage - Optional custom error message
 * @returns Promise<{ success: true } | { success: false; response: NextResponse }>
 */
export async function requireSpaceAccess(
  spaceId: string,
  userId: string,
  errorMessage: string = 'Forbidden: Not a member or owner of the space'
): Promise<
  | { success: true }
  | { success: false; response: NextResponse }
> {
  const hasAccess = await checkSpaceAccess(spaceId, userId)

  if (!hasAccess) {
    return {
      success: false,
      response: addSecurityHeaders(
        NextResponse.json({ error: errorMessage }, { status: 403 })
      ),
    }
  }

  return { success: true }
}

/**
 * Check if user has access to a space via a project
 * First gets the project's space, then checks access to that space
 * 
 * @param projectId - The project ID
 * @param userId - The user ID to check access for
 * @returns Promise<{ success: true; spaceId: string } | { success: false; response: NextResponse }>
 */
export async function requireProjectSpaceAccess(
  projectId: string,
  userId: string
): Promise<
  | { success: true; spaceId: string }
  | { success: false; response: NextResponse }
> {
  // Get the project's space
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { spaceId: true },
  })

  if (!project) {
    return {
      success: false,
      response: addSecurityHeaders(
        NextResponse.json({ error: 'Project not found' }, { status: 404 })
      ),
    }
  }

  // Check access to the space
  const accessResult = await requireSpaceAccess(
    project.spaceId,
    userId,
    'Forbidden: Not a member or owner of the project\'s space'
  )

  if (!accessResult.success) {
    return accessResult
  }

  return { success: true, spaceId: project.spaceId }
}

/**
 * Check if user has access to any of multiple spaces
 * Useful for resources that can belong to multiple spaces (e.g., tickets)
 * 
 * @param spaceIds - Array of space IDs to check
 * @param userId - The user ID to check access for
 * @returns Promise<boolean> - True if user has access to at least one space
 */
export async function checkAnySpaceAccess(
  spaceIds: string[],
  userId: string
): Promise<boolean> {
  if (spaceIds.length === 0) return false

  // Check all spaces in parallel
  const accessChecks = await Promise.all(
    spaceIds.map(spaceId => checkSpaceAccess(spaceId, userId))
  )

  // Return true if user has access to any space
  return accessChecks.some(hasAccess => hasAccess)
}

/**
 * Require access to at least one of multiple spaces
 * 
 * @param spaceIds - Array of space IDs to check
 * @param userId - The user ID to check access for
 * @param errorMessage - Optional custom error message
 * @returns Promise<{ success: true } | { success: false; response: NextResponse }>
 */
export async function requireAnySpaceAccess(
  spaceIds: string[],
  userId: string,
  errorMessage: string = 'Access denied'
): Promise<
  | { success: true }
  | { success: false; response: NextResponse }
> {
  const hasAccess = await checkAnySpaceAccess(spaceIds, userId)

  if (!hasAccess) {
    return {
      success: false,
      response: addSecurityHeaders(
        NextResponse.json({ error: errorMessage }, { status: 403 })
      ),
    }
  }

  return { success: true }
}

