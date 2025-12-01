import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// GET - Get retry config
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized'  })

    const { chatbotId } = await params
    const config = await prisma.chatbotRetryConfig.findUnique({
      where: { chatbotId },
    })

    if (!config) {
      return NextResponse.json({ config: null })
    }

    return NextResponse.json({ config })

// POST/PUT - Create or update retry config


export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\chatbots\[chatbotId]\retry-config\route.ts')
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized'  })

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\chatbots\[chatbotId]\retry-config\route.ts')

    const { chatbotId } = await params
    const body = await request.json()
    const {
      enabled,
      maxRetries,
      initialDelay,
      maxDelay,
      backoffMultiplier,
      retryableStatusCodes,
      jitter,
    } = body

    const config = await prisma.chatbotRetryConfig.upsert({
      where: { chatbotId },
      create: {
        chatbotId,
        enabled: enabled ?? true,
        maxRetries: maxRetries ?? 3,
        initialDelay: initialDelay ?? 1000,
        maxDelay: maxDelay ?? 30000,
        backoffMultiplier: backoffMultiplier ?? 2.0,
        retryableStatusCodes: retryableStatusCodes ?? ['500', '502', '503', '504'],
        jitter: jitter ?? true,
      },
      update: {
        enabled: enabled ?? true,
        maxRetries,
        initialDelay,
        maxDelay,
        backoffMultiplier,
        retryableStatusCodes,
        jitter,
      },
    })

    return NextResponse.json({ config })

