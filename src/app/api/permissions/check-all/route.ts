import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPermissions, getUserRoleContext } from '@/lib/permission-checker'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { permissionIds, spaceId } = body

    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      return NextResponse.json({ error: 'permissionIds array is required' }, { status: 400 })
    }

    const context = await getUserRoleContext(request, spaceId)
    if (!context) {
      return NextResponse.json({ error: 'User context not found' }, { status: 404 })
    }

    const userPermissions = await getUserPermissions(context)
    const hasAll = permissionIds.every(id => userPermissions.includes(id))

    return NextResponse.json({
      hasPermission: hasAll,
      source: hasAll ? 'combined' : 'none'
    })
  } catch (error) {
    console.error('Error checking permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}




