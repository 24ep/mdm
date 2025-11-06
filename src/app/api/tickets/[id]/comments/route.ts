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

    const comments = await db.ticketComment.findMany({
      where: {
        ticketId: params.id,
        deletedAt: null
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
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
    const { content, metadata } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Check if ticket exists and user has access
    const ticket = await db.ticket.findUnique({
      where: { id: params.id },
      include: {
        spaces: {
          include: {
            space: true
          }
        }
      }
    })

    if (!ticket || ticket.deletedAt) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check access
    const hasAccess = ticket.spaces.some((ts) => {
      // User should have access to at least one space
      return true // Simplified - add proper access check
    })

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const comment = await db.ticketComment.create({
      data: {
        ticketId: params.id,
        userId: session.user.id,
        content,
        metadata: metadata || {}
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
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

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('commentId')
    const body = await request.json()
    const { content } = body

    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 })
    }

    const comment = await db.ticketComment.findUnique({
      where: { id: commentId }
    })

    if (!comment || comment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 })
    }

    const updated = await db.ticketComment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating comment:', error)
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
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 })
    }

    const comment = await db.ticketComment.findUnique({
      where: { id: commentId }
    })

    if (!comment || (comment.userId !== session.user.id)) {
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 })
    }

    // Soft delete
    await db.ticketComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

