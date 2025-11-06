import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { auditLogger } from '@/lib/db-audit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const resourceType = searchParams.get('resourceType')
    const spaceId = searchParams.get('spaceId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const logs = await auditLogger.queryLogs({
      userId: userId || undefined,
      action: action as any,
      resourceType: resourceType || undefined,
      spaceId: spaceId || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset
    })

    const total = await auditLogger.getLogCount({
      userId: userId || undefined,
      action: action as any,
      resourceType: resourceType || undefined,
      spaceId: spaceId || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    })

    return NextResponse.json({
      success: true,
      logs,
      total,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('Error getting audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to get audit logs', details: error.message },
      { status: 500 }
    )
  }
}

