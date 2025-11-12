import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: bucketId } = await params
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || ''
    const search = searchParams.get('search') || ''

    // Verify bucket (space) exists
    const space = await db.space.findUnique({
      where: { id: bucketId }
    })

    if (!space) {
      return NextResponse.json({ error: 'Bucket not found' }, { status: 404 })
    }

    // Parse the path to get current directory level
    const pathParts = path ? path.split('/').filter(p => p) : []
    const currentPathDepth = pathParts.length

    // Get attachment storage files for this space
    let whereClause: any = {
      spaceId: bucketId
    }

    if (search) {
      whereClause.OR = [
        { fileName: { contains: search, mode: 'insensitive' } }
      ]
    }

    const allFiles = await db.spaceAttachmentStorage.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter files to show only those in the current directory
    let filteredFiles = allFiles.filter(file => {
      if (!file.filePath) return path === '' // Files without path are in root
      
      const filePathParts = file.filePath.split('/').filter(p => p)
      
      if (path === '') {
        // Root level: show files/folders with no path or with only one level
        return filePathParts.length <= 1
      } else {
        // Check if file is directly in the current path (not in a subfolder)
        const matchesPath = filePathParts.length === currentPathDepth + 1 &&
          filePathParts.slice(0, currentPathDepth).join('/') === pathParts.join('/')
        return matchesPath
      }
    })

    // Extract unique folder names from paths
    const folderSet = new Set<string>()
    const folderMap = new Map<string, { id: string, name: string, path: string, createdAt: Date }>()
    
    // Look for folders (files with mimeType 'folder' or entries that represent folders)
    filteredFiles.forEach(file => {
      if (file.mimeType === 'folder') {
        const folderName = file.fileName
        const folderPath = file.filePath || ''
        if (!folderSet.has(folderPath)) {
          folderSet.add(folderPath)
          folderMap.set(folderPath, {
            id: file.id,
            name: folderName,
            path: folderPath,
            createdAt: file.createdAt
          })
        }
      } else if (file.filePath) {
        // Extract folder from file path if file is in a subdirectory
        const filePathParts = file.filePath.split('/').filter(p => p)
        if (filePathParts.length > currentPathDepth + 1) {
          const folderName = filePathParts[currentPathDepth]
          const folderPath = filePathParts.slice(0, currentPathDepth + 1).join('/')
          if (!folderSet.has(folderPath)) {
            folderSet.add(folderPath)
            folderMap.set(folderPath, {
              id: `folder-${folderPath}`, // Generate a synthetic ID
              name: folderName,
              path: folderPath,
              createdAt: file.createdAt
            })
          }
        }
      }
    })

    // Format files
    const formattedFiles = filteredFiles
      .filter(f => f.mimeType !== 'folder') // Exclude folder markers from file list (we'll add them separately)
      .map(file => ({
        id: file.id,
        name: file.fileName,
        size: file.fileSize || 0,
        mimeType: file.mimeType || 'application/octet-stream',
        updatedAt: file.createdAt,
        createdAt: file.createdAt,
        publicUrl: undefined, // Will be set by storage service
        bucketId: bucketId,
        bucketName: space.name,
        path: file.filePath || '',
        uploadedBy: undefined,
        uploadedByName: 'Unknown',
        type: 'file' as const
      }))

    // Add folders
    const formattedFolders = Array.from(folderMap.values()).map(folder => ({
      id: folder.id,
      name: folder.name,
      size: 0,
      mimeType: 'folder',
      updatedAt: folder.createdAt,
      createdAt: folder.createdAt,
      publicUrl: undefined,
      bucketId: bucketId,
      bucketName: space.name,
      path: folder.path,
      uploadedBy: undefined,
      uploadedByName: 'Unknown',
      type: 'folder' as const
    }))

    // Combine and sort: folders first, then files
    const allItems = [...formattedFolders, ...formattedFiles].sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') return -1
      if (a.type === 'file' && b.type === 'folder') return 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ files: allItems })
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

