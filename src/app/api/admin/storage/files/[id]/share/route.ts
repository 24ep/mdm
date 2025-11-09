import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { AttachmentStorageService } from '@/lib/attachment-storage'

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

    const fileId = params.id
    const { isPublic, permissionLevel = 'view', expiresIn = 3600 } = await request.json()

    // Get the file
    const file = await db.spaceAttachmentStorage.findUnique({
      where: { id: fileId },
      select: { 
        filePath: true, 
        fileName: true, 
        spaceId: true, 
        bucketId: true,
        publicUrl: true 
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    let publicUrl = file.publicUrl

    if (isPublic) {
      // Get storage configuration for the space
      const storageConfig = await db.spaceAttachmentStorage.findFirst({
        where: { spaceId: file.spaceId || file.bucketId }
      })

      if (storageConfig) {
        // Create storage service instance
        const storageService = new AttachmentStorageService({
          provider: storageConfig.provider as 'minio' | 's3' | 'sftp' | 'ftp',
          config: storageConfig.config as any
        })

        // Extract the actual file name from the path
        const fileName = file.filePath?.split('/').pop() || file.fileName

        // Generate public URL from storage service
        const urlResult = await storageService.generatePublicUrl(fileName, expiresIn)
        
        if (urlResult.success && urlResult.url) {
          publicUrl = urlResult.url
        } else {
          // Fallback to API endpoint if storage service doesn't support public URLs
          publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/storage/files/${fileId}/content`
        }
      } else {
        // Fallback if no storage config
        publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/storage/files/${fileId}/content`
      }
    } else {
      publicUrl = null
    }

    // Update file with public URL
    const updatedFile = await db.spaceAttachmentStorage.update({
      where: { id: fileId },
      data: {
        publicUrl: publicUrl
      }
    })

    return NextResponse.json({ 
      file: {
        id: updatedFile.id,
        isPublic,
        permissionLevel,
        publicUrl: publicUrl
      }
    })
  } catch (error: any) {
    console.error('Error sharing file:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

