import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      dataModelId,
      format = 'xlsx',
      filters = {},
      columns = [],
    } = body

    if (!dataModelId) {
      return NextResponse.json(
        { error: 'Data model is required' },
        { status: 400 }
      )
    }

    const { data: exportJob, error: jobError } = await supabase
      .from('export_jobs')
      .insert({
        file_name: `export_${Date.now()}.${format}`,
        data_model_id: dataModelId,
        status: 'PENDING',
        filters,
        columns,
        format,
        created_by: user.id,
      })
      .select('*')
      .single()
    if (jobError) throw jobError

    setTimeout(async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000))
        await supabase
          .from('export_jobs')
          .update({ status: 'PROCESSING', progress: 50 })
          .eq('id', exportJob.id)

        await new Promise(resolve => setTimeout(resolve, 2000))
        await supabase
          .from('export_jobs')
          .update({ status: 'COMPLETED', progress: 100, completed_at: new Date().toISOString() })
          .eq('id', exportJob.id)

        await supabase
          .from('activities')
          .insert({
            action: 'EXPORT',
            entity_type: 'ExportJob',
            entity_id: exportJob.id,
            new_value: { dataModelId, format, filters, columns },
            user_id: user.id,
          })
      } catch (error) {
        await supabase
          .from('export_jobs')
          .update({ status: 'FAILED', completed_at: new Date().toISOString() })
          .eq('id', exportJob.id)
      }
    }, 1000)

    return NextResponse.json(exportJob, { status: 201 })
  } catch (error) {
    console.error('Error creating export job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Using Prisma instead of Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || ''

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('export_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status) query = query.eq('status', status)

    const { data: exportJobs, error } = await query
    if (error) throw error

    const { count } = await supabase
      .from('export_jobs')
      .select('*', { count: 'exact', head: true })
      .filter('status', status ? 'eq' : 'not.is', status || null as any)

    return NextResponse.json({
      exportJobs: exportJobs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching export jobs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
