/**
 * Helper function to create audit context from request and session
 */

import { NextRequest } from 'next/server'
import { SecretAuditContext } from './secrets-manager'

interface User {
  id: string
  name?: string | null
  email?: string | null
}

export function createAuditContext(
  request: NextRequest,
  user: User | null | undefined,
  reason?: string
): SecretAuditContext | undefined {
  if (!user) return undefined

  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  return {
    userId: user.id,
    userName: user.name || undefined,
    userEmail: user.email || undefined,
    ipAddress,
    userAgent,
    reason,
  }
}

