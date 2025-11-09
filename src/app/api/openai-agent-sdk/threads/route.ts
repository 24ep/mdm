import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - List threads for a chatbot
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
  } catch (error) {
    console.error('Error fetching threads:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - Create a new thread
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
  } catch (error) {
    console.error('Error creating thread:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

