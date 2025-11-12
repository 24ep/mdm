import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { rows } = await query('SELECT * FROM public.assignments WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [params.id])
    if (!rows.length) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const currentRes = await query('SELECT * FROM public.assignments WHERE id = $1 LIMIT 1', [params.id])
    const currentAssignment = currentRes.rows[0]

    if (!currentAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (dueDate !== undefined) updateData.due_date = dueDate || null
    if (startDate !== undefined) updateData.start_date = startDate || null
    if (assignedTo !== undefined) updateData.assigned_to = assignedTo

    if (status === 'DONE' && currentAssignment.status !== 'DONE') {
      updateData.completed_at = new Date().toISOString()
    } else if (status !== 'DONE' && currentAssignment.status === 'DONE') {
      updateData.completed_at = null
    }

    const setParts: string[] = []
    const values: any[] = []
    for (const [k, v] of Object.entries(updateData)) {
      values.push(v)
      setParts.push(`${k} = $${values.length}`)
    }
    if (!setParts.length) return NextResponse.json(currentAssignment)
    values.push(params.id)
    const { rows: updatedRows } = await query(
      `UPDATE public.assignments SET ${setParts.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    )
    const updatedAssignment = updatedRows[0]

    if (customerIds !== undefined) {
      await query('DELETE FROM public.customer_assignments WHERE assignment_id = $1', [params.id])
      if (customerIds.length > 0) {
        const valuesList = customerIds.map((_: any, i: number) => `($1, $${i + 2})`).join(', ')
        await query(
          `INSERT INTO public.customer_assignments (assignment_id, customer_id) VALUES ${valuesList}`,
          [params.id, ...customerIds]
        )
      }
    }

    await query(
      'INSERT INTO public.activities (action, entity_type, entity_id, old_value, new_value, user_id) VALUES ($1,$2,$3,$4,$5,$6)',
      ['UPDATE', 'Assignment', params.id, currentAssignment, updatedAssignment, session.user.id]
    )

    return NextResponse.json(updatedAssignment)
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { rows } = await query('SELECT * FROM public.assignments WHERE id = $1 LIMIT 1', [params.id])
    const assignment = rows[0]

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    await query('UPDATE public.assignments SET deleted_at = NOW() WHERE id = $1', [params.id])

    await query(
      'INSERT INTO public.activities (action, entity_type, entity_id, old_value, user_id) VALUES ($1,$2,$3,$4,$5)',
      ['DELETE', 'Assignment', params.id, assignment, session.user.id]
    )

    return NextResponse.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
