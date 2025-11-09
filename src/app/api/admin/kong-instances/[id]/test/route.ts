import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { KongClient } from '@/lib/kong-client'
import { createAuditContext } from '@/lib/audit-context-helper'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const instance = await prisma.kongInstance.findUnique({
      where: { id: params.id },
    })

    if (!instance) {
      return NextResponse.json(
        { error: 'Kong instance not found' },
        { status: 404 }
      )
    }

    // Get API key
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    let apiKey: string | undefined

    if (instance.adminApiKey) {
      if (useVault) {
        try {
          const auditContext = createAuditContext(request, session.user, 'Kong instance connection test')
          const secret = await secretsManager.getSecret(
            `kong-instances/${instance.id}/admin-api-key`,
            undefined,
            auditContext
          )
          apiKey = secret?.adminApiKey
        } catch (error) {
          console.warn('Failed to get Kong API key from Vault:', error)
        }
      } else {
        try {
          apiKey = decryptApiKey(instance.adminApiKey)
        } catch (error) {
          console.warn('Failed to decrypt Kong API key:', error)
        }
      }
    }

    // Test connection
    const kongClient = new KongClient(instance.adminUrl, apiKey)
    const isConnected = await kongClient.testConnection()

    let nodeInfo = null
    if (isConnected) {
      try {
        nodeInfo = await kongClient.getNodeInfo()
      } catch (error) {
        console.warn('Failed to get Kong node info:', error)
      }
    }

    // Update status
    await prisma.kongInstance.update({
      where: { id: params.id },
      data: {
        status: isConnected ? 'connected' : 'disconnected',
        lastConnected: isConnected ? new Date() : null,
      },
    })

    return NextResponse.json({
      connected: isConnected,
      nodeInfo,
      message: isConnected
        ? 'Successfully connected to Kong'
        : 'Failed to connect to Kong',
    })
  } catch (error: any) {
    console.error('Error testing Kong connection:', error)
    return NextResponse.json(
      {
        connected: false,
        error: error.message || 'Failed to test Kong connection',
      },
      { status: 500 }
    )
  }
}

