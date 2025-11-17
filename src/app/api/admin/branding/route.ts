import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { validateBody } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

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
    return addSecurityHeaders(NextResponse.json({ branding }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/admin/branding', 500, duration)
    return handleApiError(error, 'Branding API GET')
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    logger.apiRequest('PUT', '/api/admin/branding', { userId: session.user.id })

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
        }),
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
        }),
        loginBackground: z.object({
          type: z.enum(['color', 'gradient', 'image']),
          color: z.string().optional(),
          gradient: z.object({
            from: z.string(),
            to: z.string(),
            angle: z.number(),
          }).optional(),
          image: z.string().optional(),
        }),
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
        componentStyling: z.record(z.string(), z.object({
          light: z.object({
            backgroundColor: z.string().optional(),
            textColor: z.string().optional(),
            borderColor: z.string().optional(),
            borderRadius: z.string().optional(),
            borderWidth: z.string().optional(),
            padding: z.string().optional(),
            fontSize: z.string().optional(),
            fontWeight: z.string().optional(),
          }),
          dark: z.object({
            backgroundColor: z.string().optional(),
            textColor: z.string().optional(),
            borderColor: z.string().optional(),
            borderRadius: z.string().optional(),
            borderWidth: z.string().optional(),
            padding: z.string().optional(),
            fontSize: z.string().optional(),
            fontWeight: z.string().optional(),
          }),
        })).optional(),
      }),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
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
    return addSecurityHeaders(NextResponse.json({ branding: savedBranding }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', '/api/admin/branding', 500, duration)
    return handleApiError(error, 'Branding API PUT')
  }
}

