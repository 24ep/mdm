import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attrId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: dataModelId, attrId } = params

    const { rows } = await query(
      'SELECT * FROM public.data_model_attributes WHERE id = $1::uuid AND data_model_id = $2::uuid AND is_active = TRUE',
      [attrId, dataModelId]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 })
    }

    return NextResponse.json({ attribute: rows[0] })
  } catch (error) {
    console.error('Error fetching attribute:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; attrId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: dataModelId, attrId } = params

    // Check if user has permission to edit attributes in this space
    const spaceCheck = await query(`
      SELECT sm.role, s.created_by
      FROM data_models dm
      JOIN data_model_spaces dms ON dm.id = dms.data_model_id
      JOIN spaces s ON dms.space_id = s.id
      LEFT JOIN space_members sm ON s.id = sm.space_id AND sm.user_id = $1::uuid
      WHERE dm.id = $2::uuid
    `, [session.user.id, dataModelId])

    if (spaceCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Data model not found' }, { status: 404 })
    }

    const spaceData = spaceCheck.rows[0]
    const userRole = spaceData.role
    const isOwner = spaceData.created_by === session.user.id
    const canEdit = userRole === 'ADMIN' || userRole === 'MEMBER' || isOwner

    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions to edit attributes' }, { status: 403 })
    }
    const body = await request.json()
    const { 
      name, 
      display_name, 
      type, 
      is_required, 
      is_unique, 
      is_primary_key,
      is_foreign_key,
      referenced_table,
      referenced_column,
      default_value, 
      options, 
      validation, 
      order 
    } = body

    // Map type to uppercase for database enum
    const typeMapping: Record<string, string> = {
      'text': 'TEXT',
      'number': 'NUMBER', 
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'email': 'EMAIL',
      'phone': 'PHONE',
      'url': 'URL',
      'select': 'SELECT',
      'multi_select': 'MULTI_SELECT',
      'textarea': 'TEXTAREA',
      'json': 'JSON'
    }
    const mappedType = typeMapping[type?.toLowerCase()] || type?.toUpperCase() || 'TEXT'

    const updateSql = `
      UPDATE public.data_model_attributes
      SET name = $1, display_name = $2, type = $3, is_required = $4, is_unique = $5,
          is_primary_key = $6, is_foreign_key = $7, referenced_table = $8, referenced_column = $9,
          default_value = $10, options = $11, validation = $12, "order" = $13, updated_at = NOW()
      WHERE id = $14::uuid AND data_model_id = $15::uuid AND is_active = TRUE
      RETURNING *
    `
    
    const { rows } = await query(updateSql, [
      name,
      display_name,
      mappedType,
      !!is_required,
      !!is_unique,
      !!is_primary_key,
      !!is_foreign_key,
      referenced_table || null,
      referenced_column || null,
      default_value || null,
      options ? JSON.stringify(options) : null,
      validation ? JSON.stringify(validation) : null,
      order || 0,
      attrId,
      dataModelId
    ])

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 })
    }

    return NextResponse.json({ attribute: rows[0] })
  } catch (error) {
    console.error('Error updating attribute:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; attrId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: dataModelId, attrId } = params

    // Check if user has permission to delete attributes in this space
    const spaceCheck = await query(`
      SELECT sm.role, s.created_by
      FROM data_models dm
      JOIN data_model_spaces dms ON dm.id = dms.data_model_id
      JOIN spaces s ON dms.space_id = s.id
      LEFT JOIN space_members sm ON s.id = sm.space_id AND sm.user_id = $1::uuid
      WHERE dm.id = $2::uuid
    `, [session.user.id, dataModelId])

    if (spaceCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Data model not found' }, { status: 404 })
    }

    const spaceData = spaceCheck.rows[0]
    const userRole = spaceData.role
    const isOwner = spaceData.created_by === session.user.id
    const canDelete = userRole === 'ADMIN' || isOwner

    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions to delete attributes' }, { status: 403 })
    }

    const { rows } = await query(
      'UPDATE public.data_model_attributes SET is_active = FALSE, deleted_at = NOW() WHERE id = $1::uuid AND data_model_id = $2::uuid RETURNING *',
      [attrId, dataModelId]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Attribute deleted successfully' })
  } catch (error) {
    console.error('Error deleting attribute:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
