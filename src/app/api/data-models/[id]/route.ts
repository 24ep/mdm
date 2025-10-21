import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    // Temporarily bypass authentication for testing
    // if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { rows } = await query<any>(
      'SELECT * FROM public.data_models WHERE id = $1 AND deleted_at IS NULL',
      [params.id]
    )
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ dataModel: rows[0] })
  } catch (error) {
    console.error('Error fetching data model:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, display_name, description, is_active, icon, sort_order, is_pinned, source_type, external_connection_id, external_schema, external_table, external_primary_key } = body
    let { slug } = body as any
    if (!name && !display_name && description === undefined && is_active === undefined && icon === undefined && sort_order === undefined && is_pinned === undefined && source_type === undefined && external_connection_id === undefined && external_schema === undefined && external_table === undefined && external_primary_key === undefined) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const fields: string[] = []
    const values: any[] = []
    let idx = 1
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name) }
    if (display_name !== undefined) { fields.push(`display_name = $${idx++}`); values.push(display_name) }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description) }
    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(!!is_active) }
    if (icon !== undefined) { fields.push(`icon = $${idx++}`); values.push(icon) }
    if (sort_order !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(parseInt(sort_order) || 0) }
    if (is_pinned !== undefined) { fields.push(`is_pinned = $${idx++}`); values.push(!!is_pinned) }
    if (source_type !== undefined) { fields.push(`source_type = $${idx++}`); values.push(source_type) }
    if (external_connection_id !== undefined) { fields.push(`external_connection_id = $${idx++}`); values.push(external_connection_id) }
    if (external_schema !== undefined) { fields.push(`external_schema = $${idx++}`); values.push(external_schema) }
    if (external_table !== undefined) { fields.push(`external_table = $${idx++}`); values.push(external_table) }
    if (external_primary_key !== undefined) { fields.push(`external_primary_key = $${idx++}`); values.push(external_primary_key) }

    // Handle slug update if provided
    if (slug !== undefined) {
      const toSlug = (text: string) => (
        text || ''
      ).toString().toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')
      slug = toSlug(slug)
      if (!slug) {
        return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
      }
      // Ensure unique (excluding current record)
      const { rows: conflict } = await query<{ id: string }>(
        'SELECT id FROM public.data_models WHERE slug = $1 AND id <> $2 AND deleted_at IS NULL LIMIT 1',
        [slug, params.id]
      )
      if (conflict.length > 0) {
        return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
      }
      fields.push(`slug = $${idx++}`)
      values.push(slug)
    }

    // Get current data for audit log
    const currentDataResult = await query('SELECT * FROM data_models WHERE id = $1', [params.id])
    const currentData = currentDataResult.rows[0]

    const sql = `UPDATE public.data_models SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`
    values.push(params.id)
    const { rows } = await query<any>(sql, values)
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'DataModel',
      entityId: params.id,
      oldValue: currentData,
      newValue: rows[0],
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ dataModel: rows[0] })
  } catch (error) {
    console.error('Error updating data model:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get current data for audit log
    const currentDataResult = await query('SELECT * FROM data_models WHERE id = $1', [params.id])
    const currentData = currentDataResult.rows[0]

    const { rows } = await query<any>(
      'UPDATE public.data_models SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [params.id]
    )
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Create audit log
    await createAuditLog({
      action: 'DELETE',
      entityType: 'DataModel',
      entityId: params.id,
      oldValue: currentData,
      newValue: null,
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting data model:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}