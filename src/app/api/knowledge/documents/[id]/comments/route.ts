import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { applyRateLimit } from '@/app/api/v1/middleware'
import { NotificationService } from '@/lib/notification-service'

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

    // Get comments (threaded)
    const commentsResult = await query(
      `SELECT 
        kc.id,
        kc.parent_id,
        kc.content,
        kc.content_html,
        kc.resolved_at,
        kc.resolved_by,
        kc.created_by,
        kc.created_at,
        kc.updated_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar', u.avatar
        ) as creator,
        json_build_object(
          'id', u2.id,
          'name', u2.name,
          'email', u2.email,
          'avatar', u2.avatar
        ) as resolver
      FROM knowledge_comments kc
      LEFT JOIN users u ON u.id = kc.created_by
      LEFT JOIN users u2 ON u2.id = kc.resolved_by
      WHERE kc.document_id = $1 AND kc.deleted_at IS NULL
      ORDER BY kc.created_at ASC`,
      [documentId]
    )

    // Build threaded structure
    const commentsMap = new Map()
    const rootComments: any[] = []

    commentsResult.rows.forEach((comment: any) => {
      const commentData = {
        id: comment.id,
        parentId: comment.parent_id,
        content: comment.content,
        contentHtml: comment.content_html,
        resolvedAt: comment.resolved_at,
        resolvedBy: comment.resolved_by,
        createdBy: comment.created_by,
        creator: comment.creator,
        resolver: comment.resolver,
        replies: [],
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
      }

      commentsMap.set(comment.id, commentData)

      if (comment.parent_id) {
        const parent = commentsMap.get(comment.parent_id)
        if (parent) {
          parent.replies.push(commentData)
        }
      } else {
        rootComments.push(commentData)
      }
    })

    await logAPIRequest(
      session.user.id,
      'GET',
      `/api/knowledge/documents/${documentId}/comments`,
      200
    )

    return NextResponse.json({
      comments: rootComments,
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const body = await request.json()
    const { content, contentHtml, parentId } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

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

    // Create comment
    const result = await query(
      `INSERT INTO knowledge_comments (
        id, document_id, parent_id, content, content_html, created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()
      ) RETURNING *`,
      [
        documentId,
        parentId || null,
        content.trim(),
        contentHtml || null,
        session.user.id,
      ]
    )

    const comment = result.rows[0]

    // Get creator info
    const creatorResult = await query(
      `SELECT id, name, email, avatar FROM users WHERE id = $1`,
      [session.user.id]
    )

    // Send notification if replying to a comment
    if (parentId) {
      const parentCommentResult = await query(
        `SELECT created_by FROM knowledge_comments WHERE id = $1`,
        [parentId]
      )

      if (parentCommentResult.rows.length > 0 && parentCommentResult.rows[0].created_by !== session.user.id) {
        const notificationService = NotificationService.getInstance()
        await notificationService.createNotification(
          parentCommentResult.rows[0].created_by,
          'INFO',
          'New reply to your comment',
          `${session.user.name} replied to your comment`,
          'MEDIUM',
          {
            documentId,
            commentId: comment.id,
            parentCommentId: parentId,
          },
          `/knowledge/documents/${documentId}?comment=${comment.id}`
        )
      }
    }

    await logAPIRequest(
      session.user.id,
      'POST',
      `/api/knowledge/documents/${documentId}/comments`,
      201
    )

    return NextResponse.json({
      comment: {
        id: comment.id,
        documentId: comment.document_id,
        parentId: comment.parent_id,
        content: comment.content,
        contentHtml: comment.content_html,
        createdBy: comment.created_by,
        creator: creatorResult.rows[0],
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

