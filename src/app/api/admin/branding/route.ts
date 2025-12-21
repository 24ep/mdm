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
      lightMode: z.object({
        primaryColor: z.string(),
        secondaryColor: z.string(),
        warningColor: z.string(),
        dangerColor: z.string(),
        topMenuBackgroundColor: z.string(),
        platformSidebarBackgroundColor: z.string(),
        secondarySidebarBackgroundColor: z.string(),
        topMenuTextColor: z.string(),
        platformSidebarTextColor: z.string(),
        secondarySidebarTextColor: z.string(),
        bodyBackgroundColor: z.string(),
      }).optional(),
      darkMode: z.object({
        primaryColor: z.string(),
        secondaryColor: z.string(),
        warningColor: z.string(),
        dangerColor: z.string(),
        topMenuBackgroundColor: z.string(),
        platformSidebarBackgroundColor: z.string(),
        secondarySidebarBackgroundColor: z.string(),
        topMenuTextColor: z.string(),
        platformSidebarTextColor: z.string(),
        secondarySidebarTextColor: z.string(),
        bodyBackgroundColor: z.string(),
      }).optional(),
      loginBackground: z.object({
        type: z.enum(['color', 'gradient', 'image']).catch('color'),
        color: z.string().optional(),
        gradient: z.object({
          from: z.string(),
          to: z.string(),
          angle: z.number(),
        }).optional(),
        image: z.string().optional(),
      }).catch({ type: 'color', color: '#ffffff' }),
      globalStyling: z.object({
        borderRadius: z.string(),
        borderColor: z.string(),
        borderWidth: z.string(),
        buttonBorderRadius: z.string(),
        buttonBorderWidth: z.string(),
        inputBorderRadius: z.string(),
        inputBorderWidth: z.string(),
        selectBorderRadius: z.string(),
        selectBorderWidth: z.string(),
        textareaBorderRadius: z.string(),
        textareaBorderWidth: z.string(),
      }),
      componentStyling: z.record(z.string(), z.union([
        // Nested structure with light/dark
        z.object({
          light: z.object({
            backgroundColor: z.string().optional(),
            textColor: z.string().optional(),
            borderColor: z.string().optional(),
            borderRadius: z.string().optional(),
            borderWidth: z.string().optional(),
            padding: z.string().optional(),
            fontSize: z.string().optional(),
            fontWeight: z.string().optional(),
            boxShadow: z.string().optional(),
            backdropFilter: z.string().optional(),
            transition: z.string().optional(),
            opacity: z.string().optional(),
          }).optional(),
          dark: z.object({
            backgroundColor: z.string().optional(),
            textColor: z.string().optional(),
            borderColor: z.string().optional(),
            borderRadius: z.string().optional(),
            borderWidth: z.string().optional(),
            padding: z.string().optional(),
            fontSize: z.string().optional(),
            fontWeight: z.string().optional(),
            boxShadow: z.string().optional(),
            backdropFilter: z.string().optional(),
            transition: z.string().optional(),
            opacity: z.string().optional(),
          }).optional(),
        }),
        // Flat structure (legacy format)
        z.object({
          backgroundColor: z.string().optional(),
          textColor: z.string().optional(),
          borderColor: z.string().optional(),
          borderRadius: z.string().optional(),
          borderWidth: z.string().optional(),
          padding: z.string().optional(),
          fontSize: z.string().optional(),
          fontWeight: z.string().optional(),
          boxShadow: z.string().optional(),
          backdropFilter: z.string().optional(),
          transition: z.string().optional(),
          opacity: z.string().optional(),
        }),
      ])).optional(),
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
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'BrandingConfig',
      entityId: 'system',
      oldValue: currentBranding,
      newValue: branding,
      userId: session.user.id,
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

