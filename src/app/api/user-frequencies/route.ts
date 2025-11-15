import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateBody } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

const COMP_PREFIX = 'freq:companies:'
const IND_PREFIX = 'freq:industries:'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    logger.apiRequest('GET', '/api/user-frequencies', { userId: session.user.id })

    const compKey = `${COMP_PREFIX}${session.user.id}`
    const indKey = `${IND_PREFIX}${session.user.id}`

    const [compRow, indRow] = await Promise.all([
      db.systemSetting.findUnique({
        where: { key: compKey },
        select: { value: true }
      }),
      db.systemSetting.findUnique({
        where: { key: indKey },
        select: { value: true }
      })
    ])

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/user-frequencies', 200, duration)
    return addSecurityHeaders(NextResponse.json({
      companies: (compRow?.value as unknown as Record<string, number>) || {},
      industries: (indRow?.value as unknown as Record<string, number>) || {},
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/user-frequencies', 500, duration)
    return handleApiError(error, 'User Frequencies API GET')
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    logger.apiRequest('POST', '/api/user-frequencies', { userId: session.user.id })

    const bodySchema = z.object({
      companies: z.array(z.string()).optional().default([]),
      industries: z.array(z.string()).optional().default([]),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { companies, industries } = bodyValidation.data

    const compKey = `${COMP_PREFIX}${session.user.id}`
    const indKey = `${IND_PREFIX}${session.user.id}`

    // Load existing using Prisma
    const [compRow, indRow] = await Promise.all([
      db.systemSetting.findUnique({
        where: { key: compKey },
        select: { value: true }
      }),
      db.systemSetting.findUnique({
        where: { key: indKey },
        select: { value: true }
      })
    ])

    const compMap: Record<string, number> = (compRow?.value as any) || {}
    const indMap: Record<string, number> = (indRow?.value as any) || {}

    for (const name of companies) {
      if (!name) continue
      compMap[name] = (compMap[name] || 0) + 1
    }
    for (const name of industries) {
      if (!name) continue
      indMap[name] = (indMap[name] || 0) + 1
    }

    if (companies.length > 0) {
      await db.systemSetting.upsert({
        where: { key: compKey },
        update: { value: JSON.stringify(compMap), updatedAt: new Date() },
        create: { key: compKey, value: JSON.stringify(compMap) }
      })
    }
    if (industries.length > 0) {
      await db.systemSetting.upsert({
        where: { key: indKey },
        update: { value: JSON.stringify(indMap), updatedAt: new Date() },
        create: { key: indKey, value: JSON.stringify(indMap) }
      })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/user-frequencies', 200, duration, {
      companyCount: companies.length,
      industryCount: industries.length,
    })
    return addSecurityHeaders(NextResponse.json({ ok: true }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/user-frequencies', 500, duration)
    return handleApiError(error, 'User Frequencies API POST')
  }
}


