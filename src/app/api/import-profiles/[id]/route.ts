import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Using Prisma instead of Supabase

    const { data: profile, error } = await supabase
      .from('import_profiles')
      .select(`
        *,
        import_profile_sharing (
          id,
          sharing_type,
          target_id,
          target_group
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching import profile:', error)
      return NextResponse.json({ error: 'Import profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in GET /api/import-profiles/[id]:', error)
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

    // Using Prisma instead of Supabase

    const body = await request.json()
    const { 
      name, 
      description, 
      dataModel, 
      fileTypes, 
      headerRow, 
      dataStartRow, 
      chunkSize, 
      maxItems, 
      importType, 
      primaryKeyAttribute, 
      dateFormat, 
      timeFormat, 
      booleanFormat, 
      attributeMapping, 
      attributeOptions, 
      isPublic, 
      sharing 
    } = body

    // First, check if the user owns this profile
    const { data: existingProfile, error: checkError } = await supabase
      .from('import_profiles')
      .select('created_by')
      .eq('id', params.id)
      .single()

    if (checkError || !existingProfile) {
      return NextResponse.json({ error: 'Import profile not found' }, { status: 404 })
    }

    if (existingProfile.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate import type
    if (importType && !['insert', 'upsert', 'delete'].includes(importType)) {
      return NextResponse.json({ error: 'Invalid import type' }, { status: 400 })
    }

    // Update the import profile
    const { data: profile, error: profileError } = await supabase
      .from('import_profiles')
      .update({
        name,
        description,
        data_model: dataModel,
        file_types: fileTypes,
        header_row: headerRow,
        data_start_row: dataStartRow,
        chunk_size: chunkSize,
        max_items: maxItems,
        import_type: importType,
        primary_key_attribute: primaryKeyAttribute,
        date_format: dateFormat,
        time_format: timeFormat,
        boolean_format: booleanFormat,
        attribute_mapping: attributeMapping,
        attribute_options: attributeOptions,
        is_public: isPublic,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (profileError) {
      console.error('Error updating import profile:', profileError)
      return NextResponse.json({ error: 'Failed to update import profile' }, { status: 500 })
    }

    // Update sharing configurations if provided
    if (sharing !== undefined) {
      // Delete existing sharing configurations
      await supabase
        .from('import_profile_sharing')
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
          .from('import_profile_sharing')
          .insert(sharingData)

        if (sharingError) {
          console.error('Error updating sharing configurations:', sharingError)
          // Don't fail the request, just log the error
        }
      }
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in PUT /api/import-profiles/[id]:', error)
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

    // Using Prisma instead of Supabase

    // First, check if the user owns this profile
    const { data: existingProfile, error: checkError } = await supabase
      .from('import_profiles')
      .select('created_by')
      .eq('id', params.id)
      .single()

    if (checkError || !existingProfile) {
      return NextResponse.json({ error: 'Import profile not found' }, { status: 404 })
    }

    if (existingProfile.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the import profile (sharing configurations will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('import_profiles')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting import profile:', error)
      return NextResponse.json({ error: 'Failed to delete import profile' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Import profile deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/import-profiles/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
