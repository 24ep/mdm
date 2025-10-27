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

    const models = await prisma.aIModel.findMany({
      where: {
        isAvailable: true
      },
      orderBy: [
        { provider: 'asc' },
        { name: 'asc' }
      ]
    })

    const formattedModels = models.map(model => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      type: model.type,
      description: model.description,
      maxTokens: model.maxTokens,
      costPerToken: model.costPerToken,
      isAvailable: model.isAvailable,
      capabilities: model.capabilities || [],
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    }))

    return NextResponse.json({ models: formattedModels })
  } catch (error) {
    console.error('Error fetching AI models:', error)
    return NextResponse.json({ error: 'Failed to fetch AI models' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, provider, type, description, maxTokens, costPerToken, capabilities } = body

    const model = await prisma.aIModel.create({
      data: {
        name,
        provider,
        type: type || 'text',
        description,
        maxTokens: maxTokens || 4096,
        costPerToken: costPerToken || 0.000001,
        capabilities: capabilities || [],
        isAvailable: true
      }
    })

    const formattedModel = {
      id: model.id,
      name: model.name,
      provider: model.provider,
      type: model.type,
      description: model.description,
      maxTokens: model.maxTokens,
      costPerToken: model.costPerToken,
      isAvailable: model.isAvailable,
      capabilities: model.capabilities || [],
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    }

    return NextResponse.json({ model: formattedModel })
  } catch (error) {
    console.error('Error creating AI model:', error)
    return NextResponse.json({ error: 'Failed to create AI model' }, { status: 500 })
  }
}
