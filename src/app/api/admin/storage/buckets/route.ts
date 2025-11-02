import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - List all buckets (spaces as buckets)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get all spaces as buckets
    const spaces = await db.space.findMany({
      include: {
        attachmentStorage: {
          select: {
            fileSize: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const buckets = spaces.map(space => ({
      id: space.id,
      name: space.name,
      public: false, // Can be made configurable
      fileCount: space.attachmentStorage.length,
      totalSize: space.attachmentStorage.reduce((sum, file) => sum + (file.fileSize || 0), 0),
      created: space.createdAt,
      spaceId: space.id,
      spaceName: space.name
    }))

    return NextResponse.json({ buckets })
  } catch (error) {
    console.error('Error fetching buckets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new bucket (creates a new space)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { name, public: isPublic } = await request.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Bucket name is required' }, { status: 400 })
    }

    // Validate bucket name (similar to Supabase: lowercase, alphanumeric, hyphens, underscores)
    if (!/^[a-z0-9_-]+$/.test(name)) {
      return NextResponse.json({ 
        error: 'Bucket name must contain only lowercase letters, numbers, hyphens, and underscores' 
      }, { status: 400 })
    }

    // Check if space with this name already exists
    const existing = await db.space.findFirst({
      where: { name }
    })

    if (existing) {
      return NextResponse.json({ error: 'A bucket with this name already exists' }, { status: 409 })
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-')

    // Create new space (bucket)
    const space = await db.space.create({
      data: {
        name,
        slug,
        description: `Storage bucket: ${name}`,
        createdBy: session.user.id
      }
    })

    // Add owner as admin member
    await db.spaceMember.create({
      data: {
        spaceId: space.id,
        userId: session.user.id,
        role: 'ADMIN'
      }
    })

    return NextResponse.json({
      bucket: {
        id: space.id,
        name: space.name,
        public: isPublic || false,
        fileCount: 0,
        totalSize: 0,
        created: space.createdAt,
        spaceId: space.id,
        spaceName: space.name
      }
    })
  } catch (error: any) {
    console.error('Error creating bucket:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

