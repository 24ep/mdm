import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { schemaMigration } from '@/lib/schema-migration'

async function getHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    await schemaMigration.initialize()
    const migrations = await schemaMigration.getMigrations()

    return NextResponse.json(migrations)
  ,
      { status: 500 }
    )
  }
}





export const GET = withErrorHandling(getHandler, 'GET GET /api/schema/migrations')
export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\schema\migrations\route.ts')
async function postHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\schema\migrations\route.ts')

    const body = await request.json()
    await schemaMigration.initialize()
    const migrationId = await schemaMigration.createMigration(body)
    const migrations = await schemaMigration.getMigrations()
    const migration = migrations.find(m => m.id === migrationId)

    return NextResponse.json(migration, { status: 201 })
  ,
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/schema/migrations')

