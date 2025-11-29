import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// GET - Get cache config
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }}

    const { chatbotId } = await params
    const config = await prisma.chatbotCacheConfig.findUnique({
      where: { chatbotId },
    })

    if (!config) {
      return NextResponse.json({ config: null })
    }

    return NextResponse.json({ config })

// POST/PUT - Create or update cache config


export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\chatbots\[chatbotId]\cache-config\route.ts')
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }}

    const { chatbotId } = await params
    const body = await request.json()
    const {
      enabled,
      ttl,
      maxSize,
      strategy,
      includeContext,
      cacheKeyPrefix,
    } = body

    const config = await prisma.chatbotCacheConfig.upsert({
      where: { chatbotId },
      create: {
        chatbotId,
        enabled: enabled ?? true,
        ttl: ttl ?? 3600,
        maxSize: maxSize ?? 1000,
        strategy: strategy ?? 'exact',
        includeContext: includeContext ?? false,
        cacheKeyPrefix,
      },
      update: {
        enabled: enabled ?? true,
        ttl,
        maxSize,
        strategy,
        includeContext,
        cacheKeyPrefix,
      },
    })

    return NextResponse.json({ config })

// DELETE - Clear cache


export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\chatbots\[chatbotId]\cache-config\route.ts')
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/src\app\api\chatbots\[chatbotId]\cache-config\route.ts')

    const { chatbotId } = await params
    const { clearCache } = await import('@/lib/response-cache')
    const config = await prisma.chatbotCacheConfig.findUnique({
      where: { chatbotId },
    })

    if (config) {
      await clearCache(chatbotId, {
        enabled: config.enabled,
        ttl: config.ttl,
        maxSize: config.maxSize,
        strategy: config.strategy as 'exact' | 'semantic' | 'fuzzy',
        includeContext: config.includeContext,
        cacheKeyPrefix: config.cacheKeyPrefix,
      })
    }

    return NextResponse.json({ success: true })

