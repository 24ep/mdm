import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { rows } = await query(`
      SELECT 
        et.*,
        parent.name as parent_name,
        parent.display_name as parent_display_name,
        COUNT(ea.id) as attribute_count,
        COUNT(ee.id) as entity_count
      FROM public.entity_types et
      LEFT JOIN public.entity_types parent ON parent.id = et.parent_id
      LEFT JOIN public.eav_attributes ea ON ea.entity_type_id = et.id AND ea.is_active = TRUE
      LEFT JOIN public.eav_entities ee ON ee.entity_type_id = et.id AND ee.is_active = TRUE
      WHERE et.id = $1
      GROUP BY et.id, et.name, et.display_name, et.description, et.parent_id, 
               et.is_abstract, et.is_active, et.sort_order, et.metadata, 
               et.created_at, et.updated_at, et.deleted_at,
               parent.name, parent.display_name
    `, [id])

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Entity type not found' }, { status: 404 })
    }

    return NextResponse.json({ entityType: rows[0] })

  } catch (error) {
    console.error('Error fetching entity type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { 
      name, 
      displayName, 
      description, 
      parentId, 
      isAbstract, 
      sortOrder, 
      metadata,
      isActive 
    } = body

    // Check if entity type exists
    const { rows: existing } = await query(
      'SELECT id FROM public.entity_types WHERE id = $1',
      [id]
    )

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Entity type not found' }, { status: 404 })
    }

    // Check if name already exists (excluding current entity)
    if (name) {
      const { rows: nameCheck } = await query(
        'SELECT id FROM public.entity_types WHERE name = $1 AND id != $2',
        [name, id]
      )

      if (nameCheck.length > 0) {
        return NextResponse.json({ error: 'Entity type with this name already exists' }, { status: 409 })
      }
    }

    const { rows } = await query(`
      UPDATE public.entity_types SET
        name = COALESCE($2, name),
        display_name = COALESCE($3, display_name),
        description = COALESCE($4, description),
        parent_id = COALESCE($5, parent_id),
        is_abstract = COALESCE($6, is_abstract),
        sort_order = COALESCE($7, sort_order),
        metadata = COALESCE($8, metadata),
        is_active = COALESCE($9, is_active),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [
      id,
      name,
      displayName,
      description,
      parentId,
      isAbstract,
      sortOrder,
      JSON.stringify(metadata),
      isActive
    ])

    return NextResponse.json({ entityType: rows[0] })

  } catch (error) {
    console.error('Error updating entity type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if entity type has entities
    const { rows: entityCount } = await query(
      'SELECT COUNT(*) as count FROM public.eav_entities WHERE entity_type_id = $1',
      [id]
    )

    if (parseInt(entityCount[0].count) > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete entity type with existing entities' 
      }, { status: 400 })
    }

    // Soft delete
    const { rows } = await query(`
      UPDATE public.entity_types SET
        is_active = FALSE,
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id])

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Entity type not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting entity type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
