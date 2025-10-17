import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dataModel = searchParams.get('dataModel')
    const isPublic = searchParams.get('isPublic')
    
    // Build where clause
    const whereClauses: string[] = []
    const params: any[] = []
    if (dataModel) {
      params.push(dataModel)
      whereClauses.push(`ep.data_model = $${params.length}`)
    }
    if (isPublic !== null) {
      params.push(isPublic === 'true')
      whereClauses.push(`ep.is_public = $${params.length}`)
    }
    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const sql = `
      SELECT
        ep.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', eps.id,
              'sharing_type', eps.sharing_type,
              'target_id', eps.target_id,
              'target_group', eps.target_group
            )
          ) FILTER (WHERE eps.id IS NOT NULL),
          '[]'::json
        ) AS export_profile_sharing
      FROM export_profiles ep
      LEFT JOIN export_profile_sharing eps ON eps.profile_id = ep.id
      ${whereSql}
      GROUP BY ep.id
      ORDER BY ep.created_at DESC
    `

    const { rows } = await query<any>(sql, params)
    return NextResponse.json({ profiles: rows })
  } catch (error) {
    console.error('Error in GET /api/export-profiles:', error)
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
    const { name, description, dataModel, format, columns, filters, isPublic, sharing } = body

    // Validate required fields
    if (!name || !dataModel || !format) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create the export profile
    const { data: profile, error: profileError } = await supabase
      .from('export_profiles')
      .insert({
        name,
        description,
        data_model: dataModel,
        format,
        columns: columns || [],
        filters: filters || [],
        is_public: isPublic || false,
        created_by: session.user.id
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating export profile:', profileError)
      return NextResponse.json({ error: 'Failed to create export profile' }, { status: 500 })
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
        .from('export_profile_sharing')
        .insert(sharingData)

      if (sharingError) {
        console.error('Error creating sharing configurations:', sharingError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/export-profiles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
