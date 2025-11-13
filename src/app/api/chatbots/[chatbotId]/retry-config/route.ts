import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - Get retry config
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
    const config = await prisma.chatbotRetryConfig.findUnique({
      where: { chatbotId },
    })

    if (!config) {
      return NextResponse.json({ config: null })
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error fetching retry config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST/PUT - Create or update retry config
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
    const {
      enabled,
      maxRetries,
      initialDelay,
      maxDelay,
      backoffMultiplier,
      retryableStatusCodes,
      jitter,
    } = body

    const config = await prisma.chatbotRetryConfig.upsert({
      where: { chatbotId },
      create: {
        chatbotId,
        enabled: enabled ?? true,
        maxRetries: maxRetries ?? 3,
        initialDelay: initialDelay ?? 1000,
        maxDelay: maxDelay ?? 30000,
        backoffMultiplier: backoffMultiplier ?? 2.0,
        retryableStatusCodes: retryableStatusCodes ?? ['500', '502', '503', '504'],
        jitter: jitter ?? true,
      },
      update: {
        enabled: enabled ?? true,
        maxRetries,
        initialDelay,
        maxDelay,
        backoffMultiplier,
        retryableStatusCodes,
        jitter,
      },
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error updating retry config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

