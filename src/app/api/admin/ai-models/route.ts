import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function getHandler() {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

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
}





export const GET = withErrorHandling(getHandler, 'GET /api/admin/ai-models')

async function postHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

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
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/ai-models')
