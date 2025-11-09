import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSecretsManager } from '@/lib/secrets-manager'

/**
 * GET /api/admin/secrets
 * Get secrets list and health status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const secretsManager = getSecretsManager()
    const health = await secretsManager.healthCheck()

    // List AI provider secrets
    const aiProviders = await secretsManager.listSecrets('ai-providers')

    // List database connection secrets
    const dbConnections = await secretsManager.listSecrets('database-connections')

    // List external connection secrets
    const externalConnections = await secretsManager.listSecrets('external-connections')

    return NextResponse.json({
      backend: health.backend,
      healthy: health.healthy,
      vaultStatus: health.vaultStatus,
      secrets: {
        aiProviders: aiProviders.length,
        databaseConnections: dbConnections.length,
        externalConnections: externalConnections.length,
      },
      paths: {
        aiProviders,
        databaseConnections: dbConnections,
        externalConnections: externalConnections,
      },
    })
  } catch (error: any) {
    console.error('Error fetching secrets status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch secrets status', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/secrets/health
 * Check Vault health
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'health') {
      const secretsManager = getSecretsManager()
      const health = await secretsManager.healthCheck()
      return NextResponse.json(health)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Error checking secrets health:', error)
    return NextResponse.json(
      { error: 'Failed to check secrets health', details: error.message },
      { status: 500 }
    )
  }
}


