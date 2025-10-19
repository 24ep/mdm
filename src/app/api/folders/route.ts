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

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('space_id')
    const type = searchParams.get('type') || 'data_model'

    if (!spaceId) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Check if user has access to the space
    const { data: spaceMember, error: spaceError } = await supabase
      .from('space_members')
      .select('role')
      .eq('space_id', spaceId)
      .eq('user_id', session.user.id)
      .single()

    if (spaceError || !spaceMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get folders for the space
    const { data: folders, error } = await supabase
      .from('folders')
      .select('*')
      .eq('space_id', spaceId)
      .eq('type', type)
      .order('name')

    if (error) {
      console.error('Error fetching folders:', error)
      // If folders table doesn't exist yet, return empty array
      if (error.code === 'PGRST116' || error.message?.includes('relation "folders" does not exist')) {
        return NextResponse.json({ folders: [] })
      }
      return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
    }

    return NextResponse.json({ folders: folders || [] })
  } catch (error) {
    console.error('Folders API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type = 'data_model', space_id, parent_id } = body

    if (!name || !space_id) {
      return NextResponse.json({ error: 'Name and space_id are required' }, { status: 400 })
    }

    const supabase = createClient()

    // Check if user has admin/owner access to the space
    const { data: spaceMember, error: spaceError } = await supabase
      .from('space_members')
      .select('role')
      .eq('space_id', space_id)
      .eq('user_id', session.user.id)
      .single()

    if (spaceError || !spaceMember || !['admin', 'owner'].includes(spaceMember.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create the folder
    const { data: folder, error } = await supabase
      .from('folders')
      .insert({
        name,
        type,
        space_id,
        parent_id: parent_id || null,
        created_by: session.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating folder:', error)
      // If folders table doesn't exist yet, return a helpful error
      if (error.code === 'PGRST116' || error.message?.includes('relation "folders" does not exist')) {
        return NextResponse.json({ error: 'Folders feature not yet available. Please run database migrations.' }, { status: 503 })
      }
      return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
    }

    return NextResponse.json({ folder })
  } catch (error) {
    console.error('Create folder API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
