import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/rbac'

// PUT /api/roles/[id] - update role (name/description, ADMIN+)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const forbidden = await requireRole(request, 'ADMIN')
  if (forbidden) return forbidden
  try {
    const { name, description } = await request.json()
    const sets: string[] = []
    const values: any[] = []
    if (name) { values.push(name); sets.push(`name = $${values.length}`) }
    if (description !== undefined) { values.push(description); sets.push(`description = $${values.length}`) }
    if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    values.push(params.id)
    const { rows } = await query(`UPDATE public.roles SET ${sets.join(', ') } WHERE id = $${values.length} RETURNING id, name, description`, values)
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ role: rows[0] })
  } catch (error) {
    console.error('Update role error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/roles/[id] - delete role (ADMIN+)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const forbidden = await requireRole(request, 'ADMIN')
  if (forbidden) return forbidden
  try {
    const { rows } = await query('DELETE FROM public.roles WHERE id = $1 RETURNING id', [params.id])
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete role error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


