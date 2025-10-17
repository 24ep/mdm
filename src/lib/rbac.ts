import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'

export const RolePriority: Record<AppRole, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  MANAGER: 2,
  USER: 1,
}

export function hasRole(userRole: string | undefined | null, required: AppRole): boolean {
  if (!userRole) return false
  const current = RolePriority[userRole as AppRole]
  const needed = RolePriority[required]
  if (current === undefined || needed === undefined) return false
  return current >= needed
}

export async function requireRole(
  request: NextRequest,
  required: AppRole
): Promise<NextResponse | null> {
  try {
    console.log('🔍 Checking role requirement:', required);
    const session = await getServerSession(authOptions)
    console.log('Session found:', !!session);
    console.log('User:', session?.user);
    
    const role = session?.user?.role
    console.log('User role:', role);
    console.log('Required role:', required);
    
    if (!role) {
      console.log('❌ No user role found');
      return NextResponse.json({ 
        error: 'Forbidden - No user role found',
        debug: { session: !!session, user: !!session?.user }
      }, { status: 403 })
    }
    
    const hasRequiredRole = hasRole(role, required)
    console.log('Has required role:', hasRequiredRole);
    
    if (!hasRequiredRole) {
      console.log('❌ Insufficient permissions');
      return NextResponse.json({ 
        error: 'Forbidden - Insufficient permissions',
        debug: { userRole: role, requiredRole: required }
      }, { status: 403 })
    }
    
    console.log('✅ Permission granted');
    return null
  } catch (error) {
    console.error('❌ Role check error:', error);
    return NextResponse.json({ 
      error: 'Forbidden - Role check failed',
      details: error.message 
    }, { status: 403 })
  }
}

export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}


