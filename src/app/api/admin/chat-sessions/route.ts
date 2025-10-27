import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const chatSessions = await prisma.chatSession.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        model: {
          select: {
            id: true,
            name: true,
            provider: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    const formattedSessions = chatSessions.map(session => ({
      id: session.id,
      title: session.title,
      description: session.description,
      isPrivate: session.isPrivate,
      userId: session.userId,
      userName: session.user.name,
      userEmail: session.user.email,
      spaceId: session.spaceId,
      spaceName: session.space?.name,
      modelId: session.modelId,
      modelName: session.model?.name,
      provider: session.model?.provider,
      messages: session.messages || [],
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }))

    return NextResponse.json({ sessions: formattedSessions })
  } catch (error) {
    console.error('Error fetching chat sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch chat sessions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, isPrivate, spaceId, modelId } = body

    const chatSession = await prisma.chatSession.create({
      data: {
        title: title || 'New Chat',
        description,
        isPrivate: isPrivate || false,
        userId: session.user.id,
        spaceId: spaceId || null,
        modelId: modelId || null,
        messages: []
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        model: {
          select: {
            id: true,
            name: true,
            provider: true
          }
        }
      }
    })

    const formattedSession = {
      id: chatSession.id,
      title: chatSession.title,
      description: chatSession.description,
      isPrivate: chatSession.isPrivate,
      userId: chatSession.userId,
      userName: chatSession.user.name,
      userEmail: chatSession.user.email,
      spaceId: chatSession.spaceId,
      spaceName: chatSession.space?.name,
      modelId: chatSession.modelId,
      modelName: chatSession.model?.name,
      provider: chatSession.model?.provider,
      messages: chatSession.messages || [],
      createdAt: chatSession.createdAt,
      updatedAt: chatSession.updatedAt
    }

    return NextResponse.json({ session: formattedSession })
  } catch (error) {
    console.error('Error creating chat session:', error)
    return NextResponse.json({ error: 'Failed to create chat session' }, { status: 500 })
  }
}
