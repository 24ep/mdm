import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// PUT - Update lifecycle hook
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; hookId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { hookId } = await params
    const body = await request.json()
    const { hookType, enabled, handlerType, handlerUrl, handlerCode, metadata } = body

    const hook = await prisma.chatbotLifecycleHook.update({
      where: { id: hookId },
      data: {
        ...(hookType && { hookType }),
        ...(enabled !== undefined && { enabled }),
        ...(handlerType && { handlerType }),
        ...(handlerUrl !== undefined && { handlerUrl: handlerUrl || null }),
        ...(handlerCode !== undefined && { handlerCode: handlerCode || null }),
        ...(metadata && { metadata }),
      },
    })

    return NextResponse.json({ hook })
  } catch (error) {
    console.error('Error updating lifecycle hook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete lifecycle hook
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; hookId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { hookId } = await params
    await prisma.chatbotLifecycleHook.delete({
      where: { id: hookId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lifecycle hook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

