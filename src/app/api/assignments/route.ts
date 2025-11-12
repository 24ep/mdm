import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { triggerAssignmentNotification } from '@/lib/notification-triggers'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || ''
    const assignedTo = searchParams.get('assignedTo') || ''

    const offset = (page - 1) * limit
    const filters: string[] = ['deleted_at IS NULL']
    const params: any[] = []
    if (status) { params.push(status); filters.push(`status = $${params.length}`) }
    if (assignedTo) { params.push(assignedTo); filters.push(`assigned_to = $${params.length}`) }
    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : ''
    const listSql = `SELECT * FROM public.assignments ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    const countSql = `SELECT COUNT(*)::int AS total FROM public.assignments ${where}`
    const [{ rows: assignments }, { rows: totals }] = await Promise.all([
      query(listSql, [...params, limit, offset]),
      query(countSql, params),
    ])
    const total = totals[0]?.total || 0
    return NextResponse.json({ assignments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      startDate,
      assignedTo,
      customerIds,
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const { rows: insertRows } = await query(
      `INSERT INTO public.assignments (title, description, status, priority, due_date, start_date, assigned_to, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description ?? null, status || 'TODO', priority || 'MEDIUM', dueDate || null, startDate || null, assignedTo || null, session.user.id]
    )
    const assignment = insertRows[0]

    if (customerIds && customerIds.length > 0) {
      const values = customerIds.map((_: any, i: number) => `($1, $${i + 2})`).join(', ')
      await query(
        `INSERT INTO public.customer_assignments (assignment_id, customer_id) VALUES ${values}`,
        [assignment.id, ...customerIds]
      )
    }

    await query(
      'INSERT INTO public.activities (action, entity_type, entity_id, new_value, user_id) VALUES ($1,$2,$3,$4,$5)',
      ['CREATE', 'Assignment', assignment.id, assignment, session.user.id]
    )

    // Trigger notification for assignment creation
    if (assignedTo) {
      await triggerAssignmentNotification(
        assignment.id,
        assignedTo,
        session.user.id,
        title,
        description || '',
        'ASSIGNMENT_CREATED',
        priority || 'MEDIUM'
      );
    }

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
