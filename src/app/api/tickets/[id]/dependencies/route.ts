import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [dependencies, dependents] = await Promise.all([
      db.ticketDependency.findMany({
        where: {
          ticketId: params.id
        },
        include: {
          dependsOn: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true
            }
          }
        }
      }),
      db.ticketDependency.findMany({
        where: {
          dependsOnId: params.id
        },
        include: {
          ticket: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true
            }
          }
        }
      })
    ])

    return NextResponse.json({ dependencies, dependents })
  } catch (error) {
    console.error('Error fetching dependencies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dependsOnId, type } = body

    if (!dependsOnId) {
      return NextResponse.json({ error: 'dependsOnId is required' }, { status: 400 })
    }

    if (params.id === dependsOnId) {
      return NextResponse.json({ error: 'Ticket cannot depend on itself' }, { status: 400 })
    }

    // Check if dependency already exists
    const existing = await db.ticketDependency.findUnique({
      where: {
        ticketId_dependsOnId: {
          ticketId: params.id,
          dependsOnId
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Dependency already exists' }, { status: 400 })
    }

    const dependency = await db.ticketDependency.create({
      data: {
        ticketId: params.id,
        dependsOnId,
        type: type || 'BLOCKS'
      },
      include: {
        dependsOn: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json(dependency, { status: 201 })
  } catch (error) {
    console.error('Error creating dependency:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dependsOnId = searchParams.get('dependsOnId')

    if (!dependsOnId) {
      return NextResponse.json({ error: 'dependsOnId is required' }, { status: 400 })
    }

    await db.ticketDependency.delete({
      where: {
        ticketId_dependsOnId: {
          ticketId: params.id,
          dependsOnId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting dependency:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

