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
    const { space_ids } = body

    if (!Array.isArray(space_ids)) {
      return NextResponse.json({ error: 'space_ids must be an array' }, { status: 400 })
    }

    const supabase = createClient()

    // Get the data model to check permissions
    const { data: dataModel, error: modelError } = await supabase
      .from('data_models')
      .select('space_ids')
      .eq('id', params.id)
      .single()

    if (modelError || !dataModel) {
      return NextResponse.json({ error: 'Data model not found' }, { status: 404 })
    }

    // Check if user has admin/owner access to the original space
    const originalSpaceId = dataModel.space_ids?.[0]
    if (!originalSpaceId) {
      return NextResponse.json({ error: 'Data model has no original space' }, { status: 400 })
    }

    const { data: spaceMember, error: spaceError } = await supabase
      .from('space_members')
      .select('role')
      .eq('space_id', originalSpaceId)
      .eq('user_id', session.user.id)
      .single()

    if (spaceError || !spaceMember || !['admin', 'owner'].includes(spaceMember.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validate that all target spaces exist and user has access
    if (space_ids.length > 0) {
      const { data: targetSpaces, error: targetSpacesError } = await supabase
        .from('space_members')
        .select('space_id')
        .eq('user_id', session.user.id)
        .in('space_id', space_ids)

      if (targetSpacesError) {
        console.error('Error checking target spaces:', targetSpacesError)
        return NextResponse.json({ error: 'Failed to validate target spaces' }, { status: 500 })
      }

      const accessibleSpaceIds = targetSpaces?.map(s => s.space_id) || []
      const invalidSpaceIds = space_ids.filter(id => !accessibleSpaceIds.includes(id))
      
      if (invalidSpaceIds.length > 0) {
        return NextResponse.json({ 
          error: `Access denied to spaces: ${invalidSpaceIds.join(', ')}` 
        }, { status: 403 })
      }
    }

    // Update the data model with new space_ids
    const { data: updatedModel, error: updateError } = await supabase
      .from('data_models')
      .update({
        space_ids: [originalSpaceId, ...space_ids],
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating data model sharing:', updateError)
      return NextResponse.json({ error: 'Failed to update sharing' }, { status: 500 })
    }

    return NextResponse.json({ 
      dataModel: updatedModel,
      message: 'Sharing updated successfully'
    })
  } catch (error) {
    console.error('Share data model API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
