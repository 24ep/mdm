import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

// Get all relationships for a ticket (dependencies, project links, etc.)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const ticketId = resolvedParams.id

    // Get ticket
    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: {
        dependencies: {
          include: {
            dependsOn: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                projectId: true,
                milestoneId: true,
                releaseId: true
              }
            }
          }
        },
        dependents: {
          include: {
            ticket: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                projectId: true,
                milestoneId: true,
                releaseId: true
              }
            }
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        milestone: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        release: {
          select: {
            id: true,
            name: true,
            version: true,
            status: true
          }
        },
        parent: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        },
        subtasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Aggregate all relationships
    const relationships = {
      dependencies: ticket.dependencies.map(dep => ({
        id: dep.id,
        type: dep.type,
        relatedTicket: {
          id: dep.dependsOn.id,
          title: dep.dependsOn.title,
          status: dep.dependsOn.status,
          priority: dep.dependsOn.priority,
          projectId: dep.dependsOn.projectId,
          milestoneId: dep.dependsOn.milestoneId,
          releaseId: dep.dependsOn.releaseId
        },
        createdAt: dep.createdAt
      })),
      dependents: ticket.dependents.map(dep => ({
        id: dep.id,
        type: dep.type,
        relatedTicket: {
          id: dep.ticket.id,
          title: dep.ticket.title,
          status: dep.ticket.status,
          priority: dep.ticket.priority,
          projectId: dep.ticket.projectId,
          milestoneId: dep.ticket.milestoneId,
          releaseId: dep.ticket.releaseId
        },
        createdAt: dep.createdAt
      })),
      parent: ticket.parent ? {
        id: ticket.parent.id,
        title: ticket.parent.title,
        status: ticket.parent.status,
        priority: ticket.parent.priority
      } : null,
      children: ticket.subtasks.map(subtask => ({
        id: subtask.id,
        title: subtask.title,
        status: subtask.status,
        priority: subtask.priority
      })),
      project: ticket.project,
      milestone: ticket.milestone,
      release: ticket.release
    }

    return NextResponse.json({
      success: true,
      relationships
    })
  } catch (error: any) {
    console.error('Error fetching relationships:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch relationships' },
      { status: 500 }
    )
  }
}

// Create a relationship
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const ticketId = resolvedParams.id

    const body = await request.json()
    const schema = z.object({
      relatedTicketId: z.string().uuid().optional(),
      projectId: z.string().uuid().optional(),
      milestoneId: z.string().uuid().optional(),
      releaseId: z.string().uuid().optional(),
      parentId: z.string().uuid().optional(),
      type: z.enum(['BLOCKS', 'BLOCKED_BY', 'RELATES_TO', 'PARENT', 'CHILD', 'DUPLICATE', 'CLONES']).optional(),
      metadata: z.record(z.any()).optional()
    })

    const validation = schema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error },
        { status: 400 }
      )
    }

    const { relatedTicketId, projectId, milestoneId, releaseId, parentId, type, metadata } = validation.data

    // Get ticket
    const ticket = await db.ticket.findUnique({
      where: { id: ticketId }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Handle different relationship types
    if (relatedTicketId) {
      // Create dependency relationship
      if (ticketId === relatedTicketId) {
        return NextResponse.json(
          { error: 'Ticket cannot relate to itself' },
          { status: 400 }
        )
      }

      // Check if dependency already exists
      const existing = await db.ticketDependency.findUnique({
        where: {
          ticketId_dependsOnId: {
            ticketId,
            dependsOnId: relatedTicketId
          }
        }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Relationship already exists' },
          { status: 400 }
        )
      }

      const dependency = await db.ticketDependency.create({
        data: {
          ticketId,
          dependsOnId: relatedTicketId,
          type: type || 'RELATES_TO',
          metadata: metadata ? (typeof metadata === 'object' ? metadata : {}) : {}
        }
      })

      return NextResponse.json({
        success: true,
        relationship: dependency
      })
    } else if (projectId || milestoneId || releaseId || parentId) {
      // Update ticket links
      const updateData: any = {}
      if (projectId !== undefined) updateData.projectId = projectId
      if (milestoneId !== undefined) updateData.milestoneId = milestoneId
      if (releaseId !== undefined) updateData.releaseId = releaseId
      if (parentId !== undefined) updateData.parentId = parentId

      const updated = await db.ticket.update({
        where: { id: ticketId },
        data: updateData
      })

      return NextResponse.json({
        success: true,
        relationship: updated
      })
    } else {
      return NextResponse.json(
        { error: 'At least one relationship field is required' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error creating relationship:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create relationship' },
      { status: 500 }
    )
  }
}

// Delete a relationship
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const ticketId = resolvedParams.id

    const { searchParams } = new URL(request.url)
    const relationshipId = searchParams.get('relationshipId')
    const relationshipType = searchParams.get('type') // 'dependency', 'project', 'milestone', 'release', 'parent'

    if (!relationshipId && !relationshipType) {
      return NextResponse.json(
        { error: 'relationshipId or type is required' },
        { status: 400 }
      )
    }

    if (relationshipId) {
      // Delete dependency relationship
      await db.ticketDependency.delete({
        where: { id: relationshipId }
      })
    } else if (relationshipType) {
      // Remove link from ticket
      const updateData: any = {}
      if (relationshipType === 'project') updateData.projectId = null
      if (relationshipType === 'milestone') updateData.milestoneId = null
      if (relationshipType === 'release') updateData.releaseId = null
      if (relationshipType === 'parent') updateData.parentId = null

      await db.ticket.update({
        where: { id: ticketId },
        data: updateData
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Relationship deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting relationship:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete relationship' },
      { status: 500 }
    )
  }
}

