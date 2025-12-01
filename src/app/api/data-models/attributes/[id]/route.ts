import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } 

export const PUT = withErrorHandling(putHandler, 'PUT /api/src\app\api\data-models\attributes\[id]\route.ts')= authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { name, display_name, type, is_required, is_unique, default_value, options, validation, order, is_active } = body

    const fields: string[] = []
    const values: any[] = []
    const push = (col: string, val: any) => { values.push(val); fields.push(`${col} = ${values.length}`) }
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
    const currentDataResult = await query('SELECT * FROM data_model_attributes WHERE id = $1::uuid', [id])
    const currentData = currentDataResult.rows[0]

    values.push(id)
    const { rows } = await query(
      `UPDATE public.data_model_attributes SET ${fields.join(', ')} WHERE id = ${values.length} RETURNING *`,
      values
    )

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'DataModelAttribute',
      entityId: id,
      oldValue: currentData,
      newValue: rows[0],
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ attribute: rows[0] })

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await query('UPDATE public.data_model_attributes SET is_active = FALSE, deleted_at = NOW() WHERE id = $1::uuid', [id])
    return NextResponse.json({ success: true })
  }

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/src\app\api\data-models\attributes\[id]\route.ts') catch (error) {
    console.error('Error deleting attribute:', error)
    return NextResponse.json({ error: 'Internal server error'  })
}


