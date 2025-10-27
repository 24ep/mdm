import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { AttachmentStorageService } from '@/lib/attachment-storage'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const spaceId = formData.get('spaceId') as string
    const attributeId = formData.get('attributeId') as string

    if (!file || !spaceId || !attributeId) {
      return NextResponse.json({ 
        error: 'File, spaceId, and attributeId are required' 
      }, { status: 400 })
    }

    // Check if user has access to this space using Prisma
    const spaceMember = await db.spaceMember.findFirst({
      where: {
        spaceId: spaceId,
        userId: session.user.id
      },
      select: { role: true }
    })

    if (!spaceMember) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 })
    }

    // Get attachment storage configuration for the space using Prisma
    const storageConfig = await db.spaceAttachmentStorage.findUnique({
      where: { spaceId: spaceId }
    })

    if (!storageConfig) {
      console.error('Storage configuration not found')
      return NextResponse.json({ error: 'Storage configuration not found' }, { status: 500 })
    }

    // Validate file size and type based on attribute configuration using Prisma
    const attribute = await db.dataModelAttribute.findUnique({
      where: { id: attributeId }
    })

    if (!attribute) {
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 })
    }

    // Check file size limit
    const maxFileSize = attribute.maxFileSize ? parseInt(attribute.maxFileSize) * 1024 * 1024 : 10 * 1024 * 1024 // Default 10MB
    if (file.size > maxFileSize) {
      return NextResponse.json({ 
        error: `File size exceeds limit of ${maxFileSize / (1024 * 1024)}MB` 
      }, { status: 400 })
    }

    // Check file type if specified
    if (attribute.allowedFileTypes) {
      const allowedTypes = attribute.allowedFileTypes.split(',').map(type => type.trim().toLowerCase())
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      
      if (!fileExtension || !allowedTypes.includes(fileExtension)) {
        return NextResponse.json({ 
          error: `File type not allowed. Allowed types: ${attribute.allowedFileTypes}` 
        }, { status: 400 })
      }
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${uuidv4()}.${fileExtension}`
    
    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Initialize storage service
    const storageService = new AttachmentStorageService(storageConfig)

    // Upload file
    const uploadResult = await storageService.uploadFile(
      uniqueFileName, 
      fileBuffer, 
      file.type
    )

    if (!uploadResult.success) {
      return NextResponse.json({ 
        error: uploadResult.error || 'Upload failed' 
      }, { status: 500 })
    }

    // Store file metadata in database using Prisma
    const attachment = await db.attachmentFile.create({
      data: {
        id: uuidv4(),
        attributeId: attributeId,
        originalName: file.name,
        storedName: uniqueFileName,
        fileSize: file.size,
        contentType: file.type,
        storageProvider: storageConfig.provider,
        storagePath: uploadResult.path,
        storageUrl: uploadResult.url,
        uploadedBy: session.user.id,
        uploadedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        originalName: file.name,
        fileSize: file.size,
        contentType: file.type,
        url: uploadResult.url,
        path: uploadResult.path
      }
    })

  } catch (error) {
    console.error('Error in file upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
