import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AttachmentStorageService } from '@/lib/attachment-storage'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
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

    // Check if user has access to this space
    const { data: spaceMember, error: memberError } = await supabase
      .from('space_members')
      .select('role')
      .eq('space_id', spaceId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !spaceMember) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 })
    }

    // Get attachment storage configuration for the space
    const { data: storageConfig, error: configError } = await supabase
      .from('space_attachment_storage')
      .select('*')
      .eq('space_id', spaceId)
      .single()

    if (configError) {
      console.error('Error fetching storage config:', configError)
      return NextResponse.json({ error: 'Storage configuration not found' }, { status: 500 })
    }

    // Validate file size and type based on attribute configuration
    const { data: attribute, error: attrError } = await supabase
      .from('data_model_attributes')
      .select('*')
      .eq('id', attributeId)
      .single()

    if (attrError || !attribute) {
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 })
    }

    // Check file size limit
    const maxFileSize = attribute.max_file_size ? parseInt(attribute.max_file_size) * 1024 * 1024 : 10 * 1024 * 1024 // Default 10MB
    if (file.size > maxFileSize) {
      return NextResponse.json({ 
        error: `File size exceeds limit of ${maxFileSize / (1024 * 1024)}MB` 
      }, { status: 400 })
    }

    // Check file type if specified
    if (attribute.allowed_file_types) {
      const allowedTypes = attribute.allowed_file_types.split(',').map(type => type.trim().toLowerCase())
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      
      if (!fileExtension || !allowedTypes.includes(fileExtension)) {
        return NextResponse.json({ 
          error: `File type not allowed. Allowed types: ${attribute.allowed_file_types}` 
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

    // Store file metadata in database
    const { data: attachment, error: attachmentError } = await supabase
      .from('attachment_files')
      .insert({
        id: uuidv4(),
        attribute_id: attributeId,
        original_name: file.name,
        stored_name: uniqueFileName,
        file_size: file.size,
        content_type: file.type,
        storage_provider: storageConfig.provider,
        storage_path: uploadResult.path,
        storage_url: uploadResult.url,
        uploaded_by: user.id,
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (attachmentError) {
      console.error('Error storing attachment metadata:', attachmentError)
      // Try to delete the uploaded file
      await storageService.deleteFile(uniqueFileName)
      return NextResponse.json({ error: 'Failed to store file metadata' }, { status: 500 })
    }

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
