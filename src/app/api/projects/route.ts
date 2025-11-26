import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')
    const status = searchParams.get('status')

    const where: any = {
      deletedAt: null
    }

    if (spaceId) {
      where.spaceId = spaceId
    }

    if (status) {
      where.status = status
    }

    const projects = await db.project.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        milestones: {
          where: { deletedAt: null },
          orderBy: { position: 'asc' },
          include: {
            _count: {
              select: { tickets: true }
            }
          }
        },
        _count: {
          select: {
            tickets: true,
            milestones: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ projects })
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, status, startDate, endDate, spaceId, metadata } = body

    if (!name || !spaceId) {
      return NextResponse.json(
        { error: 'Name and spaceId are required' },
        { status: 400 }
      )
    }

    // Check if user has access to the space
    const spaceMember = await db.spaceMember.findFirst({
      where: {
        spaceId,
        userId: session.user.id
      }
    })

    const space = await db.space.findFirst({
      where: {
        id: spaceId,
        createdBy: session.user.id
      }
    })

    if (!spaceMember && !space) {
      return NextResponse.json({ error: 'Access denied to space' }, { status: 403 })
    }

    const project = await db.project.create({
      data: {
        name,
        description,
        status: status || 'PLANNING',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        spaceId,
        createdBy: session.user.id,
        metadata: metadata || {}
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    )
  }
}

