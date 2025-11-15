import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'
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

    const { id } = await params

    // Check if user has access to collection
    const collectionResult = await query(
      `SELECT 
        kc.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar', u.avatar
        ) as creator
      FROM knowledge_collections kc
      LEFT JOIN users u ON u.id = kc.created_by
      WHERE kc.id = $1 AND kc.deleted_at IS NULL`,
      [id]
    )

    if (collectionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    const collection = collectionResult.rows[0]

    // Check if user is member or creator
    const memberCheck = await query(
      `SELECT role FROM knowledge_collection_members
       WHERE collection_id = $1 AND user_id = $2`,
      [id, session.user.id]
    )

    const isCreator = collection.created_by === session.user.id
    const isMember = memberCheck.rows.length > 0

    if (!isCreator && !isMember && collection.is_private) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get members
    const membersResult = await query(
      `SELECT 
        kcm.id,
        kcm.role,
        kcm.created_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar', u.avatar
        ) as user
      FROM knowledge_collection_members kcm
      JOIN users u ON u.id = kcm.user_id
      WHERE kcm.collection_id = $1
      ORDER BY kcm.created_at ASC`,
      [id]
    )

    await logAPIRequest(
      session.user.id,
      'GET',
      `/api/knowledge/collections/${id}`,
      200
    )

    return NextResponse.json({
      collection: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        icon: collection.icon,
        color: collection.color,
        isPrivate: collection.is_private,
        spaceId: collection.space_id,
        createdBy: collection.created_by,
        creator: collection.creator,
        members: membersResult.rows.map((m: any) => ({
          id: m.id,
          role: m.role,
          user: m.user,
          createdAt: m.created_at,
        })),
        createdAt: collection.created_at,
        updatedAt: collection.updated_at,
      },
    })
  } catch (error) {
    console.error('Error fetching collection:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const { id } = await params
    const body = await request.json()
    const { name, description, icon, color, isPrivate } = body

    // Check if user is admin or creator
    const memberCheck = await query(
      `SELECT role FROM knowledge_collection_members
       WHERE collection_id = $1 AND user_id = $2`,
      [id, session.user.id]
    )

    const collectionCheck = await query(
      `SELECT created_by FROM knowledge_collections WHERE id = $1`,
      [id]
    )

    if (collectionCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    const isCreator = collectionCheck.rows[0].created_by === session.user.id
    const isAdmin = memberCheck.rows.length > 0 && memberCheck.rows[0].role === 'admin'

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update collection
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`)
      updateValues.push(name.trim())
      paramIndex++
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`)
      updateValues.push(description?.trim() || null)
      paramIndex++
    }
    if (icon !== undefined) {
      updateFields.push(`icon = $${paramIndex}`)
      updateValues.push(icon || null)
      paramIndex++
    }
    if (color !== undefined) {
      updateFields.push(`color = $${paramIndex}`)
      updateValues.push(color || null)
      paramIndex++
    }
    if (isPrivate !== undefined) {
      updateFields.push(`is_private = $${paramIndex}`)
      updateValues.push(isPrivate)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updateFields.push(`updated_at = NOW()`)
    updateValues.push(id)

    const result = await query(
      `UPDATE knowledge_collections
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      updateValues
    )

    await logAPIRequest(
      session.user.id,
      'PUT',
      `/api/knowledge/collections/${id}`,
      200
    )

    return NextResponse.json({
      collection: result.rows[0],
    })
  } catch (error) {
    console.error('Error updating collection:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const { id } = await params

    // Check if user is admin or creator
    const memberCheck = await query(
      `SELECT role FROM knowledge_collection_members
       WHERE collection_id = $1 AND user_id = $2`,
      [id, session.user.id]
    )

    const collectionCheck = await query(
      `SELECT created_by FROM knowledge_collections WHERE id = $1`,
      [id]
    )

    if (collectionCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    const isCreator = collectionCheck.rows[0].created_by === session.user.id
    const isAdmin = memberCheck.rows.length > 0 && memberCheck.rows[0].role === 'admin'

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete
    await query(
      `UPDATE knowledge_collections
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [id]
    )

    await logAPIRequest(
      session.user.id,
      'DELETE',
      `/api/knowledge/collections/${id}`,
      200
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting collection:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

