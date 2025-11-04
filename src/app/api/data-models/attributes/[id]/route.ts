import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, display_name, type, is_required, is_unique, default_value, options, validation, order, is_active } = body

    const fields: string[] = []
    const values: any[] = []
    const push = (col: string, val: any) => { values.push(val); fields.push(`${col} = $${values.length}`) }
    if (name !== undefined) push('name', name)
    if (display_name !== undefined) push('display_name', display_name)
    if (type !== undefined) push('type', type)
    if (is_required !== undefined) push('is_required', !!is_required)
    if (is_unique !== undefined) push('is_unique', !!is_unique)
    if (default_value !== undefined) push('default_value', default_value)
    if (options !== undefined) push('options', options)
    if (validation !== undefined) push('validation', validation)
    if (order !== undefined) push('"order"', order)
    if (is_active !== undefined) push('is_active', !!is_active)
    if (!fields.length) return NextResponse.json({})
    
    // Get current data for audit log
    const currentDataResult = await query('SELECT * FROM data_model_attributes WHERE id = $1::uuid', [params.id])
    const currentData = currentDataResult.rows[0]

    values.push(params.id)
    const { rows } = await query<any>(
      `UPDATE public.data_model_attributes SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    )

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'DataModelAttribute',
      entityId: params.id,
      oldValue: currentData,
      newValue: rows[0],
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ attribute: rows[0] })
  } catch (error) {
    console.error('Error updating attribute:', error)
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
    await query('UPDATE public.data_model_attributes SET is_active = FALSE, deleted_at = NOW() WHERE id = $1::uuid', [params.id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attribute:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


