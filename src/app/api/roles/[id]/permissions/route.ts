import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/rbac'

// PUT /api/roles/[id]/permissions - replace role permissions with provided list (ADMIN+)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const forbidden = await requireRole(request, 'ADMIN')
  if (forbidden) return forbidden
  try {
    const { permissionIds } = await request.json()
    if (!Array.isArray(permissionIds)) return NextResponse.json({ error: 'permissionIds must be an array' }, { status: 400 })

    // Use simple transactional sequence
    await query('BEGIN')
    await query('DELETE FROM public.role_permissions WHERE role_id = $1', [params.id])
    for (const pid of permissionIds) {
      await query('INSERT INTO public.role_permissions (role_id, permission_id) VALUES ($1, $2)', [params.id, pid])
    }
    await query('COMMIT')
    return NextResponse.json({ success: true })
  } catch (error) {
    await query('ROLLBACK').catch(() => {})
    console.error('Update role permissions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


