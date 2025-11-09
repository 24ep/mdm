import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - List all storage connections
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const connections = await prisma.storageConnection.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ connections })
  } catch (error) {
    console.error('Error fetching storage connections:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new storage connection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { name, type, description, isActive, config } = await request.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!type || typeof type !== 'string') {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 })
    }

    const validTypes = ['minio', 's3', 'sftp', 'onedrive', 'google_drive']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid storage type' }, { status: 400 })
    }

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Config is required' }, { status: 400 })
    }

    const connection = await prisma.storageConnection.create({
      data: {
        name,
        type,
        description: description || null,
        isActive: isActive !== false,
        config: config as any,
        status: 'disconnected'
      }
    })

    return NextResponse.json({ connection })
  } catch (error: any) {
    console.error('Error creating storage connection:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

