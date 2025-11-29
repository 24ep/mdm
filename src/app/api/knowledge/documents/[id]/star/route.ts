import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { applyRateLimit } from '@/app/api/v1/middleware'

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

    // Check if already starred
    const existing = await query(
      `SELECT id FROM knowledge_stars WHERE document_id = $1 AND user_id = $2`,
      [documentId, session.user.id]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json({ starred: true })
    }

    // Create star
    await query(
      `INSERT INTO knowledge_stars (id, document_id, user_id, created_at)
       VALUES (gen_random_uuid(), $1, $2, NOW())`,
      [documentId, session.user.id]
    )

    return NextResponse.json({ starred: true })
}

export const POST = withErrorHandling(postHandler, 'POST /api/knowledge/documents/[id]/star')

async function deleteHandler(
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

  await query(
    `DELETE FROM knowledge_stars WHERE document_id = $1 AND user_id = $2`,
    [documentId, session.user.id]
  )

  return NextResponse.json({ starred: false })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/knowledge/documents/[id]/star')

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

  const result = await query(
    `SELECT id FROM knowledge_stars WHERE document_id = $1 AND user_id = $2`,
    [documentId, session.user.id]
  )

  return NextResponse.json({ starred: result.rows.length > 0 })
}

export const GET = withErrorHandling(getHandler, 'GET /api/knowledge/documents/[id]/star')

