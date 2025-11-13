import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { OpenAI } from 'openai'

const prisma = new PrismaClient()

// GET - Get messages for a specific thread
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Get API key from thread metadata or chatbot config
    const metadata = thread.metadata as any
    const apiKey = metadata?.apiKey
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 400 })
    }

    // Fetch messages from OpenAI API
    const openai = new OpenAI({ apiKey })
    const messagesResponse = await openai.beta.threads.messages.list(threadId, {
      limit: 100,
      order: 'asc', // Oldest first
    })

    // Format messages for frontend
    const messages = messagesResponse.data.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      created_at: msg.created_at,
      traceId: msg.metadata?.traceId,
    }))

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching thread messages:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

