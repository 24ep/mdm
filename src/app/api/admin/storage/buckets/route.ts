import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all buckets (spaces as buckets)
async function getHandler(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get all spaces as buckets
    const spaces = await db.space.findMany({
      include: {
        attachmentStorage: {
          select: {
            fileSize: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const buckets = spaces.map(space => ({
      id: space.id,
      name: space.name,
      public: false, // Can be made configurable
      fileCount: space.attachmentStorage.length,
      totalSize: space.attachmentStorage.reduce((sum, file) => sum + (file.fileSize || 0), 0),
      created: space.createdAt,
      spaceId: space.id,
      spaceName: space.name
    }))

    return NextResponse.json({ buckets })
  , { status: 500 })
  }
}

// POST - Create a new bucket (creates a new space)




export const GET = withErrorHandling(getHandler, 'GET GET /api/admin/storage/buckets')
export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\admin\storage\buckets\route.ts')
async function postHandler(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\admin\storage\buckets\route.ts')

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { name, public: isPublic } = await request.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Bucket name is required' }, { status: 400 })
    }

    // Validate bucket name (similar to Supabase: lowercase, alphanumeric, hyphens, underscores)
    if (!/^[a-z0-9_-]+$/.test(name)) {
      return NextResponse.json({ 
        error: 'Bucket name must contain only lowercase letters, numbers, hyphens, and underscores' 
      }, { status: 400 })
    }

    // Check if space with this name already exists
    const existing = await db.space.findFirst({
      where: { name }
    })

    if (existing) {
      return NextResponse.json({ error: 'A bucket with this name already exists' }, { status: 409 })
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-')

    // Create new space (bucket)
    const space = await db.space.create({
      data: {
        name,
        slug,
        description: `Storage bucket: ${name}`,
        createdBy: session.user.id
      }
    })

    // Add owner as admin member
    await db.spaceMember.create({
      data: {
        spaceId: space.id,
        userId: session.user.id,
        role: 'ADMIN'
      }
    })

    return NextResponse.json({
      bucket: {
        id: space.id,
        name: space.name,
        public: isPublic || false,
        fileCount: 0,
        totalSize: 0,
        created: space.createdAt,
        spaceId: space.id,
        spaceName: space.name
      }
    })
  , { status: 500 })
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/admin/storage/buckets')

