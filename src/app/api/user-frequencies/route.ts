import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const COMP_PREFIX = 'freq:companies:'
const IND_PREFIX = 'freq:industries:'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const compKey = `${COMP_PREFIX}${user.id}`
    const indKey = `${IND_PREFIX}${user.id}`

    const { data: compRow } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', compKey)
      .maybeSingle()

    const { data: indRow } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', indKey)
      .maybeSingle()

    return NextResponse.json({
      companies: (compRow?.value as Record<string, number>) || {},
      industries: (indRow?.value as Record<string, number>) || {},
    })
  } catch (error) {
    console.error('GET /api/user-frequencies error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const companies: string[] = Array.isArray(body?.companies) ? body.companies : []
    const industries: string[] = Array.isArray(body?.industries) ? body.industries : []

    const compKey = `${COMP_PREFIX}${user.id}`
    const indKey = `${IND_PREFIX}${user.id}`

    // Load existing
    const { data: compRow } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', compKey)
      .maybeSingle()
    const { data: indRow } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', indKey)
      .maybeSingle()

    const compMap: Record<string, number> = (compRow?.value as any) || {}
    const indMap: Record<string, number> = (indRow?.value as any) || {}

    for (const name of companies) {
      if (!name) continue
      compMap[name] = (compMap[name] || 0) + 1
    }
    for (const name of industries) {
      if (!name) continue
      indMap[name] = (indMap[name] || 0) + 1
    }

    if (companies.length > 0) {
      await supabase
        .from('system_settings')
        .upsert({ key: compKey, value: compMap, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    }
    if (industries.length > 0) {
      await supabase
        .from('system_settings')
        .upsert({ key: indKey, value: indMap, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/user-frequencies error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


