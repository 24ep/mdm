import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    return NextResponse.json({ attachment })

  } catch (error) {
    console.error('Error in attachment GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    // Check if user can delete (uploader or admin/owner)
    if (attachment.uploaded_by !== user.id && !['admin', 'owner'].includes(spaceMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
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
    const { AttachmentStorageService } = await import('@/lib/attachment-storage')
    const storageService = new AttachmentStorageService(storageConfig)

    // Delete file from storage
    const deleteResult = await storageService.deleteFile(attachment.stored_name)

    if (!deleteResult.success) {
      console.error('Failed to delete file from storage:', deleteResult.error)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete attachment metadata from database
    const { error: deleteError } = await supabase
      .from('attachment_files')
      .delete()
      .eq('id', attachmentId)

    if (deleteError) {
      console.error('Error deleting attachment metadata:', deleteError)
      return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in attachment delete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}