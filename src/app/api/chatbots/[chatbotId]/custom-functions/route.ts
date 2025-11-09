import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isUuid } from '@/lib/validation'

const prisma = new PrismaClient()

// GET - List custom functions
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
    
    const functions = await prisma.chatbotCustomFunction.findMany({
      where: { chatbotId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ functions })
  } catch (error: any) {
    console.error('Error fetching custom functions:', error)
    
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

// POST - Create custom function
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
    const { name, description, parameters, endpoint, code, executionType, enabled, metadata } = body

    if (!name || !description || !parameters) {
      return NextResponse.json(
        { error: 'name, description, and parameters are required' },
        { status: 400 }
      )
    }

    const func = await prisma.chatbotCustomFunction.create({
      data: {
        chatbotId,
        name,
        description,
        parameters,
        endpoint: endpoint || null,
        code: code || null,
        executionType: executionType || 'api',
        enabled: enabled !== undefined ? enabled : true,
        metadata: metadata || {},
      },
    })

    return NextResponse.json({ function: func })
  } catch (error: any) {
    console.error('Error creating custom function:', error)
    
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

