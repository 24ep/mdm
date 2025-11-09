import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - Get rate limit config
export async function GET(
  request: NextRequest,
  { params }: { params: { chatbotId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await prisma.chatbotRateLimit.findUnique({
      where: { chatbotId: params.chatbotId },
    })

    if (!config) {
      return NextResponse.json({ config: null })
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error fetching rate limit config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST/PUT - Create or update rate limit config
export async function POST(
  request: NextRequest,
  { params }: { params: { chatbotId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      enabled,
      maxRequestsPerMinute,
      maxRequestsPerHour,
      maxRequestsPerDay,
      maxRequestsPerMonth,
      burstLimit,
      windowSize,
      blockDuration,
    } = body

    const config = await prisma.chatbotRateLimit.upsert({
      where: { chatbotId: params.chatbotId },
      create: {
        chatbotId: params.chatbotId,
        enabled: enabled ?? true,
        maxRequestsPerMinute,
        maxRequestsPerHour,
        maxRequestsPerDay,
        maxRequestsPerMonth,
        burstLimit,
        windowSize: windowSize ?? 60,
        blockDuration: blockDuration ?? 300,
      },
      update: {
        enabled: enabled ?? true,
        maxRequestsPerMinute,
        maxRequestsPerHour,
        maxRequestsPerDay,
        maxRequestsPerMonth,
        burstLimit,
        windowSize,
        blockDuration,
      },
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error updating rate limit config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

