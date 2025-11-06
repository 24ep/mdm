import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { changeApproval } from '@/lib/db-change-approval'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const spaceId = searchParams.get('spaceId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const changeRequests = await changeApproval.getChangeRequests({
      status: status as any,
      spaceId: spaceId || undefined,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      changeRequests
    })
  } catch (error: any) {
    console.error('Error getting change requests:', error)
    return NextResponse.json(
      { error: 'Failed to get change requests', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      changeType,
      sqlStatement,
      rollbackSql,
      spaceId,
      connectionId,
      approvers,
      metadata
    } = body

    if (!title || !changeType || !sqlStatement) {
      return NextResponse.json(
        { error: 'Title, changeType, and sqlStatement are required' },
        { status: 400 }
      )
    }

    const changeRequestId = await changeApproval.createChangeRequest({
      title,
      description,
      changeType,
      sqlStatement,
      rollbackSql,
      requestedBy: session.user.id,
      requestedByName: session.user.name || undefined,
      spaceId,
      connectionId,
      approvers: approvers || [],
      metadata
    })

    return NextResponse.json({
      success: true,
      changeRequestId
    })
  } catch (error: any) {
    console.error('Error creating change request:', error)
    return NextResponse.json(
      { error: 'Failed to create change request', details: error.message },
      { status: 500 }
    )
  }
}

