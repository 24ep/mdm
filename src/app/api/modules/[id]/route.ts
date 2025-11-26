import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { validateBody, validateParams } from '@/lib/api-validation'
import { commonSchemas } from '@/lib/api-validation'

const updateModuleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional().nullable(),
  targetDate: z.string().datetime().optional().nullable(),
  leadId: z.string().uuid().optional().nullable(),
  position: z.number().int().optional(),
  metadata: z.record(z.any()).optional(),
})

// Get a specific module
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))

    if (!paramValidation.success) {
      return paramValidation.response
    }

    const { id } = paramValidation.data

    const module = await db.module.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        lead: {
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
        tickets: {
          where: { deletedAt: null },
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
            tags: true
          },
          orderBy: { position: 'asc' }
        }
      }
    })

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Check access
    const spaceMember = await db.spaceMember.findFirst({
      where: { spaceId: module.project.spaceId, userId: session.user.id }
    })
    const isSpaceOwner = await db.space.findFirst({
      where: { id: module.project.spaceId, createdBy: session.user.id }
    })

    if (!spaceMember && !isSpaceOwner) {
      return NextResponse.json(
        { error: 'Forbidden: Not a member or owner of the module\'s space' },
        { status: 403 }
      )
    }

    // Calculate progress
    const total = module.tickets.length
    const completed = module.tickets.filter(t => t.status === 'DONE' || t.status === 'CANCELLED').length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0

    return NextResponse.json({
      success: true,
      module: {
        ...module,
        progress,
        totalTickets: total,
        completedTickets: completed
      }
    })
  } catch (error: any) {
    console.error('Error fetching module:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch module' },
      { status: 500 }
    )
  }
}

// Update a module
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))

    if (!paramValidation.success) {
      return paramValidation.response
    }

    const { id } = paramValidation.data

    const bodyValidation = await validateBody(request, updateModuleSchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const updateData = bodyValidation.data

    // Get module to check access
    const existingModule = await db.module.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            spaceId: true
          }
        }
      }
    })

    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Check access
    const spaceMember = await db.spaceMember.findFirst({
      where: { spaceId: existingModule.project.spaceId, userId: session.user.id }
    })
    const isSpaceOwner = await db.space.findFirst({
      where: { id: existingModule.project.spaceId, createdBy: session.user.id }
    })

    if (!spaceMember && !isSpaceOwner) {
      return NextResponse.json(
        { error: 'Forbidden: Not a member or owner of the module\'s space' },
        { status: 403 }
      )
    }

    // Prepare update data
    const data: any = {}
    if (updateData.name !== undefined) data.name = updateData.name
    if (updateData.description !== undefined) data.description = updateData.description
    if (updateData.status !== undefined) {
      data.status = updateData.status
      if (updateData.status === 'COMPLETED' && !existingModule.completedAt) {
        data.completedAt = new Date()
      } else if (updateData.status !== 'COMPLETED') {
        data.completedAt = null
      }
    }
    if (updateData.startDate !== undefined) data.startDate = updateData.startDate ? new Date(updateData.startDate) : null
    if (updateData.targetDate !== undefined) data.targetDate = updateData.targetDate ? new Date(updateData.targetDate) : null
    if (updateData.leadId !== undefined) data.leadId = updateData.leadId
    if (updateData.position !== undefined) data.position = updateData.position
    if (updateData.metadata !== undefined) data.metadata = updateData.metadata

    const module = await db.module.update({
      where: { id },
      data,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        lead: {
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

    return NextResponse.json({ success: true, module })
  } catch (error: any) {
    console.error('Error updating module:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update module' },
      { status: 500 }
    )
  }
}

// Delete a module
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))

    if (!paramValidation.success) {
      return paramValidation.response
    }

    const { id } = paramValidation.data

    // Get module to check access
    const existingModule = await db.module.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            spaceId: true
          }
        }
      }
    })

    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Check access
    const spaceMember = await db.spaceMember.findFirst({
      where: { spaceId: existingModule.project.spaceId, userId: session.user.id }
    })
    const isSpaceOwner = await db.space.findFirst({
      where: { id: existingModule.project.spaceId, createdBy: session.user.id }
    })

    if (!spaceMember && !isSpaceOwner) {
      return NextResponse.json(
        { error: 'Forbidden: Not a member or owner of the module\'s space' },
        { status: 403 }
      )
    }

    // Soft delete
    await db.module.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    return NextResponse.json({ success: true, message: 'Module deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting module:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete module' },
      { status: 500 }
    )
  }
}

