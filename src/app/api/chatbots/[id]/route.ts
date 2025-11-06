import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Public endpoint - no auth required for published chatbots
    const { id } = params

    // For now, return mock data or fetch from localStorage equivalent
    // In production, fetch from database:
    // const chatbot = await prisma.chatbot.findUnique({ 
    //   where: { id, isPublished: true },
    //   include: { versions: { where: { isPublished: true } } }
    // })
    
    // For now, return a structure that the embed script can use
    // The embed script will try to load from localStorage first as fallback
    return NextResponse.json({ 
      chatbot: null,
      message: 'Chatbot config should be loaded client-side'
    })
  } catch (error) {
    console.error('Error fetching chatbot:', error)
    return NextResponse.json({ error: 'Failed to fetch chatbot' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // TODO: Update in database
    // const chatbot = await prisma.chatbot.update({
    //   where: { id },
    //   data: body
    // })

    return NextResponse.json({ chatbot: { id, ...body } })
  } catch (error) {
    console.error('Error updating chatbot:', error)
    return NextResponse.json({ error: 'Failed to update chatbot' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // TODO: Delete from database
    // await prisma.chatbot.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chatbot:', error)
    return NextResponse.json({ error: 'Failed to delete chatbot' }, { status: 500 })
  }
}

