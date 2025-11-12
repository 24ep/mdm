import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatbotId } = await params
    const body = await request.json()
    const { version } = body

    // TODO: Publish chatbot version
    // 1. Create a new version record
    // 2. Mark it as published
    // 3. Update chatbot to point to this version
    // 4. Generate embed code

    // const chatbot = await prisma.chatbot.findUnique({ where: { id: chatbotId } })
    // if (!chatbot) {
    //   return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
    // }

    // const newVersion = await prisma.chatbotVersion.create({
    //   data: {
    //     chatbotId: chatbotId,
    //     version: version || chatbot.currentVersion,
    //     createdBy: session.user.id,
    //     isPublished: true
    //   }
    // })

    // await prisma.chatbot.update({
    //   where: { id: chatbotId },
    //   data: {
    //     isPublished: true,
    //     currentVersion: newVersion.version
    //   }
    // })

    return NextResponse.json({ 
      success: true,
      message: 'Chatbot published successfully'
    })
  } catch (error) {
    console.error('Error publishing chatbot:', error)
    return NextResponse.json({ error: 'Failed to publish chatbot' }, { status: 500 })
  }
}

