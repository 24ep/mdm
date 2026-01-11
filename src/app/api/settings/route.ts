import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { query, prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { validateBody } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

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
  return NextResponse.json(settingsObject)
}


async function putHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  logger.apiRequest('PUT', '/api/settings', { userId: session.user.id })

  const bodySchema = z.object({
    settings: z.record(z.string(), z.any()),
  })

  const bodyValidation = await validateBody(request, bodySchema)
  if (!bodyValidation.success) {
    return bodyValidation.response
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
    const res = await (prisma as any).systemSetting.upsert({
      where: { key },
      update: { value: String(value), updatedAt: new Date() },
      create: { key, value: String(value) }
    })
    updatedSettings[key] = res.value
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
  return NextResponse.json(updatedSettings)
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/settings')


export const GET = withErrorHandling(getHandler, 'GET /api/settings')