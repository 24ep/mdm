import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isUuid } from '@/lib/validation'

const prisma = new PrismaClient()

// GET - Get agent loop config
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
    
    const config = await prisma.chatbotAgentLoopConfig.findUnique({
      where: { chatbotId },
    })

    return NextResponse.json({ config: config || null })
  } catch (error: any) {
    console.error('Error fetching agent loop config:', error)
    
    // Handle Prisma UUID validation errors
    if (error?.code === 'P2023' || error?.message?.includes('UUID')) {
      return NextResponse.json(
        { error: 'Invalid chatbot ID format', details: 'Chatbot ID must be a valid UUID' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Create or update agent loop config
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
    const { maxIterations, stopConditions, timeout, enableHumanInLoop, humanInLoopConfig, metadata } = body

    const config = await prisma.chatbotAgentLoopConfig.upsert({
      where: { chatbotId },
      create: {
        chatbotId,
        maxIterations: maxIterations || null,
        stopConditions: stopConditions || {},
        timeout: timeout || null,
        enableHumanInLoop: enableHumanInLoop || false,
        humanInLoopConfig: humanInLoopConfig || {},
        metadata: metadata || {},
      },
      update: {
        maxIterations: maxIterations !== undefined ? maxIterations : undefined,
        stopConditions: stopConditions !== undefined ? stopConditions : undefined,
        timeout: timeout !== undefined ? timeout : undefined,
        enableHumanInLoop: enableHumanInLoop !== undefined ? enableHumanInLoop : undefined,
        humanInLoopConfig: humanInLoopConfig !== undefined ? humanInLoopConfig : undefined,
        metadata: metadata !== undefined ? metadata : undefined,
      },
    })

    return NextResponse.json({ config })
  } catch (error: any) {
    console.error('Error updating agent loop config:', error)
    
    // Handle Prisma UUID validation errors
    if (error?.code === 'P2023' || error?.message?.includes('UUID')) {
      return NextResponse.json(
        { error: 'Invalid chatbot ID format', details: 'Chatbot ID must be a valid UUID' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

