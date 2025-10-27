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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await db.exportProfile.findUnique({
      where: { id: params.id },
      include: {
        exportProfileSharing: true
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Export profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in GET /api/export-profiles/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { name, description, dataModel, format, columns, filters, isPublic, sharing } = body

    // First, check if the user owns this profile using Prisma
    const existingProfile = await db.exportProfile.findUnique({
      where: { id: params.id },
      select: { createdBy: true }
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Export profile not found' }, { status: 404 })
    }

    if (existingProfile.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update the export profile using Prisma
    const profile = await db.exportProfile.update({
      where: { id: params.id },
      data: {
        name,
        description,
        dataModel: dataModel,
        format,
        columns: columns || [],
        filters: filters || [],
        isPublic: isPublic || false,
        updatedAt: new Date()
      }
    })

    // Update sharing configurations if provided using Prisma
    if (sharing !== undefined) {
      // Delete existing sharing configurations
      await db.exportProfileSharing.deleteMany({
        where: { profileId: params.id }
      })

      // Insert new sharing configurations
      if (sharing.length > 0) {
        const sharingData = sharing.map((share: any) => ({
          profileId: params.id,
          sharingType: share.type,
          targetId: share.targetId || null,
          targetGroup: share.targetGroup || null
        }))

        try {
          await db.exportProfileSharing.createMany({
            data: sharingData
          })
        } catch (sharingError) {
          console.error('Error updating sharing configurations:', sharingError)
          // Don't fail the request, just log the error
        }
      }
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in PUT /api/export-profiles/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, check if the user owns this profile using Prisma
    const existingProfile = await db.exportProfile.findUnique({
      where: { id: params.id },
      select: { createdBy: true }
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Export profile not found' }, { status: 404 })
    }

    if (existingProfile.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the export profile using Prisma (sharing configurations will be deleted automatically due to CASCADE)
    await db.exportProfile.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Export profile deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/export-profiles/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
