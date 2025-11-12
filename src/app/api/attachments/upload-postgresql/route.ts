import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { AttachmentStorageService } from '@/lib/attachment-storage'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const spaceId = formData.get('spaceId') as string
    const dataModelId = formData.get('dataModelId') as string
    const attributeId = formData.get('attributeId') as string
    const recordId = formData.get('recordId') as string

    if (!file || !spaceId || !dataModelId || !attributeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user has access to this space
    const memberResult = await query(
      'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
      [spaceId, userId]
    )

    if (memberResult.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 })
    }

    // Get active storage connection
    const storageResult = await query(
      'SELECT type, config FROM storage_connections WHERE is_active = true AND type IN (\'minio\', \'s3\', \'sftp\', \'ftp\') ORDER BY created_at DESC LIMIT 1',
      []
    )

    if (storageResult.rows.length === 0) {
      return NextResponse.json({ error: 'No active storage connection found' }, { status: 500 })
    }

    const storage = storageResult.rows[0] as unknown as { type: string; config: any }

    // Initialize storage service
    const storageService = new AttachmentStorageService({
      provider: storage.type as 'minio' | 's3' | 'sftp' | 'ftp',
      config: {
        [storage.type]: storage.config
      } as any
    })

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name
    const mimeType = file.type

    // Upload file to storage
    const uploadResult = await storageService.uploadFile(fileName, fileBuffer, mimeType)

    if (!uploadResult.success || !uploadResult.path) {
      return NextResponse.json({ 
        error: uploadResult.error || 'Upload failed' 
      }, { status: 500 })
    }

    // Save file metadata to database
    const fileResult = await query(
      'INSERT INTO attachment_files (file_name, file_path, file_size, mime_type) VALUES ($1, $2, $3, $4) RETURNING *',
      [
        fileName,
        uploadResult.path,
        file.size,
        mimeType
      ]
    )

    const fileRecord = fileResult.rows[0] as unknown as { 
      id: string; 
      file_name: string; 
      file_path: string; 
      file_size: number; 
      mime_type: string; 
      created_at: Date 
    }

    return NextResponse.json({
      id: fileRecord.id,
      file_name: fileRecord.file_name,
      file_path: fileRecord.file_path,
      file_size: fileRecord.file_size,
      mime_type: fileRecord.mime_type,
      created_at: fileRecord.created_at
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
