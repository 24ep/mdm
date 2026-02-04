import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { validateBody } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  logger.apiRequest('GET', '/api/admin/branding', { userId: session.user.id })

  const { rows } = await query('SELECT value FROM system_settings WHERE key = $1', ['branding_config'])

  let branding = null
  if (rows && rows.length > 0 && rows[0].value) {
    try {
      branding = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value
    } catch (e) {
      console.error('Error parsing branding config:', e)
    }
  }

  const duration = Date.now() - startTime
  logger.apiResponse('GET', '/api/admin/branding', 200, duration)
  return NextResponse.json({ branding })
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/branding')

async function putHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const bodySchema = z.object({
    branding: z.object({
      applicationName: z.string(),
      applicationLogo: z.string().optional(),
      applicationLogoType: z.enum(['image', 'icon']).optional(),
      applicationLogoIcon: z.string().optional(),
      applicationLogoIconColor: z.string().optional(),
      applicationLogoBackgroundColor: z.string().optional(),
      
      // Colors - flattened
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      warningColor: z.string().optional(),
      dangerColor: z.string().optional(),
      uiBackgroundColor: z.string().optional(),
      uiBorderColor: z.string().optional(),
      bodyBackgroundColor: z.string().optional(),
      bodyTextColor: z.string().optional(),
      topMenuBackgroundColor: z.string().optional(),
      topMenuTextColor: z.string().optional(),
      platformSidebarBackgroundColor: z.string().optional(),
      platformSidebarTextColor: z.string().optional(),
      secondarySidebarBackgroundColor: z.string().optional(),
      secondarySidebarTextColor: z.string().optional(),

      loginBackground: z.object({
        type: z.enum(['color', 'gradient', 'image', 'video']).catch('color'),
        color: z.string().optional(),
        gradient: z.object({
          from: z.string(),
          to: z.string(),
          angle: z.number(),
        }).optional(),
        image: z.string().optional(),
        video: z.string().optional(),
      }).catch({ type: 'color', color: '#ffffff' }),

      globalStyling: z.object({
        fontFamily: z.string().optional(),
        borderRadius: z.string().optional(),
        borderColor: z.string().optional(),
        borderWidth: z.string().optional(),
        buttonBorderRadius: z.string().optional(),
        buttonBorderWidth: z.string().optional(),
        inputBorderRadius: z.string().optional(),
        inputBorderWidth: z.string().optional(),
        selectBorderRadius: z.string().optional(),
        selectBorderWidth: z.string().optional(),
        textareaBorderRadius: z.string().optional(),
        textareaBorderWidth: z.string().optional(),
      }).optional(),

      componentStyling: z.record(z.any()).optional(),
    }),
  })

  const bodyValidation = await validateBody(request, bodySchema)
  if (!bodyValidation.success) {
    return bodyValidation.response
  }

  const { branding } = bodyValidation.data

  // Get current branding for audit log
  const currentBrandingResult = await query('SELECT value FROM system_settings WHERE key = $1', ['branding_config'])
  let currentBranding = null
  if (currentBrandingResult.rows && currentBrandingResult.rows.length > 0 && currentBrandingResult.rows[0].value) {
    try {
      currentBranding = typeof currentBrandingResult.rows[0].value === 'string'
        ? JSON.parse(currentBrandingResult.rows[0].value)
        : currentBrandingResult.rows[0].value
    } catch (e) {
      console.error('Error parsing current branding config:', e)
    }
  }

  // Save branding config
  const upsertSql = `
      INSERT INTO system_settings (id, key, value, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2::jsonb, NOW(), NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      RETURNING value
    `
  let savedBranding
  try {
    const res = await query(upsertSql, ['branding_config', JSON.stringify(branding)])
    savedBranding = res.rows[0]?.value
  } catch (dbError) {
    console.error('Database error saving branding:', dbError)
    throw new Error(`Failed to save branding config: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`)
  }

  // Create audit log (non-blocking - don't fail the request if audit log fails)
  try {
    // Verify user exists to ensure FK constraint (userId comes from session which might be stale)
    let auditUserId: string | null = session.user.id
    if (auditUserId) {
      try {
        const userCheck = await query('SELECT id FROM users WHERE id = $1::uuid', [auditUserId], 5000, { skipTracing: true })
        if (!userCheck.rows || userCheck.rows.length === 0) {
          logger.warn(`User ${auditUserId} not found in database during branding update. Using null for audit log.`)
          auditUserId = null
        }
      } catch (e) {
        // If check fails (e.g. invalid UUID syntax), default to null
        auditUserId = null
      }
    }

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'BrandingConfig',
      entityId: 'system',
      oldValue: currentBranding,
      newValue: branding,
      userId: auditUserId,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })
  } catch (auditError) {
    // Log but don't fail the request if audit log creation fails
    console.error('Failed to create audit log for branding update:', auditError)
  }

  const duration = Date.now() - startTime
  logger.apiResponse('PUT', '/api/admin/branding', 200, duration)
  return NextResponse.json({ branding: savedBranding })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/admin/branding')

