import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - Get multi-agent config
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
    const config = await prisma.chatbotMultiAgentConfig.findUnique({
      where: { chatbotId },
    })

    return NextResponse.json({ config: config || null })
  } catch (error) {
    console.error('Error fetching multi-agent config:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// POST - Create or update multi-agent config
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
    const { enabled, agents, handoffRules, coordinationStrategy, metadata } = body

    // Make agents optional for updates - allow empty array
    const agentsArray = agents && Array.isArray(agents) ? agents : []

    const config = await prisma.chatbotMultiAgentConfig.upsert({
      where: { chatbotId },
      create: {
        chatbotId,
        enabled: enabled !== undefined ? enabled : false,
        agents: agentsArray,
        handoffRules: handoffRules || {},
        coordinationStrategy: coordinationStrategy || null,
        metadata: metadata || {},
      },
      update: {
        enabled: enabled !== undefined ? enabled : undefined,
        agents: agentsArray.length > 0 ? agentsArray : undefined,
        handoffRules: handoffRules !== undefined ? handoffRules : undefined,
        coordinationStrategy: coordinationStrategy !== undefined ? coordinationStrategy : undefined,
        metadata: metadata !== undefined ? metadata : undefined,
      },
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error updating multi-agent config:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

