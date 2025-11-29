import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { applyRateLimit } from '@/app/api/v1/middleware'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id: documentId, versionId } = await params

    // Get current document
    const docResult = await query(
      `SELECT kd.*, kc.is_private, kc.created_by as collection_created_by
       FROM knowledge_documents kd
       JOIN knowledge_collections kc ON kc.id = kd.collection_id
       WHERE kd.id = $1 AND kd.deleted_at IS NULL`,
      [documentId]
    )

    if (docResult.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const doc = docResult.rows[0]

    // Check access
    const memberCheck = await query(
      `SELECT role FROM knowledge_collection_members
       WHERE collection_id = $1 AND user_id = $2`,
      [doc.collection_id, session.user.id]
    )

    const isCollectionCreator = doc.collection_created_by === session.user.id
    const isMember = memberCheck.rows.length > 0
    const isPublic = doc.is_public

    if (!isCollectionCreator && !isMember && doc.is_private && !isPublic) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get version
    const versionResult = await query(
      `SELECT * FROM knowledge_document_versions WHERE id = $1`,
      [versionId]
    )

    if (versionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    const version = versionResult.rows[0]

    // Simple diff (line-by-line comparison)
    const currentLines = doc.content.split('\n')
    const versionLines = version.content.split('\n')
    
    const diff: Array<{
      line: number
      type: 'added' | 'removed' | 'unchanged'
      content: string
    }> = []

    const maxLines = Math.max(currentLines.length, versionLines.length)
    for (let i = 0; i < maxLines; i++) {
      const currentLine = currentLines[i] || ''
      const versionLine = versionLines[i] || ''

      if (currentLine === versionLine) {
        diff.push({ line: i + 1, type: 'unchanged', content: currentLine })
      } else {
        if (versionLine && currentLine !== versionLine) {
          diff.push({ line: i + 1, type: 'removed', content: versionLine })
        }
        if (currentLine && currentLine !== versionLine) {
          diff.push({ line: i + 1, type: 'added', content: currentLine })
        }
      }
    }

    return NextResponse.json({
      current: {
        title: doc.title,
        content: doc.content,
        updatedAt: doc.updated_at,
      },
      version: {
        title: version.title,
        content: version.content,
        createdAt: version.created_at,
      },
      diff,
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/knowledge/documents/[id]/versions/[versionId]/compare')

