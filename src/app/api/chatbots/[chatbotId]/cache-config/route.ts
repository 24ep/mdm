import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - Get cache config
export async function GET(
  request: NextRequest,
  { params }: { params: { chatbotId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await prisma.chatbotCacheConfig.findUnique({
      where: { chatbotId: params.chatbotId },
    })

    if (!config) {
      return NextResponse.json({ config: null })
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error fetching cache config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST/PUT - Create or update cache config
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
      ttl,
      maxSize,
      strategy,
      includeContext,
      cacheKeyPrefix,
    } = body

    const config = await prisma.chatbotCacheConfig.upsert({
      where: { chatbotId: params.chatbotId },
      create: {
        chatbotId: params.chatbotId,
        enabled: enabled ?? true,
        ttl: ttl ?? 3600,
        maxSize: maxSize ?? 1000,
        strategy: strategy ?? 'exact',
        includeContext: includeContext ?? false,
        cacheKeyPrefix,
      },
      update: {
        enabled: enabled ?? true,
        ttl,
        maxSize,
        strategy,
        includeContext,
        cacheKeyPrefix,
      },
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error updating cache config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Clear cache
export async function DELETE(
  request: NextRequest,
  { params }: { params: { chatbotId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clearCache } = await import('@/lib/response-cache')
    const config = await prisma.chatbotCacheConfig.findUnique({
      where: { chatbotId: params.chatbotId },
    })

    if (config) {
      await clearCache(params.chatbotId, {
        enabled: config.enabled,
        ttl: config.ttl,
        maxSize: config.maxSize,
        strategy: config.strategy as 'exact' | 'semantic' | 'fuzzy',
        includeContext: config.includeContext,
        cacheKeyPrefix: config.cacheKeyPrefix,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

