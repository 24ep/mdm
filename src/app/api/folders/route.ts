import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('space_id')
    const type = searchParams.get('type') || 'data_model'

    if (!spaceId) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 })
    }

    // Check if user has access to the space using Prisma
    const spaceMember = await db.spaceMember.findFirst({
      where: {
        spaceId: spaceId,
        userId: session.user.id
      },
      select: {
        role: true
      }
    })

    if (!spaceMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Folder model doesn't exist in Prisma schema
    return NextResponse.json({ folders: [] })
  } catch (error) {
    console.error('Folders API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type = 'data_model', space_id, parent_id } = body

    if (!name || !space_id) {
      return NextResponse.json({ error: 'Name and space_id are required' }, { status: 400 })
    }

    // Check if user has admin/owner access to the space using Prisma
    const spaceMember = await db.spaceMember.findFirst({
      where: {
        spaceId: space_id,
        userId: session.user.id
      },
      select: {
        role: true
      }
    })

    if (!spaceMember || !['admin', 'owner'].includes(spaceMember.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Folder model doesn't exist in Prisma schema
    return NextResponse.json(
      { error: 'Folder model not implemented' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Create folder API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
