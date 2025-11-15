import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/rbac'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

// GET /api/roles - list roles and their permissions (ADMIN+)
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const forbidden = await requireRole(request, 'ADMIN')
  if (forbidden) return addSecurityHeaders(forbidden)
  try {
    logger.apiRequest('GET', '/api/roles')

    const querySchema = z.object({
      level: z.enum(['global', 'space']).optional(),
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }

    const level = queryValidation.data.level // 'global' or 'space' or null for all

    // Note: level and is_system columns don't exist in the database schema
    // They are set as defaults in the response mapping below
    let queryStr = 'SELECT id, name, description FROM public.roles'
    const params: any[] = []
    
    // Level filtering removed since column doesn't exist in DB
    // Filtering can be done client-side if needed
    
    queryStr += ' ORDER BY name ASC'

    const { rows: roles } = await query(queryStr, params)

    const { rows: rolePerms } = await query(
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
    
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/roles', 200, duration, {
      roleCount: result.length
    })
    return addSecurityHeaders(NextResponse.json({ roles: result }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/roles', 500, duration)
    return handleApiError(error, 'Roles API GET')
  }
}

// POST /api/roles - create role (ADMIN+)
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const forbidden = await requireRole(request, 'ADMIN')
  if (forbidden) return addSecurityHeaders(forbidden)
  try {
    logger.apiRequest('POST', '/api/roles')

    const bodySchema = z.object({
      name: z.string().min(1),
      description: z.string().optional().nullable(),
      level: z.enum(['global', 'space']).optional().default('space'),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { name, description, level } = bodyValidation.data
    
    // Note: level and is_system columns don't exist in the database schema
    // They are set as defaults in the response below
    const roleLevel = level === 'global' ? 'global' : 'space'
    const { rows } = await query(
      'INSERT INTO public.roles (name, description) VALUES ($1, $2) RETURNING id, name, description',
      [name, description || null]
    )
    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/roles', 201, duration, {
      roleId: rows[0].id
    })
    return addSecurityHeaders(NextResponse.json({ 
      role: {
        ...rows[0],
        isSystem: false,
        level: roleLevel
      }
    }, { status: 201 }))
  } catch (error: any) {
    const duration = Date.now() - startTime
    if (String(error?.message || '').includes('duplicate')) {
      logger.warn('Role already exists', { name })
      return addSecurityHeaders(NextResponse.json({ error: 'Role already exists' }, { status: 409 }))
    }
    logger.apiResponse('POST', '/api/roles', 500, duration)
    return handleApiError(error, 'Roles API POST')
  }
}


