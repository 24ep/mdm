import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/rbac'

// GET /api/permissions - list all permissions (ADMIN+)
export async function GET(request: NextRequest) {
  const forbidden = await requireRole(request, 'ADMIN')
  if (forbidden) return forbidden
  try {
    const { rows } = await query<any>('SELECT id, name, description, resource, action FROM public.permissions ORDER BY resource, action')
    return NextResponse.json({ permissions: rows })
  } catch (error) {
    console.error('List permissions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/permissions - create a permission (ADMIN+)
export async function POST(request: NextRequest) {
  const forbidden = await requireRole(request, 'ADMIN')
  if (forbidden) return forbidden
  try {
    const { name, description, resource, action } = await request.json()
    if (!name || !resource || !action) return NextResponse.json({ error: 'name, resource, action required' }, { status: 400 })
    const { rows } = await query<any>(
      'INSERT INTO public.permissions (name, description, resource, action) VALUES ($1, $2, $3, $4) RETURNING id, name, description, resource, action',
      [name, description || null, resource, action]
    )
    return NextResponse.json({ permission: rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Create permission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


