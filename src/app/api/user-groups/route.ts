import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/user-groups - List all active groups for selection
async function getHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response

  try {
    const groups = await db.userGroup.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
    })

    return NextResponse.json({ groups })
  } catch (error) {
    console.error('Error loading user groups:', error)
    return NextResponse.json(
      { error: 'Failed to load user groups' },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/user-groups')
