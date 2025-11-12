import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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
    const { name, displayName, type, value, jsonValue, isRequired, sortOrder } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if ticket exists and user has access
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: { space: true }
    })

    if (!ticket || ticket.deletedAt) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if user has access to this space
    const spaceAccess = await db.spaceMember.findFirst({
      where: {
        spaceId: ticket.spaceId,
        userId: session.user.id
      }
    })

    const isSpaceOwner = await db.space.findFirst({
      where: {
        id: ticket.spaceId,
        createdBy: session.user.id
      }
    })

    if (!spaceAccess && !isSpaceOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if attribute already exists
    const existing = await db.ticketAttribute.findUnique({
      where: {
        ticketId_name: {
          ticketId: id,
          name
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Attribute already exists' }, { status: 400 })
    }

    // Get max sort order if not provided
    let finalSortOrder = sortOrder
    if (finalSortOrder === undefined) {
      const maxSort = await db.ticketAttribute.findFirst({
        where: { ticketId: id },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true }
      })
      finalSortOrder = maxSort ? maxSort.sortOrder + 1 : 0
    }

    const attribute = await db.ticketAttribute.create({
      data: {
        ticketId: id,
        name,
        displayName: displayName || name,
        type: type || 'TEXT',
        value: value || null,
        jsonValue: jsonValue || null,
        isRequired: isRequired || false,
        sortOrder: finalSortOrder
      }
    })

    return NextResponse.json(attribute, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket attribute:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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
    const { attributeId, name, displayName, type, value, jsonValue, isRequired, sortOrder } = body

    if (!attributeId) {
      return NextResponse.json({ error: 'attributeId is required' }, { status: 400 })
    }

    // Check if ticket exists and user has access
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: { space: true }
    })

    if (!ticket || ticket.deletedAt) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if user has access to this space
    const spaceAccess = await db.spaceMember.findFirst({
      where: {
        spaceId: ticket.spaceId,
        userId: session.user.id
      }
    })

    const isSpaceOwner = await db.space.findFirst({
      where: {
        id: ticket.spaceId,
        createdBy: session.user.id
      }
    })

    if (!spaceAccess && !isSpaceOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const updateData: any = {}
    if (displayName !== undefined) updateData.displayName = displayName
    if (type !== undefined) updateData.type = type
    if (value !== undefined) updateData.value = value
    if (jsonValue !== undefined) updateData.jsonValue = jsonValue
    if (isRequired !== undefined) updateData.isRequired = isRequired
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    const attribute = await db.ticketAttribute.update({
      where: { id: attributeId },
      data: updateData
    })

    return NextResponse.json(attribute)
  } catch (error) {
    console.error('Error updating ticket attribute:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const attributeId = searchParams.get('attributeId')

    if (!attributeId) {
      return NextResponse.json({ error: 'attributeId is required' }, { status: 400 })
    }

    // Check if ticket exists and user has access
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: { space: true }
    })

    if (!ticket || ticket.deletedAt) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if user has access to this space
    const spaceAccess = await db.spaceMember.findFirst({
      where: {
        spaceId: ticket.spaceId,
        userId: session.user.id
      }
    })

    const isSpaceOwner = await db.space.findFirst({
      where: {
        id: ticket.spaceId,
        createdBy: session.user.id
      }
    })

    if (!spaceAccess && !isSpaceOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await db.ticketAttribute.delete({
      where: { id: attributeId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ticket attribute:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

