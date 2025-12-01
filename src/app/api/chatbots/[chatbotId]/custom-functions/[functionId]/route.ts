import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// GET - Get custom function
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; functionId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized'  })

    const { chatbotId, functionId } = await params
    const func = await prisma.chatbotCustomFunction.findUnique({
      where: { id: functionId },
    })

    if (!func || func.chatbotId !== chatbotId) {
      return NextResponse.json({ error: 'Function not found'  })

    return NextResponse.json({ function: func })

// PUT - Update custom function


export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\chatbots\[chatbotId]\custom-functions\[functionId]\route.ts')
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; functionId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized'  })

    const { functionId } = await params
    const body = await request.json()
    const { name, description, parameters, endpoint, code, executionType, enabled, metadata } = body

    const func = await prisma.chatbotCustomFunction.update({
      where: { id: functionId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(parameters && { parameters }),
        ...(endpoint !== undefined && { endpoint: endpoint || null }),
        ...(code !== undefined && { code: code || null }),
        ...(executionType && { executionType }),
        ...(enabled !== undefined && { enabled }),
        ...(metadata && { metadata }),
      },
    })

    return NextResponse.json({ function: func })

// DELETE - Delete custom function


export const PUT = withErrorHandling(putHandler, 'PUT /api/src\app\api\chatbots\[chatbotId]\custom-functions\[functionId]\route.ts')
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; functionId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized'  })

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/src\app\api\chatbots\[chatbotId]\custom-functions\[functionId]\route.ts')

    const { functionId } = await params
    await prisma.chatbotCustomFunction.delete({
      where: { id: functionId },
    })

    return NextResponse.json({ success: true })

