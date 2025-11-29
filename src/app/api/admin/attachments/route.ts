import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\admin\attachments\route.ts')

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId') || 'all'
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'all'
    const provider = searchParams.get('provider') || 'all'

    // Build the query with filters
    let whereConditions = ['a.deleted_at IS NULL']
    let queryParams: any[] = []
    let paramIndex = 1

    if (spaceId !== 'all') {
      whereConditions.push(`a.space_id = $${paramIndex}`)
      queryParams.push(spaceId)
      paramIndex++
    }

    if (search) {
      whereConditions.push(`(a.name ILIKE $${paramIndex} OR a.original_name ILIKE $${paramIndex})`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (type !== 'all') {
      if (type === 'image') {
        whereConditions.push(`a.mime_type LIKE 'image/%'`)
      } else if (type === 'video') {
        whereConditions.push(`a.mime_type LIKE 'video/%'`)
      } else if (type === 'audio') {
        whereConditions.push(`a.mime_type LIKE 'audio/%'`)
      } else if (type === 'document') {
        whereConditions.push(`(a.mime_type LIKE 'text/%' OR a.mime_type LIKE 'application/pdf' OR a.mime_type LIKE 'application/msword' OR a.mime_type LIKE 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')`)
      } else if (type === 'archive') {
        whereConditions.push(`(a.mime_type LIKE 'application/zip' OR a.mime_type LIKE 'application/x-rar' OR a.mime_type LIKE 'application/x-7z')`)
      }
    }

    if (provider !== 'all') {
      whereConditions.push(`a.storage_provider = $${paramIndex}`)
      queryParams.push(provider)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    // Get attachments with space and user information
    const attachments = await query(`
      SELECT 
        a.id, a.name, a.original_name, a.size, a.mime_type, a.url, a.thumbnail_url,
        a.is_public, a.space_id, a.entity_id, a.entity_type, a.created_at, a.updated_at,
        a.uploaded_by, a.storage_provider, a.metadata,
        s.name as space_name,
        u.name as uploaded_by_name
      FROM attachments a
      LEFT JOIN spaces s ON a.space_id = s.id
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT 100
    `, queryParams)

    return NextResponse.json({
      attachments: attachments.rows.map(row => ({
        ...row,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }))
    })
  ,
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET GET /api/admin/attachments')
