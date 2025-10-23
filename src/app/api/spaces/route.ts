import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Spaces API called')
    
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? { userId: session.user?.id, userRole: session.user?.role } : 'No session')
    
    if (!session?.user?.id) {
      console.log('❌ No session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    console.log('Querying spaces for user:', session.user.id)

    // Get spaces where user is a member using Prisma
    const spaces = await prisma.space.findMany({
      where: {
        deletedAt: null,
        members: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        creator: {
          select: {
            name: true
          }
        },
        members: {
          select: {
            userId: true
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limit
    })

    // Transform the data to match the expected format
    const transformedSpaces = spaces.map(space => ({
      id: space.id,
      name: space.name,
      description: space.description,
      is_default: space.isDefault,
      is_active: space.isActive,
      created_by: space.createdBy,
      created_at: space.createdAt,
      updated_at: space.updatedAt,
      deleted_at: space.deletedAt,
      slug: space.slug,
      created_by_name: space.creator?.name,
      member_count: space.members.length
    }))

    console.log('Spaces query result:', transformedSpaces.length, 'spaces found')

    // Get total count
    const total = await prisma.space.count({
      where: {
        deletedAt: null,
        members: {
          some: {
            userId: session.user.id
          }
        }
      }
    })

    console.log('Total spaces:', total)

    return NextResponse.json({
      spaces: transformedSpaces,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('❌ Error fetching spaces:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { error: 'Failed to fetch spaces', details: error.message },
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
    const { name, description, is_default = false, slug } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Space name is required' },
        { status: 400 }
      )
    }

    // Check if user has permission to create spaces
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create spaces' },
        { status: 403 }
      )
    }

    // Create the space using Prisma
    const newSpace = await prisma.space.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isDefault: is_default,
        createdBy: session.user.id,
        slug: slug?.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }
    })

    // Add the creator as a member
    await prisma.spaceMember.create({
      data: {
        spaceId: newSpace.id,
        userId: session.user.id,
        role: 'OWNER'
      }
    })

    return NextResponse.json({
      space: newSpace,
      message: 'Space created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating space:', error)
    return NextResponse.json(
      { error: 'Failed to create space' },
      { status: 500 }
    )
  }
}