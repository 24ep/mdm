import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('workflow_id')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const offset = (page - 1) * limit

    // Build query with filters
    let whereConditions = ['1=1']
    let params: any[] = []
    let paramIndex = 1

    if (workflowId) {
      whereConditions.push(`we.workflow_id = $${paramIndex}`)
      params.push(workflowId)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`we.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    // Get executions with workflow details
    const executionsQuery = `
      SELECT 
        we.id,
        we.workflow_id,
        we.execution_type,
        we.status,
        we.started_at,
        we.completed_at,
        we.records_processed,
        we.records_updated,
        we.error_message,
        we.execution_details,
        w.name as workflow_name,
        dm.display_name as data_model_name
      FROM public.workflow_executions we
      LEFT JOIN public.workflows w ON we.workflow_id = w.id
      LEFT JOIN public.data_models dm ON w.data_model_id = dm.id
      WHERE ${whereClause}
      ORDER BY we.started_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(limit, offset)

    const { rows: executions } = await query(executionsQuery, params)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM public.workflow_executions we
      WHERE ${whereClause}
    `
    const { rows: countRows } = await query(countQuery, params.slice(0, -2))
    const total = parseInt(countRows[0].total)

    return NextResponse.json({
      executions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching workflow executions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
