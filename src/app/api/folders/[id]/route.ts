import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, parent_id } = body

    const supabase = createClient()

    // Get the folder to check permissions
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('space_id')
      .eq('id', params.id)
      .single()

    if (folderError || !folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Check if user has admin/owner access to the space
    const { data: spaceMember, error: spaceError } = await supabase
      .from('space_members')
      .select('role')
      .eq('space_id', folder.space_id)
      .eq('user_id', session.user.id)
      .single()

    if (spaceError || !spaceMember || !['admin', 'owner'].includes(spaceMember.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update the folder
    const { data: updatedFolder, error } = await supabase
      .from('folders')
      .update({
        name,
        parent_id: parent_id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating folder:', error)
      return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 })
    }

    return NextResponse.json({ folder: updatedFolder })
  } catch (error) {
    console.error('Update folder API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // Get the folder to check permissions
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('space_id')
      .eq('id', params.id)
      .single()

    if (folderError || !folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Check if user has admin/owner access to the space
    const { data: spaceMember, error: spaceError } = await supabase
      .from('space_members')
      .select('role')
      .eq('space_id', folder.space_id)
      .eq('user_id', session.user.id)
      .single()

    if (spaceError || !spaceMember || !['admin', 'owner'].includes(spaceMember.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if folder has any models
    const { data: models, error: modelsError } = await supabase
      .from('data_models')
      .select('id')
      .eq('folder_id', params.id)
      .limit(1)

    if (modelsError) {
      console.error('Error checking folder contents:', modelsError)
      return NextResponse.json({ error: 'Failed to check folder contents' }, { status: 500 })
    }

    if (models && models.length > 0) {
      return NextResponse.json({ error: 'Cannot delete folder with models. Move models first.' }, { status: 400 })
    }

    // Delete the folder
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting folder:', error)
      return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete folder API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
