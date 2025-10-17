import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    const { data: profile, error } = await supabase
      .from('export_profiles')
      .select(`
        *,
        export_profile_sharing (
          id,
          sharing_type,
          target_id,
          target_group
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching export profile:', error)
      return NextResponse.json({ error: 'Export profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in GET /api/export-profiles/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    const body = await request.json()
    const { name, description, dataModel, format, columns, filters, isPublic, sharing } = body

    // First, check if the user owns this profile
    const { data: existingProfile, error: checkError } = await supabase
      .from('export_profiles')
      .select('created_by')
      .eq('id', params.id)
      .single()

    if (checkError || !existingProfile) {
      return NextResponse.json({ error: 'Export profile not found' }, { status: 404 })
    }

    if (existingProfile.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update the export profile
    const { data: profile, error: profileError } = await supabase
      .from('export_profiles')
      .update({
        name,
        description,
        data_model: dataModel,
        format,
        columns: columns || [],
        filters: filters || [],
        is_public: isPublic || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (profileError) {
      console.error('Error updating export profile:', profileError)
      return NextResponse.json({ error: 'Failed to update export profile' }, { status: 500 })
    }

    // Update sharing configurations if provided
    if (sharing !== undefined) {
      // Delete existing sharing configurations
      await supabase
        .from('export_profile_sharing')
        .delete()
        .eq('profile_id', params.id)

      // Insert new sharing configurations
      if (sharing.length > 0) {
        const sharingData = sharing.map((share: any) => ({
          profile_id: params.id,
          sharing_type: share.type,
          target_id: share.targetId || null,
          target_group: share.targetGroup || null
        }))

        const { error: sharingError } = await supabase
          .from('export_profile_sharing')
          .insert(sharingData)

        if (sharingError) {
          console.error('Error updating sharing configurations:', sharingError)
          // Don't fail the request, just log the error
        }
      }
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in PUT /api/export-profiles/[id]:', error)
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

    // First, check if the user owns this profile
    const { data: existingProfile, error: checkError } = await supabase
      .from('export_profiles')
      .select('created_by')
      .eq('id', params.id)
      .single()

    if (checkError || !existingProfile) {
      return NextResponse.json({ error: 'Export profile not found' }, { status: 404 })
    }

    if (existingProfile.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the export profile (sharing configurations will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('export_profiles')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting export profile:', error)
      return NextResponse.json({ error: 'Failed to delete export profile' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Export profile deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/export-profiles/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
