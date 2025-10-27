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

    const providers = await prisma.aIProviderConfig.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    const formattedProviders = providers.map(provider => ({
      id: provider.id,
      provider: provider.provider,
      name: provider.name,
      description: provider.description,
      website: provider.website,
      icon: provider.icon,
      isSupported: provider.isSupported,
      apiKey: provider.apiKey ? '***' : null, // Mask the API key for security
      baseUrl: provider.baseUrl,
      customHeaders: provider.customHeaders,
      timeout: provider.timeout,
      retryAttempts: provider.retryAttempts,
      status: provider.status,
      isConfigured: provider.isConfigured,
      lastTested: provider.lastTested,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt
    }))

    return NextResponse.json({ providers: formattedProviders })
  } catch (error) {
    console.error('Error fetching AI providers:', error)
    return NextResponse.json({ error: 'Failed to fetch AI providers' }, { status: 500 })
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
      provider, 
      name, 
      description, 
      website, 
      icon, 
      apiKey, 
      baseUrl, 
      customHeaders, 
      timeout, 
      retryAttempts 
    } = body

    const providerConfig = await prisma.aIProviderConfig.create({
      data: {
        provider,
        name,
        description,
        website,
        icon,
        apiKey,
        baseUrl,
        customHeaders: customHeaders || {},
        timeout: timeout || 30000,
        retryAttempts: retryAttempts || 3,
        status: 'inactive',
        isConfigured: !!apiKey
      }
    })

    const formattedProvider = {
      id: providerConfig.id,
      provider: providerConfig.provider,
      name: providerConfig.name,
      description: providerConfig.description,
      website: providerConfig.website,
      icon: providerConfig.icon,
      isSupported: providerConfig.isSupported,
      apiKey: providerConfig.apiKey ? '***' : null,
      baseUrl: providerConfig.baseUrl,
      customHeaders: providerConfig.customHeaders,
      timeout: providerConfig.timeout,
      retryAttempts: providerConfig.retryAttempts,
      status: providerConfig.status,
      isConfigured: providerConfig.isConfigured,
      lastTested: providerConfig.lastTested,
      createdAt: providerConfig.createdAt,
      updatedAt: providerConfig.updatedAt
    }

    return NextResponse.json({ provider: formattedProvider })
  } catch (error) {
    console.error('Error creating AI provider:', error)
    return NextResponse.json({ error: 'Failed to create AI provider' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      id,
      apiKey, 
      baseUrl, 
      customHeaders, 
      timeout, 
      retryAttempts 
    } = body

    const providerConfig = await prisma.aIProviderConfig.update({
      where: { id },
      data: {
        apiKey,
        baseUrl,
        customHeaders: customHeaders || {},
        timeout: timeout || 30000,
        retryAttempts: retryAttempts || 3,
        isConfigured: !!apiKey,
        status: apiKey ? 'active' : 'inactive'
      }
    })

    const formattedProvider = {
      id: providerConfig.id,
      provider: providerConfig.provider,
      name: providerConfig.name,
      description: providerConfig.description,
      website: providerConfig.website,
      icon: providerConfig.icon,
      isSupported: providerConfig.isSupported,
      apiKey: providerConfig.apiKey ? '***' : null,
      baseUrl: providerConfig.baseUrl,
      customHeaders: providerConfig.customHeaders,
      timeout: providerConfig.timeout,
      retryAttempts: providerConfig.retryAttempts,
      status: providerConfig.status,
      isConfigured: providerConfig.isConfigured,
      lastTested: providerConfig.lastTested,
      createdAt: providerConfig.createdAt,
      updatedAt: providerConfig.updatedAt
    }

    return NextResponse.json({ provider: formattedProvider })
  } catch (error) {
    console.error('Error updating AI provider:', error)
    return NextResponse.json({ error: 'Failed to update AI provider' }, { status: 500 })
  }
}
