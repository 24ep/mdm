import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const bucketId = params.id
    const { name, path } = await request.json()

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    // Validate folder name (no slashes, no special characters that could break paths)
    const sanitizedName = name.trim()
    if (sanitizedName.includes('/') || sanitizedName.includes('\\')) {
      return NextResponse.json({ 
        error: 'Folder name cannot contain slashes' 
      }, { status: 400 })
    }

    // Verify bucket (space) exists
    const space = await db.space.findUnique({
      where: { id: bucketId }
    })

    if (!space) {
      return NextResponse.json({ error: 'Bucket not found' }, { status: 404 })
    }

    // Construct full folder path
    const folderPath = path && path.trim() 
      ? `${path.trim()}/${sanitizedName}`.replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
      : sanitizedName

    // Check if folder already exists by checking if any file has this exact path as prefix
    const existingFile = await db.spaceAttachmentStorage.findFirst({
      where: {
        spaceId: bucketId,
        filePath: {
          startsWith: folderPath + '/'
        }
      }
    })

    if (existingFile) {
      return NextResponse.json({ 
        error: 'A folder or file with this name already exists' 
      }, { status: 409 })
    }

    // Check if a file exists with this exact path
    const exactFile = await db.spaceAttachmentStorage.findFirst({
      where: {
        spaceId: bucketId,
        filePath: folderPath
      }
    })

    if (exactFile) {
      return NextResponse.json({ 
        error: 'A file with this path already exists' 
      }, { status: 409 })
    }

    // Create a placeholder marker file to represent the folder
    // In a real implementation, you might want a separate folders table
    // For now, we'll create a hidden marker file
    const folderMarkerId = randomUUID()
    
    // Note: This is a simplified approach. In production, you'd want:
    // 1. A separate folders table, OR
    // 2. Use a special file with mimeType 'folder' or type field
    
    // We'll store it as a special entry with mimeType 'folder'
    await db.spaceAttachmentStorage.create({
      data: {
        id: folderMarkerId,
        spaceId: bucketId,
        fileName: sanitizedName,
        filePath: folderPath,
        mimeType: 'folder',
        fileSize: 0,
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      folder: {
        id: folderMarkerId,
        name: sanitizedName,
        path: folderPath,
        type: 'folder',
        createdAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

