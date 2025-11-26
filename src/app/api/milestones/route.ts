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
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')

    const where: any = {
      deletedAt: null
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (status) {
      where.status = status
    }

    const milestones = await db.milestone.findMany({
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
        project: {
          select: {
            id: true,
            name: true,
            spaceId: true
          }
        },
        _count: {
          select: { tickets: true }
        }
      },
      orderBy: {
        position: 'asc'
      }
    })

    return NextResponse.json({ milestones })
  } catch (error: any) {
    console.error('Error fetching milestones:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch milestones' },
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
    const { name, description, status, startDate, dueDate, projectId, metadata } = body

    if (!name || !projectId) {
      return NextResponse.json(
        { error: 'Name and projectId are required' },
        { status: 400 }
      )
    }

    // Check if user has access to the project's space
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        space: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const hasAccess = 
      project.space.createdBy === session.user.id ||
      project.space.members.length > 0

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to project' }, { status: 403 })
    }

    // Get max position for milestones in this project
    const maxPosition = await db.milestone.findFirst({
      where: { projectId },
      orderBy: { position: 'desc' },
      select: { position: true }
    })

    const milestone = await db.milestone.create({
      data: {
        name,
        description,
        status: status || 'UPCOMING',
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        createdBy: session.user.id,
        position: (maxPosition?.position || 0) + 1,
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
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ milestone }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating milestone:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create milestone' },
      { status: 500 }
    )
  }
}

