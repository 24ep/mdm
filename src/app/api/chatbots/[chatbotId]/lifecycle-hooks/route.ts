import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// GET - List lifecycle hooks
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
    const hooks = await prisma.chatbotLifecycleHook.findMany({
      where: { chatbotId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ hooks })

// POST - Create lifecycle hook


export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\chatbots\[chatbotId]\lifecycle-hooks\route.ts')
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized'  })

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\chatbots\[chatbotId]\lifecycle-hooks\route.ts')

    const { chatbotId } = await params
    const body = await request.json()
    const { hookType, enabled, handlerType, handlerUrl, handlerCode, metadata } = body

    if (!hookType || !handlerType) {
      return NextResponse.json(
        { error: 'hookType and handlerType are required' },
        { status: 400 }
      )
    }

    const hook = await prisma.chatbotLifecycleHook.create({
      data: {
        chatbotId,
        hookType,
        enabled: enabled !== undefined ? enabled : true,
        handlerType,
        handlerUrl: handlerUrl || null,
        handlerCode: handlerCode || null,
        metadata: metadata || {},
      },
    })

    return NextResponse.json({ hook })

