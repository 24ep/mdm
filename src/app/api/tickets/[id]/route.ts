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

    const ticket = await db.ticket.findUnique({
      where: {
        id: params.id,
        deletedAt: null
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        attributes: {
          orderBy: {
            sortOrder: 'asc'
          }
        },
        spaces: {
          include: {
            space: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if user has access to any of the ticket's spaces
    if (!ticket.spaces || ticket.spaces.length === 0) {
      return NextResponse.json({ error: 'Ticket has no associated spaces' }, { status: 404 })
    }

    let hasAccess = false
    for (const ticketSpace of ticket.spaces) {
      const spaceAccess = await db.spaceMember.findFirst({
        where: {
          spaceId: ticketSpace.spaceId,
          userId: session.user.id
        }
      })

      const isSpaceOwner = await db.space.findFirst({
        where: {
          id: ticketSpace.spaceId,
          createdBy: session.user.id
        }
      })

      if (spaceAccess || isSpaceOwner) {
        hasAccess = true
        break
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      startDate,
      assignedTo,
      labels,
      estimate,
      attributes
    } = body

    // Check if ticket exists and user has access
    const existingTicket = await db.ticket.findUnique({
      where: { id: params.id },
      include: { space: true }
    })

    if (!existingTicket || existingTicket.deletedAt) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if user has access to this space
    const spaceAccess = await db.spaceMember.findFirst({
      where: {
        spaceId: existingTicket.spaceId,
        userId: session.user.id
      }
    })

    const isSpaceOwner = await db.space.findFirst({
      where: {
        id: existingTicket.spaceId,
        createdBy: session.user.id
      }
    })

    if (!spaceAccess && !isSpaceOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) {
      updateData.status = status
      if (status === 'DONE' && !existingTicket.completedAt) {
        updateData.completedAt = new Date()
      } else if (status !== 'DONE' && existingTicket.completedAt) {
        updateData.completedAt = null
      }
    }
    if (priority !== undefined) updateData.priority = priority
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null
    if (labels !== undefined) updateData.labels = labels
    if (estimate !== undefined) updateData.estimate = estimate

    // Update ticket
    const ticket = await db.ticket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        attributes: {
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    })

    // Update attributes if provided
    if (attributes && Array.isArray(attributes)) {
      // Delete existing attributes
      await db.ticketAttribute.deleteMany({
        where: { ticketId: params.id }
      })

      // Create new attributes
      if (attributes.length > 0) {
        await db.ticketAttribute.createMany({
          data: attributes.map((attr: any, index: number) => ({
            ticketId: params.id,
            name: attr.name,
            displayName: attr.displayName || attr.name,
            type: attr.type || 'TEXT',
            value: attr.value || null,
            jsonValue: attr.jsonValue || null,
            isRequired: attr.isRequired || false,
            sortOrder: attr.sortOrder !== undefined ? attr.sortOrder : index
          }))
        })
      }

      // Reload ticket with updated attributes
      const ticketWithAttributes = await db.ticket.findUnique({
        where: { id: params.id },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          attributes: {
            orderBy: {
              sortOrder: 'asc'
            }
          }
        }
      })

      return NextResponse.json(ticketWithAttributes)
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error updating ticket:', error)
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

    // Check if ticket exists and user has access
    const existingTicket = await db.ticket.findUnique({
      where: { id: params.id },
      include: { space: true }
    })

    if (!existingTicket || existingTicket.deletedAt) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if user has access to this space
    const spaceAccess = await db.spaceMember.findFirst({
      where: {
        spaceId: existingTicket.spaceId,
        userId: session.user.id
      }
    })

    const isSpaceOwner = await db.space.findFirst({
      where: {
        id: existingTicket.spaceId,
        createdBy: session.user.id
      }
    })

    if (!spaceAccess && !isSpaceOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Soft delete
    await db.ticket.update({
      where: { id: params.id },
      data: { deletedAt: new Date() }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

