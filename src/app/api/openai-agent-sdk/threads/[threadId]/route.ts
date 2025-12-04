import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// GET - Get a specific thread
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { threadId } = await params

    const thread = await prisma.openAIAgentThread.findFirst({
      where: {
        threadId,
        userId: session.user.id,
        deletedAt: null,
      },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

    return NextResponse.json({ thread })

// PATCH - Update thread (title, metadata, etc.)


async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { threadId } = await params
    const body = await request.json()
    const { title, metadata } = body

    const thread = await prisma.openAIAgentThread.findFirst({
      where: {
        threadId,
        userId: session.user.id,
        deletedAt: null,
      },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

    const updated = await prisma.openAIAgentThread.update({
      where: { id: thread.id },
      data: {
        ...(title !== undefined && { title }),
        ...(metadata !== undefined && { metadata }),
      },
    })

    return NextResponse.json({ thread: updated })

// DELETE - Soft delete a thread


async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })


    const { threadId } = await params

    const thread = await prisma.openAIAgentThread.findFirst({
      where: {
        threadId,
        userId: session.user.id,
        deletedAt: null,
      },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

    await prisma.openAIAgentThread.update({
      where: { id: thread.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })



export const GET = withErrorHandling(getHandler, 'GET GET /api/openai-agent-sdk/threads/[threadId]/route.ts')
export const PATCH = withErrorHandling(patchHandler, 'PATCH PATCH /api/openai-agent-sdk/threads/[threadId]/route.ts')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE DELETE /api/openai-agent-sdk/threads/[threadId]/route.ts')