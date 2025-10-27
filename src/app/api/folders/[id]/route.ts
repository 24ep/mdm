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
    const { name, parent_id } = body

    // Get the folder to check permissions using Prisma
    const folder = await db.folder.findUnique({
      where: { id: params.id },
      select: { spaceId: true }
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Check if user has admin/owner access to the space using Prisma
    const spaceMember = await db.spaceMember.findFirst({
      where: {
        spaceId: folder.spaceId,
        userId: session.user.id
      },
      select: { role: true }
    })

    if (!spaceMember || !['admin', 'owner'].includes(spaceMember.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update the folder using Prisma
    const updatedFolder = await db.folder.update({
      where: { id: params.id },
      data: {
        name,
        parentId: parent_id || null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ folder: updatedFolder })
  } catch (error) {
    console.error('Update folder API error:', error)
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

    // Get the folder to check permissions using Prisma
    const folder = await db.folder.findUnique({
      where: { id: params.id },
      select: { spaceId: true }
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Check if user has admin/owner access to the space using Prisma
    const spaceMember = await db.spaceMember.findFirst({
      where: {
        spaceId: folder.spaceId,
        userId: session.user.id
      },
      select: { role: true }
    })

    if (!spaceMember || !['admin', 'owner'].includes(spaceMember.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if folder has any models using Prisma
    const models = await db.dataModel.findMany({
      where: { folderId: params.id },
      select: { id: true },
      take: 1
    })

    if (models.length > 0) {
      return NextResponse.json({ error: 'Cannot delete folder with models. Move models first.' }, { status: 400 })
    }

    // Delete the folder using Prisma
    await db.folder.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete folder API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
