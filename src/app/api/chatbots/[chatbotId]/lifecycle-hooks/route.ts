import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - List lifecycle hooks
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
    const hooks = await prisma.chatbotLifecycleHook.findMany({
      where: { chatbotId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ hooks })
  } catch (error) {
    console.error('Error fetching lifecycle hooks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create lifecycle hook
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
    const body = await request.json()
    const { hookType, enabled, handlerType, handlerUrl, handlerCode, metadata } = body

    if (!hookType || !handlerType) {
      return NextResponse.json(
        { error: 'hookType and handlerType are required' },
        { status: 400 }
      )
    }

    const hook = await prisma.chatbotLifecycleHook.create({
      data: {
        chatbotId,
        hookType,
        enabled: enabled !== undefined ? enabled : true,
        handlerType,
        handlerUrl: handlerUrl || null,
        handlerCode: handlerCode || null,
        metadata: metadata || {},
      },
    })

    return NextResponse.json({ hook })
  } catch (error) {
    console.error('Error creating lifecycle hook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

