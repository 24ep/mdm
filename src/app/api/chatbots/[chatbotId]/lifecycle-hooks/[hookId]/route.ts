import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// PUT - Update lifecycle hook
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; hookId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }}

    const { hookId } = await params
    const body = await request.json()
    const { hookType, enabled, handlerType, handlerUrl, handlerCode, metadata } = body

    const hook = await prisma.chatbotLifecycleHook.update({
      where: { id: hookId },
      data: {
        ...(hookType && { hookType }),
        ...(enabled !== undefined && { enabled }),
        ...(handlerType && { handlerType }),
        ...(handlerUrl !== undefined && { handlerUrl: handlerUrl || null }),
        ...(handlerCode !== undefined && { handlerCode: handlerCode || null }),
        ...(metadata && { metadata }),
      },
    })

    return NextResponse.json({ hook })

// DELETE - Delete lifecycle hook


export const PUT = withErrorHandling(putHandler, 'PUT /api/src\app\api\chatbots\[chatbotId]\lifecycle-hooks\[hookId]\route.ts')
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; hookId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/src\app\api\chatbots\[chatbotId]\lifecycle-hooks\[hookId]\route.ts')

    const { hookId } = await params
    await prisma.chatbotLifecycleHook.delete({
      where: { id: hookId },
    })

    return NextResponse.json({ success: true })

