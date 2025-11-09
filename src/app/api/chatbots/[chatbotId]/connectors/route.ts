import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isUuid } from '@/lib/validation'

const prisma = new PrismaClient()

// GET - List connectors
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatbotId } = await params
    
    // Validate UUID format before querying
    if (!isUuid(chatbotId)) {
      return NextResponse.json(
        { error: 'Invalid chatbot ID format', details: 'Chatbot ID must be a valid UUID' },
        { status: 400 }
      )
    }
    
    const connectors = await prisma.chatbotConnector.findMany({
      where: { chatbotId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ connectors })
  } catch (error: any) {
    console.error('Error fetching connectors:', error)
    
    // Handle Prisma UUID validation errors
    if (error?.code === 'P2023' || error?.message?.includes('UUID')) {
      return NextResponse.json(
        { error: 'Invalid chatbot ID format', details: 'Chatbot ID must be a valid UUID' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create connector
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatbotId } = await params
    
    // Validate UUID format before querying
    if (!isUuid(chatbotId)) {
      return NextResponse.json(
        { error: 'Invalid chatbot ID format', details: 'Chatbot ID must be a valid UUID' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { connectorType, enabled, credentials, config, metadata } = body

    if (!connectorType) {
      return NextResponse.json(
        { error: 'connectorType is required' },
        { status: 400 }
      )
    }

    const connector = await prisma.chatbotConnector.create({
      data: {
        chatbotId,
        connectorType,
        enabled: enabled !== undefined ? enabled : true,
        credentials: credentials || null,
        config: config || {},
        metadata: metadata || {},
      },
    })

    return NextResponse.json({ connector })
  } catch (error: any) {
    console.error('Error creating connector:', error)
    
    // Handle Prisma UUID validation errors
    if (error?.code === 'P2023' || error?.message?.includes('UUID')) {
      return NextResponse.json(
        { error: 'Invalid chatbot ID format', details: 'Chatbot ID must be a valid UUID' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

