import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAuditLog } from '@/lib/audit'
import { isUuid } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isUuid(params.id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('data_records')
      .select('*, data_record_values(*)')
      .eq('id', params.id)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ record: data })
  } catch (error) {
    console.error('Error fetching record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isUuid(params.id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { values } = body

    if (!Array.isArray(values)) {
      return NextResponse.json({ error: 'values[] required' }, { status: 400 })
    }

    // Upsert values
    if (values.length) {
      const { error: upsertError } = await supabase
        .from('data_record_values')
        .upsert(values.map((v: any) => ({
          data_record_id: params.id,
          attribute_id: v.attribute_id,
          value: v.value ?? null,
        })), { onConflict: 'data_record_id,attribute_id' })
      if (upsertError) throw upsertError
    }

    const { data, error } = await supabase
      .from('data_records')
      .select('*, data_record_values(*)')
      .eq('id', params.id)
      .single()
    if (error) throw error

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'DataRecord',
      entityId: params.id,
      oldValue: null, // We don't have old values in this case
      newValue: data,
      userId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ record: data })
  } catch (error) {
    console.error('Error updating record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isUuid(params.id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('data_records')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', params.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


