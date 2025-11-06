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
    const spaceIds = searchParams.get('spaceIds')?.split(',') || []
    const spaceId = searchParams.get('spaceId') // For backward compatibility
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assignedTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build space filter - support multiple spaces or all spaces
    const spaceFilter: string[] = []
    if (spaceId) spaceFilter.push(spaceId)
    if (spaceIds.length > 0) spaceFilter.push(...spaceIds)

    // If no space filter provided, get all spaces user has access to
    let accessibleSpaceIds: string[] = []
    if (spaceFilter.length === 0) {
      // Get all spaces where user is a member or owner
      const userSpaces = await db.space.findMany({
        where: {
          OR: [
            { createdBy: session.user.id },
            {
              members: {
                some: {
                  userId: session.user.id
                }
              }
            }
          ],
          deletedAt: null
        },
        select: {
          id: true
        }
      })
      accessibleSpaceIds = userSpaces.map(s => s.id)
      
      // If user has no accessible spaces, return empty result
      if (accessibleSpaceIds.length === 0) {
        return NextResponse.json({
          tickets: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          }
        })
      }
    } else {
      // Check if user has access to all requested spaces
      for (const sid of spaceFilter) {
        const spaceAccess = await db.spaceMember.findFirst({
          where: {
            spaceId: sid,
            userId: session.user.id
          }
        })

        const isSpaceOwner = await db.space.findFirst({
          where: {
            id: sid,
            createdBy: session.user.id
          }
        })

        if (!spaceAccess && !isSpaceOwner) {
          return NextResponse.json({ error: `Access denied to space ${sid}` }, { status: 403 })
        }
      }
      accessibleSpaceIds = spaceFilter
    }

    // Build where clause - tickets that belong to any of the accessible spaces
    const where: any = {
      deletedAt: null,
      spaces: {
        some: {
          spaceId: {
            in: accessibleSpaceIds
          }
        }
      }
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (assignedTo) {
      where.assignees = {
        some: {
          userId: assignedTo
        }
      }
    }

    const skip = (page - 1) * limit

    const [tickets, total] = await Promise.all([
      db.ticket.findMany({
        where,
        include: {
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
          },
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
          tags: true,
          attributes: {
            orderBy: {
              sortOrder: 'asc'
            }
          },
          subtasks: {
            where: {
              deletedAt: null
            }
          },
          parent: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      db.ticket.count({ where })
    ])

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
      spaceIds, // Now supports multiple spaces
      spaceId, // For backward compatibility
      tags,
      estimate,
      attributes,
      parentId
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Support both spaceIds array and single spaceId
    const finalSpaceIds = spaceIds && spaceIds.length > 0 ? spaceIds : (spaceId ? [spaceId] : [])

    if (finalSpaceIds.length === 0) {
      return NextResponse.json({ error: 'spaceId or spaceIds is required' }, { status: 400 })
    }

    // Check if user has access to all spaces
    for (const sid of finalSpaceIds) {
      const spaceAccess = await db.spaceMember.findFirst({
        where: {
          spaceId: sid,
          userId: session.user.id
        }
      })

      const isSpaceOwner = await db.space.findFirst({
        where: {
          id: sid,
          createdBy: session.user.id
        }
      })

      if (!spaceAccess && !isSpaceOwner) {
        return NextResponse.json({ error: `Access denied to space ${sid}` }, { status: 403 })
      }
    }

    // Create ticket
    const ticket = await db.ticket.create({
      data: {
        title,
        description: description || null,
        status: status || 'BACKLOG',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        createdBy: session.user.id,
        estimate: estimate || null,
        parentId: parentId || null,
        spaces: {
          create: finalSpaceIds.map((sid: string) => ({
            spaceId: sid
          }))
        },
        assignees: assignedTo && assignedTo.length > 0 ? {
          create: assignedTo.map((userId: string) => ({
            userId,
            role: 'ASSIGNEE'
          }))
        } : undefined,
        tags: tags && tags.length > 0 ? {
          create: tags.map((tag: any) => ({
            name: tag.name || tag,
            color: tag.color || null
          }))
        } : undefined,
        attributes: attributes && attributes.length > 0 ? {
          create: attributes.map((attr: any, index: number) => ({
            name: attr.name,
            displayName: attr.displayName || attr.name,
            type: attr.type || 'TEXT',
            value: attr.value || null,
            jsonValue: attr.jsonValue || null,
            isRequired: attr.isRequired || false,
            sortOrder: attr.sortOrder !== undefined ? attr.sortOrder : index
          }))
        } : undefined
      },
      include: {
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
        },
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
        tags: true,
        attributes: {
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
