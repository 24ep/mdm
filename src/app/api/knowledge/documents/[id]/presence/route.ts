import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { applyRateLimit } from '@/app/api/v1/middleware'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id: documentId } = await params

    // Get all active presence (last seen within 30 seconds)
    const presenceResult = await query(
      `SELECT 
        kp.id,
        kp.user_id,
        kp.cursor,
        kp.selection,
        kp.last_seen,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar', u.avatar
        ) as user
      FROM knowledge_presence kp
      JOIN users u ON u.id = kp.user_id
      WHERE kp.document_id = $1
      AND kp.last_seen > NOW() - INTERVAL '30 seconds'
      ORDER BY kp.last_seen DESC`,
      [documentId]
    )

    return NextResponse.json({
      presence: presenceResult.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        user: row.user,
        cursor: row.cursor,
        selection: row.selection,
        lastSeen: row.last_seen,
      })),
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/knowledge/documents/[id]/presence')

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id: documentId } = await params
    const body = await request.json()
    const { cursor, selection } = body

    // Upsert presence
    await query(
      `INSERT INTO knowledge_presence (id, document_id, user_id, cursor, selection, last_seen)
       VALUES (gen_random_uuid(), $1, $2, $3::jsonb, $4::jsonb, NOW())
       ON CONFLICT (document_id, user_id)
       DO UPDATE SET
         cursor = EXCLUDED.cursor,
         selection = EXCLUDED.selection,
         last_seen = NOW()`,
      [documentId, session.user.id, cursor ? JSON.stringify(cursor) : null, selection ? JSON.stringify(selection) : null]
    )

    return NextResponse.json({ success: true })
}

export const POST = withErrorHandling(postHandler, 'POST /api/knowledge/documents/[id]/presence')

