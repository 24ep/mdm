import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { applyRateLimit } from '@/app/api/v1/middleware'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
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

    const { id: documentId, commentId } = await params

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

    // Check access
    const memberCheck = await query(
      `SELECT role FROM knowledge_collection_members
       WHERE collection_id = $1 AND user_id = $2`,
      [doc.collection_id, session.user.id]
    )

    const isCollectionCreator = doc.collection_created_by === session.user.id
    const isMember = memberCheck.rows.length > 0

    if (!isCollectionCreator && !isMember && doc.is_private) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Resolve comment
    await query(
      `UPDATE knowledge_comments
       SET resolved_at = NOW(), resolved_by = $1, updated_at = NOW()
       WHERE id = $2 AND document_id = $3`,
      [session.user.id, commentId, documentId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resolving comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
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

    const { id: documentId, commentId } = await params

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

    // Check access
    const memberCheck = await query(
      `SELECT role FROM knowledge_collection_members
       WHERE collection_id = $1 AND user_id = $2`,
      [doc.collection_id, session.user.id]
    )

    const isCollectionCreator = doc.collection_created_by === session.user.id
    const isMember = memberCheck.rows.length > 0

    if (!isCollectionCreator && !isMember && doc.is_private) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Unresolve comment
    await query(
      `UPDATE knowledge_comments
       SET resolved_at = NULL, resolved_by = NULL, updated_at = NOW()
       WHERE id = $1 AND document_id = $2`,
      [commentId, documentId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unresolving comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

