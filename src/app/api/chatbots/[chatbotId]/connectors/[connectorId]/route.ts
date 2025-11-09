import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// PUT - Update connector
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; connectorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { connectorId } = await params
    const body = await request.json()
    const { connectorType, enabled, credentials, config, metadata } = body

    const connector = await prisma.chatbotConnector.update({
      where: { id: connectorId },
      data: {
        ...(connectorType && { connectorType }),
        ...(enabled !== undefined && { enabled }),
        ...(credentials !== undefined && { credentials: credentials || null }),
        ...(config && { config }),
        ...(metadata && { metadata }),
      },
    })

    return NextResponse.json({ connector })
  } catch (error) {
    console.error('Error updating connector:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete connector
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; connectorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { connectorId } = await params
    await prisma.chatbotConnector.delete({
      where: { id: connectorId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting connector:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

