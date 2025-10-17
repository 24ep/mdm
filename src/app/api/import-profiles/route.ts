import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    const { searchParams } = new URL(request.url)
    const dataModel = searchParams.get('dataModel')
    const isPublic = searchParams.get('isPublic')
    const importType = searchParams.get('importType')

    let query = supabase
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
      .order('created_at', { ascending: false })

    // Filter by data model if provided
    if (dataModel) {
      query = query.eq('data_model', dataModel)
    }

    // Filter by public status if provided
    if (isPublic !== null) {
      query = query.eq('is_public', isPublic === 'true')
    }

    // Filter by import type if provided
    if (importType) {
      query = query.eq('import_type', importType)
    }

    const { data: profiles, error } = await query

    if (error) {
      console.error('Error fetching import profiles:', error)
      return NextResponse.json({ error: 'Failed to fetch import profiles' }, { status: 500 })
    }

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Error in GET /api/import-profiles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

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

    // Validate required fields
    if (!name || !dataModel || !fileTypes || fileTypes.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate import type
    if (!['insert', 'upsert', 'delete'].includes(importType)) {
      return NextResponse.json({ error: 'Invalid import type' }, { status: 400 })
    }

    // Create the import profile
    const { data: profile, error: profileError } = await supabase
      .from('import_profiles')
      .insert({
        name,
        description,
        data_model: dataModel,
        file_types: fileTypes,
        header_row: headerRow || 1,
        data_start_row: dataStartRow || 2,
        chunk_size: chunkSize || 1000,
        max_items: maxItems || null,
        import_type: importType,
        primary_key_attribute: primaryKeyAttribute || null,
        date_format: dateFormat || 'YYYY-MM-DD',
        time_format: timeFormat || 'HH:mm:ss',
        boolean_format: booleanFormat || 'true/false',
        attribute_mapping: attributeMapping || {},
        attribute_options: attributeOptions || {},
        is_public: isPublic || false,
        created_by: session.user.id
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating import profile:', profileError)
      return NextResponse.json({ error: 'Failed to create import profile' }, { status: 500 })
    }

    // Create sharing configurations if provided
    if (sharing && sharing.length > 0) {
      const sharingData = sharing.map((share: any) => ({
        profile_id: profile.id,
        sharing_type: share.type,
        target_id: share.targetId || null,
        target_group: share.targetGroup || null
      }))

      const { error: sharingError } = await supabase
        .from('import_profile_sharing')
        .insert(sharingData)

      if (sharingError) {
        console.error('Error creating sharing configurations:', sharingError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/import-profiles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
