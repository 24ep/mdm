import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/rbac'

// GET /api/roles - list roles and their permissions (ADMIN+)
export async function GET(request: NextRequest) {
  const forbidden = await requireRole(request, 'ADMIN')
  if (forbidden) return forbidden
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') // 'global' or 'space' or null for all

    let queryStr = 'SELECT id, name, description, level, is_system FROM public.roles'
    const params: any[] = []
    
    if (level) {
      queryStr += ' WHERE level = $1'
      params.push(level)
    }
    
    queryStr += ' ORDER BY level DESC, name ASC'

    const { rows: roles } = await query<any>(queryStr, params)

    const { rows: rolePerms } = await query<any>(
      `SELECT rp.role_id, p.id as permission_id, p.name, p.resource, p.action
       FROM public.role_permissions rp
       JOIN public.permissions p ON p.id = rp.permission_id`
    )

    const roleIdToPerms: Record<string, any[]> = {}
    for (const rp of rolePerms) {
      roleIdToPerms[rp.role_id] = roleIdToPerms[rp.role_id] || []
      roleIdToPerms[rp.role_id].push({ id: rp.permission_id, name: rp.name, resource: rp.resource, action: rp.action })
    }

    const result = roles.map(r => ({ 
      ...r, 
      permissions: roleIdToPerms[r.id] || [],
      isSystem: r.is_system || false,
      level: r.level || 'space'
    }))
    return NextResponse.json({ roles: result })
  } catch (error) {
    console.error('List roles error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/roles - create role (ADMIN+)
export async function POST(request: NextRequest) {
  const forbidden = await requireRole(request, 'ADMIN')
  if (forbidden) return forbidden
  try {
    const { name, description, level } = await request.json()
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
    
    const roleLevel = level === 'global' ? 'global' : 'space'
    const { rows } = await query<any>(
      'INSERT INTO public.roles (name, description, level, is_system) VALUES ($1, $2, $3, $4) RETURNING id, name, description, level, is_system',
      [name, description || null, roleLevel, false]
    )
    return NextResponse.json({ 
      role: {
        ...rows[0],
        isSystem: rows[0].is_system || false,
        level: rows[0].level || 'space'
      }
    }, { status: 201 })
  } catch (error: any) {
    if (String(error?.message || '').includes('duplicate')) {
      return NextResponse.json({ error: 'Role already exists' }, { status: 409 })
    }
    console.error('Create role error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


