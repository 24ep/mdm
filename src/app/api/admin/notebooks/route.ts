import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
  } catch (error) {
    console.error('Error fetching notebooks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
  } catch (error) {
    console.error('Error creating notebook:', error)
    return NextResponse.json({ error: 'Failed to create notebook' }, { status: 500 })
  }
}
