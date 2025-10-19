import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const attributeId = searchParams.get('attributeId')
    const spaceId = searchParams.get('spaceId')

    if (!attributeId) {
      return NextResponse.json({ error: 'attributeId is required' }, { status: 400 })
    }

    // Check if user has access to this space
    if (spaceId) {
      const { data: spaceMember, error: memberError } = await supabase
        .from('space_members')
        .select('role')
        .eq('space_id', spaceId)
        .eq('user_id', user.id)
        .single()

      if (memberError || !spaceMember) {
        return NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 })
      }
    }

    // Get attachments for the attribute
    const { data: attachments, error: attachmentsError } = await supabase
      .from('attachment_files')
      .select(`
        *,
        data_model_attributes!inner(
          data_models!inner(
            space_id
          )
        )
      `)
      .eq('attribute_id', attributeId)
      .order('uploaded_at', { ascending: false })

    if (attachmentsError) {
      console.error('Error fetching attachments:', attachmentsError)
      return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 })
    }

    return NextResponse.json({ attachments })

  } catch (error) {
    console.error('Error in attachments GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
