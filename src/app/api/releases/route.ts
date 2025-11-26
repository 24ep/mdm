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

    const releases = await db.release.findMany({
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
        targetDate: 'desc'
      }
    })

    return NextResponse.json({ releases })
  } catch (error: any) {
    console.error('Error fetching releases:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch releases' },
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
    const { name, version, description, status, targetDate, releaseDate, projectId, metadata } = body

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

    // Check if version already exists for this project
    if (version) {
      const existingRelease = await db.release.findFirst({
        where: {
          projectId,
          version,
          deletedAt: null
        }
      })

      if (existingRelease) {
        return NextResponse.json(
          { error: `Release with version ${version} already exists for this project` },
          { status: 400 }
        )
      }
    }

    const release = await db.release.create({
      data: {
        name,
        version: version || null,
        description,
        status: status || 'PLANNED',
        targetDate: targetDate ? new Date(targetDate) : null,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        projectId,
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
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ release }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating release:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create release' },
      { status: 500 }
    )
  }
}

