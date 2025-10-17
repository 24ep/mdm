import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const dataModelId = formData.get('dataModelId') as string
    const mapping = JSON.parse(formData.get('mapping') as string || '{}')

    if (!file || !dataModelId) {
      return NextResponse.json(
        { error: 'File and data model are required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV and Excel files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Create import job
    const { data: importJob, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        file_name: file.name,
        data_model_id: dataModelId,
        status: 'PENDING',
        mapping,
        created_by: user.id,
      })
      .select('*')
      .single()
    if (jobError) throw jobError

    // In a real implementation, you would:
    // 1. Save the file to storage
    // 2. Queue the import job for background processing
    // 3. Process the file and validate data
    // 4. Import valid records to database
    // 5. Update job status and progress

    // For now, simulate processing
    setTimeout(async () => {
      try {
        // Simulate file processing
        const buffer = await file.arrayBuffer()
        const content = new TextDecoder().decode(buffer)
        const lines = content.split('\n').filter(line => line.trim())
        const totalRows = lines.length - 1 // Exclude header

        // Update job with total rows
        await supabase
          .from('import_jobs')
          .update({ total_rows: totalRows, status: 'PROCESSING' })
          .eq('id', importJob.id)

        // Simulate processing each row
        let processedRows = 0
        let errorRows = 0
        const errors: any[] = []

        for (let i = 1; i < lines.length; i++) {
          try {
            // Simulate row processing
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // Simulate some validation errors
            if (i % 10 === 0) {
              errors.push({
                row: i,
                field: 'email',
                message: 'Invalid email format',
              })
              errorRows++
            } else {
              processedRows++
            }

            // Update progress every 10 rows
            if (i % 10 === 0) {
              const progress = Math.round((i / lines.length) * 100)
              await supabase
                .from('import_jobs')
                .update({
                  progress,
                  processed_rows: processedRows,
                  error_rows: errorRows,
                  errors: errors.length > 0 ? errors : null,
                })
                .eq('id', importJob.id)
            }
          } catch (error) {
            errorRows++
            errors.push({
              row: i,
              field: 'general',
              message: 'Processing error',
            })
          }
        }

        // Complete the job
        await supabase
          .from('import_jobs')
          .update({
            status: 'COMPLETED',
            progress: 100,
            processed_rows: processedRows,
            error_rows: errorRows,
            errors: errors.length > 0 ? errors : null,
            completed_at: new Date().toISOString(),
          })
          .eq('id', importJob.id)

        // Log activity
        await supabase
          .from('activities')
          .insert({
            action: 'IMPORT',
            entity_type: 'ImportJob',
            entity_id: importJob.id,
            new_value: { totalRows, processedRows, errorRows },
            user_id: user.id,
          })
      } catch (error) {
        // Mark job as failed
        await supabase
          .from('import_jobs')
          .update({
            status: 'FAILED',
            errors: [{ message: 'Import processing failed' }],
            completed_at: new Date().toISOString(),
          })
          .eq('id', importJob.id)
      }
    }, 1000)

    return NextResponse.json(importJob, { status: 201 })
  } catch (error) {
    console.error('Error creating import job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
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
      .from('import_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status) query = query.eq('status', status)

    const { data: importJobs, error } = await query
    if (error) throw error

    const { count } = await supabase
      .from('import_jobs')
      .select('*', { count: 'exact', head: true })
      .filter('status', status ? 'eq' : 'not.is', status || null as any)

    return NextResponse.json({
      importJobs: importJobs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching import jobs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
