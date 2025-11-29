import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\admin\users\export\route.ts')

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const active = searchParams.get('active') || ''
    const spaceId = searchParams.get('spaceId') || ''

    // Build the query with filters
    let whereConditions: string[] = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (role) {
      whereConditions.push(`u.role = $${paramIndex}`)
      queryParams.push(role)
      paramIndex++
    }

    if (active !== '') {
      whereConditions.push(`u.is_active = $${paramIndex}`)
      queryParams.push(active === 'true')
      paramIndex++
    }

    if (spaceId) {
      whereConditions.push(`u.id IN (SELECT user_id FROM space_members WHERE space_id = $${paramIndex}::uuid)`)
      queryParams.push(spaceId)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Get all users (no pagination for export)
    const usersResult = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        u.last_login_at,
        u.default_space_id,
        s.name as default_space_name,
        COALESCE(
          json_agg(
            json_build_object(
              'spaceId', sm.space_id,
              'spaceName', sp.name,
              'role', sm.role
            )
          ) FILTER (WHERE sm.space_id IS NOT NULL),
          '[]'::json
        ) as spaces
      FROM users u
      LEFT JOIN space_members sm ON u.id = sm.user_id
      LEFT JOIN spaces sp ON sm.space_id = sp.id
      LEFT JOIN spaces s ON u.default_space_id = s.id
      ${whereClause}
      GROUP BY u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.last_login_at, u.default_space_id, s.name
      ORDER BY u.created_at DESC
    `, queryParams)

    // Convert to CSV
    const users = usersResult.rows
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Created At', 'Last Login', 'Default Space', 'Space Memberships']
    const csvRows = [headers.join(',')]

    for (const user of users) {
      const spaces = Array.isArray(user.spaces) ? user.spaces : []
      const spaceMemberships = spaces.map((s: any) => `${s.spaceName} (${s.role})`).join('; ')
      
      const row = [
        user.id,
        `"${(user.name || '').replace(/"/g, '""')}"`,
        `"${(user.email || '').replace(/"/g, '""')}"`,
        user.role || '',
        user.is_active ? 'Active' : 'Inactive',
        user.created_at ? new Date(user.created_at).toISOString() : '',
        user.last_login_at ? new Date(user.last_login_at).toISOString() : '',
        user.default_space_name || '',
        `"${spaceMemberships.replace(/"/g, '""')}"`
      ]
      csvRows.push(row.join(','))
    }

    const csv = csvRows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  ,
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET GET /api/admin/users/export')

