import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
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

    // Verify bucket exists
    const space = await db.space.findUnique({
      where: { id: bucketId }
    })

    if (!space) {
      return NextResponse.json({ error: 'Bucket not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const path = (formData.get('path') as string) || ''

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Get or create storage configuration for this space
    let storageConfig = await db.spaceAttachmentStorage.findFirst({
      where: { spaceId: bucketId }
    })

    if (!storageConfig) {
      // Create default storage config
      storageConfig = await db.spaceAttachmentStorage.create({
        data: {
          id: uuidv4(),
          spaceId: bucketId,
          fileName: '',
          filePath: '',
          fileSize: 0,
          mimeType: 'application/octet-stream'
        }
      })
    }

    // For now, we'll store metadata. In production, you'd use the storage service
    const uploadedFiles = []

    for (const file of files) {
      const fileExtension = file.name.split('.').pop() || ''
      const uniqueFileName = `${uuidv4()}.${fileExtension}`

      // Create attachment storage file record
      const attachmentFile = await db.spaceAttachmentStorage.create({
        data: {
          id: uuidv4(),
          spaceId: bucketId,
          fileName: file.name,
          filePath: path ? `${path}/${uniqueFileName}` : uniqueFileName,
          fileSize: file.size,
          mimeType: file.type
        }
      })

      uploadedFiles.push(attachmentFile)

      // TODO: Actually upload to storage service (MinIO, S3, etc.)
      // const fileBuffer = Buffer.from(await file.arrayBuffer())
      // await storageService.uploadFile(uniqueFileName, fileBuffer, file.type)
    }

    return NextResponse.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    })
  } catch (error: any) {
    console.error('Error uploading files:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

