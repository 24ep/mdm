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

    const timeLogs = await db.ticketTimeLog.findMany({
      where: {
        ticketId: params.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        loggedAt: 'desc'
      }
    })

    return NextResponse.json({ timeLogs })
  } catch (error) {
    console.error('Error fetching time logs:', error)
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
    const { hours, description, loggedAt } = body

    if (!hours || hours <= 0) {
      return NextResponse.json({ error: 'Valid hours are required' }, { status: 400 })
    }

    // Check if ticket exists
    const ticket = await db.ticket.findUnique({
      where: { id: params.id }
    })

    if (!ticket || ticket.deletedAt) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const timeLog = await db.ticketTimeLog.create({
      data: {
        ticketId: params.id,
        userId: session.user.id,
        hours: parseFloat(hours),
        description: description || null,
        loggedAt: loggedAt ? new Date(loggedAt) : new Date()
      },
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
    })

    return NextResponse.json(timeLog, { status: 201 })
  } catch (error) {
    console.error('Error creating time log:', error)
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
    const timeLogId = searchParams.get('timeLogId')

    if (!timeLogId) {
      return NextResponse.json({ error: 'timeLogId is required' }, { status: 400 })
    }

    const timeLog = await db.ticketTimeLog.findUnique({
      where: { id: timeLogId }
    })

    if (!timeLog || timeLog.userId !== session.user.id) {
      return NextResponse.json({ error: 'Time log not found or unauthorized' }, { status: 404 })
    }

    await db.ticketTimeLog.delete({
      where: { id: timeLogId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting time log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

