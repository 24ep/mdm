import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AttachmentStorageService } from '@/lib/attachment-storage'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attachmentId = params.id

    // Get attachment metadata
    const { data: attachment, error: attachmentError } = await supabase
      .from('attachment_files')
      .select(`
        *,
        data_model_attributes!inner(
          data_models!inner(
            space_id
          )
        )
      `)
      .eq('id', attachmentId)
      .single()

    if (attachmentError || !attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    const spaceId = attachment.data_model_attributes.data_models.space_id

    // Check if user has access to this space
    const { data: spaceMember, error: memberError } = await supabase
      .from('space_members')
      .select('role')
      .eq('space_id', spaceId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !spaceMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get storage configuration
    const { data: storageConfig, error: configError } = await supabase
      .from('space_attachment_storage')
      .select('*')
      .eq('space_id', spaceId)
      .single()

    if (configError) {
      console.error('Error fetching storage config:', configError)
      return NextResponse.json({ error: 'Storage configuration not found' }, { status: 500 })
    }

    // Initialize storage service
    const storageService = new AttachmentStorageService(storageConfig)

    // Download file
    const downloadResult = await storageService.downloadFile(attachment.stored_name)

    if (!downloadResult.success) {
      return NextResponse.json({ 
        error: downloadResult.error || 'Download failed' 
      }, { status: 500 })
    }

    // Convert stream to buffer
    const chunks: Buffer[] = []
    const stream = downloadResult.stream!
    
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    
    const fileBuffer = Buffer.concat(chunks)

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.content_type,
        'Content-Disposition': `attachment; filename="${attachment.original_name}"`,
        'Content-Length': attachment.file_size.toString(),
        'Cache-Control': 'private, max-age=3600'
      }
    })

  } catch (error) {
    console.error('Error in file download:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
