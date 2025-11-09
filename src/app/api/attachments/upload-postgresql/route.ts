import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { uploadFile } from '@/lib/attachment-storage'
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

    // Get storage configuration
    const storageResult = await query(
      'SELECT provider, config FROM space_attachment_storage WHERE space_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
      [spaceId]
    )

    if (storageResult.rows.length === 0) {
      return NextResponse.json({ error: 'No storage configuration found' }, { status: 500 })
    }

    const storage = storageResult.rows[0]

    // Upload file to storage
    const uploadResult = await uploadFile(file, {
      provider: storage.provider,
      config: storage.config,
      spaceId,
      dataModelId,
      attributeId,
      recordId
    })

    // Save file metadata to database
    const fileResult = await query(
      'INSERT INTO attachment_files (space_id, data_model_id, attribute_id, record_id, file_name, file_path, file_size, mime_type, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [
        spaceId,
        dataModelId,
        attributeId,
        recordId || null,
        uploadResult.fileName,
        uploadResult.filePath,
        uploadResult.fileSize,
        uploadResult.mimeType,
        userId
      ]
    )

    return NextResponse.json({
      id: fileResult.rows[0].id,
      file_name: fileResult.rows[0].file_name,
      file_path: fileResult.rows[0].file_path,
      file_size: fileResult.rows[0].file_size,
      mime_type: fileResult.rows[0].mime_type,
      uploaded_at: fileResult.rows[0].uploaded_at
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
