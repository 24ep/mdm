import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const subtasks = await db.ticket.findMany({
      where: {
        parentId: id,
        deletedAt: null
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: {
        position: 'asc'
      }
    })

    return NextResponse.json({ subtasks })
  } catch (error) {
    console.error('Error fetching subtasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, description, status, priority, spaceIds } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Get parent ticket to inherit spaces
    const parentTicket = await db.ticket.findUnique({
      where: { id },
      include: { spaces: true }
    })

    if (!parentTicket) {
      return NextResponse.json({ error: 'Parent ticket not found' }, { status: 404 })
    }

    // Get max position for subtasks
    const maxPosition = await db.ticket.findFirst({
      where: { parentId: id },
      orderBy: { position: 'desc' },
      select: { position: true }
    })

    const finalSpaceIds = spaceIds && spaceIds.length > 0 
      ? spaceIds 
      : parentTicket.spaces.map(ts => ts.spaceId)

    const subtask = await db.ticket.create({
      data: {
        title,
        description: description || null,
        status: status || 'BACKLOG',
        priority: priority || 'MEDIUM',
        parentId: id,
        createdBy: session.user.id,
        position: (maxPosition?.position || 0) + 1,
        spaces: {
          create: finalSpaceIds.map((spaceId: string) => ({
            spaceId
          }))
        }
      },
      include: {
        spaces: {
          include: {
            space: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(subtask, { status: 201 })
  } catch (error) {
    console.error('Error creating subtask:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

