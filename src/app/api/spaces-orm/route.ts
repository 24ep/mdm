import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SpaceORM } from '@/lib/orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get user spaces using ORM
    const spaces = await SpaceORM.findUserSpaces(session.user.id)
    
    // Simple pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedSpaces = spaces.slice(startIndex, endIndex)

    return NextResponse.json({
      spaces: paginatedSpaces,
      pagination: {
        page,
        limit,
        total: spaces.length,
        totalPages: Math.ceil(spaces.length / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching spaces:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spaces' },
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
    const { name, description, slug, isDefault = false } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Space name is required' },
        { status: 400 }
      )
    }

    // Create space using ORM
    const newSpace = await SpaceORM.create({
      name: name.trim(),
      description: description?.trim(),
      slug: slug?.trim() || name.toLowerCase().replace(/\s+/g, '-'),
      isDefault,
      createdBy: session.user.id,
      features: {
        assignments: true,
        bulk_activity: true,
        workflows: true,
        dashboard: true
      },
      sidebarConfig: {
        style: {
          backgroundType: 'color',
          backgroundColor: '#1e40af',
          fontColor: '#ffffff'
        },
        menu: [
          { title: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard' },
          { title: 'Data Models', href: '/data-models', icon: 'database' }
        ]
      }
    })

    // Add creator as admin member
    await SpaceORM.addMember(newSpace.id, session.user.id, 'ADMIN')

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
