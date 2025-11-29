import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function getHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')

    // Build query conditions
    const where: any = {
      deletedAt: null
    }

    if (spaceId && spaceId !== 'all') {
      where.spaceId = spaceId
    }

    // Get notebooks
    const notebooks = await db.notebook.findMany({
      where,
      include: {
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({ notebooks })
  , { status: 500 })
  }
}





export const GET = withErrorHandling(getHandler, 'GET GET /api/admin/notebooks')
export const GET = withErrorHandling(getHandler, 'GET /api/src\app\api\admin\notebooks\route.ts')
async function postHandler(request: NextRequest) {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\admin\notebooks\route.ts')

    const body = await request.json()
    const { name, description, spaceId, tags = [], isPublic = false } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Notebook name is required' }, { status: 400 })
    }

    // If spaceId is provided, verify user has access to the space
    if (spaceId && spaceId !== 'all') {
      const spaceMember = await db.spaceMember.findFirst({
        where: {
          spaceId: spaceId,
          userId: session.user.id
        }
      })

      if (!spaceMember) {
        return NextResponse.json({ error: 'Access denied to space' }, { status: 403 })
      }
    }

    // Create the notebook
    const notebook = await db.notebook.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        content: {},
        cells: [],
        tags: tags,
        isPublic: isPublic,
        author: session.user.id,
        spaceId: spaceId && spaceId !== 'all' ? spaceId : null
      },
      include: {
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json({ notebook }, { status: 201 })
  , { status: 500 })
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/admin/notebooks')
