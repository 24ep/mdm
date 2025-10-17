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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('positions')
      .select('id, name, description')
      .eq('deleted_at', null)
      .order('name', { ascending: true })
      .range(from, to)

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error

    const { count } = await supabase
      .from('positions')
      .select('*', { count: 'exact', head: true })
      .eq('deleted_at', null)

    return NextResponse.json({
      positions: data || [],
      pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    })
  } catch (error) {
    console.error('Error fetching positions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


