import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { applyRateLimit } from '@/app/api/v1/middleware'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: documentId, versionId } = await params

    // Check document access
    const docResult = await query(
      `SELECT kd.collection_id, kc.is_private, kc.created_by as collection_created_by
       FROM knowledge_documents kd
       JOIN knowledge_collections kc ON kc.id = kd.collection_id
       WHERE kd.id = $1 AND kd.deleted_at IS NULL`,
      [documentId]
    )

    if (docResult.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const doc = docResult.rows[0]

    // Check write access
    const memberCheck = await query(
      `SELECT role FROM knowledge_collection_members
       WHERE collection_id = $1 AND user_id = $2`,
      [doc.collection_id, session.user.id]
    )

    const isCollectionCreator = doc.collection_created_by === session.user.id
    const isEditor = memberCheck.rows.length > 0 && ['admin', 'editor'].includes(memberCheck.rows[0].role)

    if (!isCollectionCreator && !isEditor && doc.is_private) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get version
    const versionResult = await query(
      `SELECT title, content, content_html FROM knowledge_document_versions WHERE id = $1`,
      [versionId]
    )

    if (versionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    const version = versionResult.rows[0]

    // Restore document to this version
    await query(
      `UPDATE knowledge_documents
       SET title = $1, content = $2, content_html = $3, updated_by = $4, updated_at = NOW()
       WHERE id = $5`,
      [version.title, version.content, version.content_html, session.user.id, documentId]
    )

    // Create new version for the restore
    await query(
      `INSERT INTO knowledge_document_versions (
        id, document_id, title, content, content_html, created_by, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, NOW()
      )`,
      [documentId, version.title, version.content, version.content_html, session.user.id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error restoring version:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

