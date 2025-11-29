import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// GET - List threads for a chatbot
async function getHandler(request: NextRequest) {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const { searchParams } = new URL(request.url)
    const chatbotId = searchParams.get('chatbotId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!chatbotId) {
      return NextResponse.json({ error: 'chatbotId is required' }, { status: 400 })
    }

    const threads = await prisma.openAIAgentThread.findMany({
      where: {
        chatbotId,
        userId: session.user.id,
        deletedAt: null,
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        threadId: true,
        title: true,
        messageCount: true,
        lastMessageAt: true,
        createdAt: true,
        metadata: true,
      },
    })

    return NextResponse.json({ threads })
  ,
      { status: 500 }
    )
  }
}

// POST - Create a new thread




export const GET = withErrorHandling(getHandler, 'GET GET /api/openai-agent-sdk/threads')
export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\openai-agent-sdk\threads\route.ts')
async function postHandler(request: NextRequest) {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\openai-agent-sdk\threads\route.ts')

    const body = await request.json()
    const { chatbotId, threadId, title, metadata, spaceId } = body

    if (!chatbotId || !threadId) {
      return NextResponse.json({ error: 'chatbotId and threadId are required' }, { status: 400 })
    }

    // Check if thread already exists
    const existing = await prisma.openAIAgentThread.findUnique({
      where: { threadId },
    })

    if (existing) {
      return NextResponse.json({ thread: existing }, { status: 200 })
    }

    const thread = await prisma.openAIAgentThread.create({
      data: {
        threadId,
        chatbotId,
        userId: session.user.id,
        spaceId: spaceId || null,
        title: title || 'New Conversation',
        metadata: metadata || {},
        messageCount: 0,
        lastMessageAt: new Date(),
      },
    })

    return NextResponse.json({ thread }, { status: 201 })
  ,
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/openai-agent-sdk/threads')

