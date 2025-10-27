import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { space_ids } = body

    if (!Array.isArray(space_ids)) {
      return NextResponse.json({ error: 'space_ids must be an array' }, { status: 400 })
    }

    // Get the data model to check permissions using Prisma
    const dataModel = await db.dataModel.findUnique({
      where: { id: params.id },
      select: { spaceIds: true }
    })

    if (!dataModel) {
      return NextResponse.json({ error: 'Data model not found' }, { status: 404 })
    }

    // Check if user has admin/owner access to the original space
    const originalSpaceId = dataModel.spaceIds?.[0]
    if (!originalSpaceId) {
      return NextResponse.json({ error: 'Data model has no original space' }, { status: 400 })
    }

    const spaceMember = await db.spaceMember.findFirst({
      where: {
        spaceId: originalSpaceId,
        userId: session.user.id
      },
      select: { role: true }
    })

    if (!spaceMember || !['admin', 'owner'].includes(spaceMember.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validate that all target spaces exist and user has access using Prisma
    if (space_ids.length > 0) {
      const targetSpaces = await db.spaceMember.findMany({
        where: {
          userId: session.user.id,
          spaceId: { in: space_ids }
        },
        select: { spaceId: true }
      })

      const accessibleSpaceIds = targetSpaces.map(s => s.spaceId)
      const invalidSpaceIds = space_ids.filter(id => !accessibleSpaceIds.includes(id))
      
      if (invalidSpaceIds.length > 0) {
        return NextResponse.json({ 
          error: `Access denied to spaces: ${invalidSpaceIds.join(', ')}` 
        }, { status: 403 })
      }
    }

    // Update the data model with new space_ids using Prisma
    const updatedModel = await db.dataModel.update({
      where: { id: params.id },
      data: {
        spaceIds: [originalSpaceId, ...space_ids],
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      dataModel: updatedModel,
      message: 'Sharing updated successfully'
    })
  } catch (error) {
    console.error('Share data model API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
