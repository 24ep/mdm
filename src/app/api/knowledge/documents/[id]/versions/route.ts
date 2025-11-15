import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { applyRateLimit } from '@/app/api/v1/middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: documentId } = await params

    // Check document access
    const docResult = await query(
      `SELECT kd.collection_id, kd.is_public, kc.is_private, kc.created_by as collection_created_by
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

    // Get versions
    const versionsResult = await query(
      `SELECT 
        kdv.id,
        kdv.title,
        kdv.content,
        kdv.content_html,
        kdv.created_by,
        kdv.created_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar', u.avatar
        ) as creator
      FROM knowledge_document_versions kdv
      LEFT JOIN users u ON u.id = kdv.created_by
      WHERE kdv.document_id = $1
      ORDER BY kdv.created_at DESC
      LIMIT 50`,
      [documentId]
    )

    return NextResponse.json({
      versions: versionsResult.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        contentHtml: row.content_html,
        createdBy: row.created_by,
        creator: row.creator,
        createdAt: row.created_at,
      })),
    })
  } catch (error) {
    console.error('Error fetching versions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

