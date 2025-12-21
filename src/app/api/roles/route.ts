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

    let queryStr = 'SELECT id, name, description, level, is_system FROM public.roles'
    const params: any[] = []

    // Filter by level if specified
    if (level) {
      queryStr += ' WHERE level = $1'
      params.push(level)
    }

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

    const result = roles.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      level: r.level || 'space',
      isSystem: r.is_system || false,
      permissions: roleIdToPerms[r.id] || [],
    }))

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

    const roleLevel = level === 'global' ? 'global' : 'space'
    const { rows } = await query(
      'INSERT INTO public.roles (name, description, level, is_system) VALUES ($1, $2, $3, $4) RETURNING id, name, description, level, is_system',
      [name, description || null, roleLevel, false]
    )
    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/roles', 201, duration, {
      roleId: rows[0].id
    })
    return addSecurityHeaders(NextResponse.json({
      role: {
        id: rows[0].id,
        name: rows[0].name,
        description: rows[0].description,
        level: rows[0].level,
        isSystem: rows[0].is_system,
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


