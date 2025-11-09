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

    const { id } = params

    const profile = await db.importProfile.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { createdBy: session.user.id },
          { space: { members: { some: { userId: session.user.id } } } }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        jobs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fileName: true,
            status: true,
            progress: true,
            createdAt: true
          }
        }
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Import profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in GET /api/import-profiles/[id]:', error)
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

    const { id } = params
    const body = await request.json()

    // Check if profile exists and user has access
    const existingProfile = await db.importProfile.findFirst({
      where: {
        id,
        deletedAt: null,
        createdBy: session.user.id
      }
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Import profile not found or access denied' }, { status: 404 })
    }

    const { name, description, dataModelId, mapping, settings, spaceId } = body

    const updatedProfile = await db.importProfile.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(dataModelId && { dataModelId }),
        ...(mapping && { mapping }),
        ...(settings && { settings }),
        ...(spaceId !== undefined && { spaceId })
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    console.error('Error in PUT /api/import-profiles/[id]:', error)
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

    const { id } = params

    // Check if profile exists and user has access
    const existingProfile = await db.importProfile.findFirst({
      where: {
        id,
        deletedAt: null,
        createdBy: session.user.id
      }
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Import profile not found or access denied' }, { status: 404 })
    }

    // Soft delete
    await db.importProfile.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/import-profiles/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
