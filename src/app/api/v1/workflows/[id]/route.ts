import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const result = await query(
      `SELECT 
        w.*,
        json_build_object(
          'id', s.id,
          'name', s.name,
          'slug', s.slug
        ) as space
      FROM workflows w
      LEFT JOIN spaces s ON s.id = w.space_id
      WHERE w.id = $1 AND w.deleted_at IS NULL`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    const row = result.rows[0]
    const workflow = {
      id: row.id,
      name: row.name,
      description: row.description,
      spaceId: row.space_id,
      space: row.space,
      status: row.status,
      steps: row.steps,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }

    await logAPIRequest(
      session.user.id,
      'GET',
      `/api/v1/workflows/${id}`,
      200
    )

    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('Error fetching workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    const permission = await checkPermission({
      resource: 'workflows',
      action: 'update',
      resourceId: id,
    })

    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', reason: permission.reason },
        { status: 403 }
      )
    }

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex}`)
      values.push(body.name)
      paramIndex++
    }
    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex}`)
      values.push(body.description)
      paramIndex++
    }
    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex}`)
      values.push(body.status)
      paramIndex++
    }
    if (body.steps !== undefined) {
      updates.push(`steps = $${paramIndex}`)
      values.push(JSON.stringify(body.steps))
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    values.push(id)

    const updateQuery = `
      UPDATE workflows
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id
    `

    const result = await query(updateQuery, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    await logAPIRequest(
      session.user.id,
      'PUT',
      `/api/v1/workflows/${id}`,
      200
    )

    return NextResponse.json({ message: 'Workflow updated successfully' })
  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const permission = await checkPermission({
      resource: 'workflows',
      action: 'delete',
      resourceId: id,
    })

    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', reason: permission.reason },
        { status: 403 }
      )
    }

    const result = await query(
      `UPDATE workflows
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    await logAPIRequest(
      session.user.id,
      'DELETE',
      `/api/v1/workflows/${id}`,
      200
    )

    return NextResponse.json({ message: 'Workflow deleted successfully' })
  } catch (error) {
    console.error('Error deleting workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

