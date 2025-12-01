import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { OpenAI } from 'openai'

const prisma = new PrismaClient()

// GET - Get messages for a specific thread
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } 

export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\openai-agent-sdk\threads\[threadId]\messages\route.ts')= authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized'  })



    const { threadId } = await params

    // Get thread from database to verify ownership and get API key
    const thread = await prisma.openAIAgentThread.findFirst({
      where: {
        threadId,
        userId: session.user.id,
        deletedAt: null,
      },
      include: {
        chatbot: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found'  })

    // Get API key from thread metadata or chatbot config
    const metadata = thread.metadata as any
    const apiKey = metadata?.apiKey
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found'  })

    // Fetch messages from OpenAI API
    const openai = new OpenAI({ apiKey })
    const messagesResponse = await openai.beta.threads.messages.list(threadId, {
      limit: 100,
      order: 'asc', // Oldest first
    })

    // Format messages for frontend
    const messages = (messagesResponse.data || []).map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      created_at: msg.created_at,
      traceId: msg.metadata?.traceId,
    }))

    return NextResponse.json({ messages })

