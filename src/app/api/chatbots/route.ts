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

    // For now, we'll use a simple in-memory or JSON file approach
    // In production, you'd want to add a Chatbot model to Prisma schema
    // For this implementation, we'll use a workaround with existing tables or create a simple storage
    
    // Mock data for now - replace with actual database queries
    const chatbots = [] // Will be populated from database
    
    return NextResponse.json({ chatbots })
  } catch (error) {
    console.error('Error fetching chatbots:', error)
    return NextResponse.json({ error: 'Failed to fetch chatbots' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      website,
      description,
      apiEndpoint,
      apiAuthType,
      apiAuthValue,
      logo,
      primaryColor,
      fontFamily,
      fontSize,
      fontColor,
      borderColor,
      borderWidth,
      borderRadius,
      messageBoxColor,
      shadowColor,
      shadowBlur,
      conversationOpener,
      followUpQuestions,
      enableFileUpload,
      showCitations,
      deploymentType,
      currentVersion
    } = body

    if (!name || !website || !apiEndpoint) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create chatbot - in production, use Prisma to save to database
    // For now, we'll return a mock response
    const chatbot = {
      id: `chatbot-${Date.now()}`,
      name,
      website,
      description: description || '',
      apiEndpoint,
      apiAuthType: apiAuthType || 'none',
      apiAuthValue: apiAuthValue || '',
      logo: logo || '',
      primaryColor: primaryColor || '#3b82f6',
      fontFamily: fontFamily || 'Inter',
      fontSize: fontSize || '14px',
      fontColor: fontColor || '#000000',
      borderColor: borderColor || '#e5e7eb',
      borderWidth: borderWidth || '1px',
      borderRadius: borderRadius || '8px',
      messageBoxColor: messageBoxColor || '#ffffff',
      shadowColor: shadowColor || '#000000',
      shadowBlur: shadowBlur || '4px',
      conversationOpener: conversationOpener || 'Hello! How can I help you today?',
      followUpQuestions: followUpQuestions || [],
      enableFileUpload: enableFileUpload || false,
      showCitations: showCitations !== undefined ? showCitations : true,
      deploymentType: deploymentType || 'popover',
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: [{
        id: `version-${Date.now()}`,
        version: currentVersion || '1.0.0',
        createdAt: new Date(),
        createdBy: session.user.id,
        isPublished: false
      }],
      currentVersion: currentVersion || '1.0.0'
    }

    // TODO: Save to database using Prisma
    // await prisma.chatbot.create({ data: chatbot })

    return NextResponse.json({ chatbot }, { status: 201 })
  } catch (error) {
    console.error('Error creating chatbot:', error)
    return NextResponse.json({ error: 'Failed to create chatbot' }, { status: 500 })
  }
}

