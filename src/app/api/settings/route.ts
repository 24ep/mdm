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

    logger.apiRequest('GET', '/api/settings', { userId: session.user.id })

    const { rows } = await query('SELECT key, value FROM system_settings ORDER BY key ASC')
    const settingsObject = (rows || []).reduce((acc: Record<string, any>, setting: any) => {
      acc[setting.key] = setting.value
      return acc
    }, {})

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/settings', 200, duration, {
      settingCount: Object.keys(settingsObject).length
    })
    return addSecurityHeaders(NextResponse.json(settingsObject))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/settings', 500, duration)
    return handleApiError(error, 'Settings API GET')
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    logger.apiRequest('PUT', '/api/settings', { userId: session.user.id })

    const bodySchema = z.object({
      settings: z.record(z.string(), z.any()),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { settings } = bodyValidation.data

    // Get current settings for audit log
    const currentSettingsResult = await query('SELECT key, value FROM system_settings')
    const currentSettings = (currentSettingsResult.rows || []).reduce((acc: Record<string, any>, setting: any) => {
      acc[setting.key] = setting.value
      return acc
    }, {})

    const updatedSettings: Record<string, any> = {}
    for (const [key, value] of Object.entries(settings)) {
      const upsertSql = `
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        RETURNING value
      `
      const res = await query(upsertSql, [key, value])
      updatedSettings[key] = res.rows[0]?.value
    }

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'SystemSettings',
      entityId: 'system',
      oldValue: currentSettings,
      newValue: updatedSettings,
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', '/api/settings', 200, duration, {
      updatedCount: Object.keys(updatedSettings).length
    })
    return addSecurityHeaders(NextResponse.json(updatedSettings))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', '/api/settings', 500, duration)
    return handleApiError(error, 'Settings API PUT')
  }
}
