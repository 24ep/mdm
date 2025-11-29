import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - List all storage connections
async function getHandler(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const connections = await prisma.storageConnection.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ connections })
  , { status: 500 })
  }
}

// POST - Create a new storage connection




export const GET = withErrorHandling(getHandler, 'GET GET /api/admin/storage/connections')
export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\admin\storage\connections\route.ts')
async function postHandler(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\admin\storage\connections\route.ts')

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { name, type, description, isActive, config } = await request.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!type || typeof type !== 'string') {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 })
    }

    const validTypes = ['minio', 's3', 'sftp', 'onedrive', 'google_drive']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid storage type' }, { status: 400 })
    }

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Config is required' }, { status: 400 })
    }

    const connection = await prisma.storageConnection.create({
      data: {
        name,
        type,
        description: description || null,
        isActive: isActive !== false,
        config: config as any,
        status: 'disconnected'
      }
    })

    return NextResponse.json({ connection })
  , { status: 500 })
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/admin/storage/connections')

