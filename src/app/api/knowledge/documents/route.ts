import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { applyRateLimit } from '@/app/api/v1/middleware'
import { parsePaginationParams, createPaginationResponse } from '@/shared/lib/api/pagination'
import { parseSortParams, buildOrderByClause } from '@/shared/lib/api/sorting'
import { buildSearchClause } from '@/shared/lib/api/filtering'

export async function GET(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const collectionId = searchParams.get('collectionId')
    const parentId = searchParams.get('parentId')
    const searchQuery = searchParams.get('search')

    const { page, limit, offset } = parsePaginationParams(request)
    const { sortBy, sortOrder } = parseSortParams(request)

    if (!collectionId) {
      return NextResponse.json(
        { error: 'collectionId is required' },
        { status: 400 }
      )
    }

    // Check if user has access to collection
    const memberCheck = await query(
      `SELECT role FROM knowledge_collection_members
       WHERE collection_id = $1 AND user_id = $2`,
      [collectionId, session.user.id]
    )

    const collectionCheck = await query(
      `SELECT created_by, is_private FROM knowledge_collections WHERE id = $1 AND deleted_at IS NULL`,
      [collectionId]
    )

    if (collectionCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    const collection = collectionCheck.rows[0]
    const isCreator = collection.created_by === session.user.id
    const isMember = memberCheck.rows.length > 0

    if (!isCreator && !isMember && collection.is_private) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build query
    let whereConditions = ['kd.deleted_at IS NULL', 'kd.collection_id = $1']
    const queryParams: any[] = [collectionId]
    let paramIndex = 2

    if (parentId) {
      whereConditions.push(`kd.parent_id = $${paramIndex}`)
      queryParams.push(parentId)
      paramIndex++
    } else {
      whereConditions.push('kd.parent_id IS NULL')
    }

    // Search
    if (searchQuery) {
      const searchClause = buildSearchClause(searchQuery, ['kd.title', 'kd.content'], '')
      if (searchClause.clause) {
        const searchConditions = searchClause.clause.replace('WHERE', 'AND')
        whereConditions.push(searchConditions)
        queryParams.push(...searchClause.params)
        paramIndex += searchClause.params.length
      }
    }

    const whereClause = whereConditions.join(' AND ')

    // Get documents
    const documentsQuery = `
      SELECT 
        kd.id,
        kd.title,
        kd.content,
        kd.content_html,
        kd.parent_id,
        kd.is_template,
        kd.is_public,
        kd.is_pinned,
        kd.published_at,
        kd.archived_at,
        kd.order,
        kd.created_by,
        kd.updated_by,
        kd.created_at,
        kd.updated_at,
        json_build_object(
          'id', u1.id,
          'name', u1.name,
          'email', u1.email,
          'avatar', u1.avatar
        ) as creator,
        json_build_object(
          'id', u2.id,
          'name', u2.name,
          'email', u2.email,
          'avatar', u2.avatar
        ) as updater,
        (
          SELECT COUNT(*)::int
          FROM knowledge_documents kd2
          WHERE kd2.parent_id = kd.id
          AND kd2.deleted_at IS NULL
        ) as child_count
      FROM knowledge_documents kd
      LEFT JOIN users u1 ON u1.id = kd.created_by
      LEFT JOIN users u2 ON u2.id = kd.updated_by
      WHERE ${whereClause}
      ${buildOrderByClause(sortBy, sortOrder, { field: 'order', order: 'asc' })}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    queryParams.push(limit, offset)

    const documentsResult = await query(documentsQuery, queryParams)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM knowledge_documents kd
      WHERE ${whereClause}
    `
    const countResult = await query(countQuery, queryParams.slice(0, -2))
    const total = parseInt(countResult.rows[0]?.total || '0')

    const documents = documentsResult.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      contentHtml: row.content_html,
      parentId: row.parent_id,
      isTemplate: row.is_template,
      isPublic: row.is_public,
      isPinned: row.is_pinned,
      publishedAt: row.published_at,
      archivedAt: row.archived_at,
      order: row.order,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      creator: row.creator,
      updater: row.updater,
      childCount: row.child_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    await logAPIRequest(
      session.user.id,
      'GET',
      '/api/knowledge/documents',
      200
    )

    const response = createPaginationResponse(documents, total, page, limit)
    return NextResponse.json({
      documents: response.data,
      ...response,
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { collectionId, title, content, contentHtml, parentId, isTemplate, isPublic, isPinned, order } = body

    if (!collectionId || !title || !title.trim()) {
      return NextResponse.json(
        { error: 'collectionId and title are required' },
        { status: 400 }
      )
    }

    // Check if user has write access to collection
    const memberCheck = await query(
      `SELECT role FROM knowledge_collection_members
       WHERE collection_id = $1 AND user_id = $2`,
      [collectionId, session.user.id]
    )

    const collectionCheck = await query(
      `SELECT created_by, is_private FROM knowledge_collections WHERE id = $1 AND deleted_at IS NULL`,
      [collectionId]
    )

    if (collectionCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    const collection = collectionCheck.rows[0]
    const isCreator = collection.created_by === session.user.id
    const isEditor = memberCheck.rows.length > 0 && ['admin', 'editor'].includes(memberCheck.rows[0].role)

    if (!isCreator && !isEditor && collection.is_private) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get max order for parent
    let documentOrder = order
    if (!documentOrder && parentId) {
      const orderResult = await query(
        `SELECT COALESCE(MAX("order"), 0) + 1 as next_order
         FROM knowledge_documents
         WHERE collection_id = $1 AND parent_id = $2 AND deleted_at IS NULL`,
        [collectionId, parentId]
      )
      documentOrder = orderResult.rows[0]?.next_order || 0
    } else if (!documentOrder) {
      const orderResult = await query(
        `SELECT COALESCE(MAX("order"), 0) + 1 as next_order
         FROM knowledge_documents
         WHERE collection_id = $1 AND parent_id IS NULL AND deleted_at IS NULL`,
        [collectionId]
      )
      documentOrder = orderResult.rows[0]?.next_order || 0
    }

    // Create document
    const result = await query(
      `INSERT INTO knowledge_documents (
        id, collection_id, title, content, content_html, parent_id, is_template,
        is_public, is_pinned, "order", created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      ) RETURNING *`,
      [
        collectionId,
        title.trim(),
        content || '',
        contentHtml || null,
        parentId || null,
        isTemplate || false,
        isPublic || false,
        isPinned || false,
        documentOrder,
        session.user.id,
      ]
    )

    const document = result.rows[0]

    // Create initial version
    await query(
      `INSERT INTO knowledge_document_versions (
        id, document_id, title, content, content_html, created_by, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, NOW()
      )`,
      [
        document.id,
        document.title,
        document.content,
        document.content_html,
        session.user.id,
      ]
    )

    await logAPIRequest(
      session.user.id,
      'POST',
      '/api/knowledge/documents',
      201
    )

    return NextResponse.json({
      document: {
        id: document.id,
        title: document.title,
        content: document.content,
        contentHtml: document.content_html,
        parentId: document.parent_id,
        isTemplate: document.is_template,
        isPublic: document.is_public,
        isPinned: document.is_pinned,
        order: document.order,
        createdBy: document.created_by,
        createdAt: document.created_at,
        updatedAt: document.updated_at,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

