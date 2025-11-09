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

    // Note: level and is_system columns don't exist in the database schema
    // They are set as defaults in the response mapping below
    let queryStr = 'SELECT id, name, description FROM public.roles'
    const params: any[] = []
    
    // Level filtering removed since column doesn't exist in DB
    // Filtering can be done client-side if needed
    
    queryStr += ' ORDER BY name ASC'

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

    let result = roles.map(r => ({ 
      ...r, 
      permissions: roleIdToPerms[r.id] || [],
      isSystem: false, // Default since column doesn't exist in DB
      level: 'space' as 'global' | 'space' // Default since column doesn't exist in DB
    }))
    
    // Client-side filtering by level if requested
    if (level) {
      result = result.filter(r => r.level === level)
    }
    
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
    
    // Note: level and is_system columns don't exist in the database schema
    // They are set as defaults in the response below
    const roleLevel = level === 'global' ? 'global' : 'space'
    const { rows } = await query<any>(
      'INSERT INTO public.roles (name, description) VALUES ($1, $2) RETURNING id, name, description',
      [name, description || null]
    )
    return NextResponse.json({ 
      role: {
        ...rows[0],
        isSystem: false,
        level: roleLevel
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


