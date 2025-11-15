import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('GET', `/api/assignments/${id}`, { userId: session.user.id })
    
    const { rows } = await query('SELECT * FROM public.assignments WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [id])
    if (!rows.length) {
      logger.warn('Assignment not found', { assignmentId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Assignment not found' }, { status: 404 }))
    }
    
    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/assignments/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json(rows[0]))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Assignment API GET')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data

    // Validate request body
    const bodyValidation = await validateBody(request, z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      dueDate: z.string().datetime().optional().nullable(),
      startDate: z.string().datetime().optional().nullable(),
      assignedTo: commonSchemas.id.optional().nullable(),
      customerIds: z.array(commonSchemas.id).optional(),
    }))
    
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }
    
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      startDate,
      assignedTo,
      customerIds,
    } = bodyValidation.data
    logger.apiRequest('PUT', `/api/assignments/${id}`, { userId: session.user.id })

    const currentRes = await query('SELECT * FROM public.assignments WHERE id = $1 LIMIT 1', [id])
    const currentAssignment = currentRes.rows[0]

    if (!currentAssignment) {
      logger.warn('Assignment not found for update', { assignmentId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Assignment not found' }, { status: 404 }))
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
    values.push(id)
    const { rows: updatedRows } = await query(
      `UPDATE public.assignments SET ${setParts.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    )
    const updatedAssignment = updatedRows[0]

    if (customerIds !== undefined) {
      await query('DELETE FROM public.customer_assignments WHERE assignment_id = $1', [id])
      if (customerIds.length > 0) {
        const valuesList = customerIds.map((_: any, i: number) => `($1, $${i + 2})`).join(', ')
        await query(
          `INSERT INTO public.customer_assignments (assignment_id, customer_id) VALUES ${valuesList}`,
          [id, ...customerIds]
        )
      }
    }

    await query(
      'INSERT INTO public.activities (action, entity_type, entity_id, old_value, new_value, user_id) VALUES ($1,$2,$3,$4,$5,$6)',
      ['UPDATE', 'Assignment', id, currentAssignment, updatedAssignment, session.user.id]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/assignments/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json(updatedAssignment))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Assignment API PUT')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }
    
    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('DELETE', `/api/assignments/${id}`, { userId: session.user.id })
    
    const { rows } = await query('SELECT * FROM public.assignments WHERE id = $1 LIMIT 1', [id])
    const assignment = rows[0]

    if (!assignment) {
      logger.warn('Assignment not found for deletion', { assignmentId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Assignment not found' }, { status: 404 }))
    }

    await query('UPDATE public.assignments SET deleted_at = NOW() WHERE id = $1', [id])

    await query(
      'INSERT INTO public.activities (action, entity_type, entity_id, old_value, user_id) VALUES ($1,$2,$3,$4,$5)',
      ['DELETE', 'Assignment', id, assignment, session.user.id]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/assignments/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ message: 'Assignment deleted successfully' }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Assignment API DELETE')
  }
}
