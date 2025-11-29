import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { getSecretsManager } from '@/lib/secrets-manager'

/**
 * GET /api/admin/secrets
 * Get secrets list and health status
 */
async function getHandler(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

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
  ,
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/secrets/health
 * Check Vault health
 */




export const GET = withErrorHandling(getHandler, 'GET GET /api/admin/secrets')
export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\admin\secrets\route.ts')
async function postHandler(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\admin\secrets\route.ts')

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
  ,
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/admin/secrets')


