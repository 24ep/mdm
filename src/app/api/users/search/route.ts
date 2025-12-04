import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available


    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const spaceId = searchParams.get('spaceId')

    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] })
    }

    let whereClause = `WHERE u.is_active = true AND (u.name ILIKE $1 OR u.email ILIKE $1)`
    let params = [`%${q}%`]
    let paramIndex = 2

    // If spaceId is provided, exclude users who are already members of that space
    if (spaceId) {
      whereClause += ` AND u.id NOT IN (
        SELECT user_id FROM space_members WHERE space_id = $${paramIndex}
      )`
      params.push(spaceId)
      paramIndex++
    }

    const users = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.avatar,
        u.role as system_role
      FROM users u
      ${whereClause}
      ORDER BY 
        CASE WHEN u.name ILIKE $1 THEN 1 ELSE 2 END,
        u.name ASC
      LIMIT 10
    `, params)

    return NextResponse.json({
      users: users.rows
    })
  ,
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET GET /api/users/search')


export const GET = withErrorHandling(getHandler, 'GET GET /api/users\search\route.ts')