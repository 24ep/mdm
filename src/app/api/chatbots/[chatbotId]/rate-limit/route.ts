import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// GET - Get rate limit config
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
    const config = await prisma.chatbotRateLimit.findUnique({
      where: { chatbotId },
    })

    if (!config) {
      return NextResponse.json({ config: null })
    }

    return NextResponse.json({ config })

// POST/PUT - Create or update rate limit config


export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\chatbots\[chatbotId]\rate-limit\route.ts')
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized'  })

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\chatbots\[chatbotId]\rate-limit\route.ts')

    const { chatbotId } = await params
    const body = await request.json()
    const {
      enabled,
      maxRequestsPerMinute,
      maxRequestsPerHour,
      maxRequestsPerDay,
      maxRequestsPerMonth,
      burstLimit,
      windowSize,
      blockDuration,
    } = body

    const config = await prisma.chatbotRateLimit.upsert({
      where: { chatbotId },
      create: {
        chatbotId,
        enabled: enabled ?? true,
        maxRequestsPerMinute,
        maxRequestsPerHour,
        maxRequestsPerDay,
        maxRequestsPerMonth,
        burstLimit,
        windowSize: windowSize ?? 60,
        blockDuration: blockDuration ?? 300,
      },
      update: {
        enabled: enabled ?? true,
        maxRequestsPerMinute,
        maxRequestsPerHour,
        maxRequestsPerDay,
        maxRequestsPerMonth,
        burstLimit,
        windowSize,
        blockDuration,
      },
    })

    return NextResponse.json({ config })

