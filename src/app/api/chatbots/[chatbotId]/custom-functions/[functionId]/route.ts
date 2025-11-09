import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - Get custom function
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; functionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatbotId, functionId } = await params
    const func = await prisma.chatbotCustomFunction.findUnique({
      where: { id: functionId },
    })

    if (!func || func.chatbotId !== chatbotId) {
      return NextResponse.json({ error: 'Function not found' }, { status: 404 })
    }

    return NextResponse.json({ function: func })
  } catch (error) {
    console.error('Error fetching custom function:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update custom function
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; functionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { functionId } = await params
    const body = await request.json()
    const { name, description, parameters, endpoint, code, executionType, enabled, metadata } = body

    const func = await prisma.chatbotCustomFunction.update({
      where: { id: functionId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(parameters && { parameters }),
        ...(endpoint !== undefined && { endpoint: endpoint || null }),
        ...(code !== undefined && { code: code || null }),
        ...(executionType && { executionType }),
        ...(enabled !== undefined && { enabled }),
        ...(metadata && { metadata }),
      },
    })

    return NextResponse.json({ function: func })
  } catch (error) {
    console.error('Error updating custom function:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete custom function
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; functionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { functionId } = await params
    await prisma.chatbotCustomFunction.delete({
      where: { id: functionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting custom function:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

