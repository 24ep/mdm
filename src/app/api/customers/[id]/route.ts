import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rows } = await query(
      `SELECT * FROM public.customers WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [params.id]
    )

    const customer = rows[0]
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      first_name,
      last_name,
      email,
      phone,
      company_id,
      source_id,
      industry_id,
      event_id,
      position_id,
      business_profile_id,
      title_id,
      call_workflow_status_id,
    } = body

    const { rows: currentRows } = await query(
      'SELECT * FROM public.customers WHERE id = $1 LIMIT 1',
      [params.id]
    )
    const currentCustomer = currentRows[0]
    if (!currentCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (email && email !== currentCustomer.email) {
      const { rows: existing } = await query(
        'SELECT id FROM public.customers WHERE email = $1 AND deleted_at IS NULL AND id <> $2 LIMIT 1',
        [email, params.id]
      )
      if (existing.length > 0) {
        return NextResponse.json(
          { error: 'Customer with this email already exists' },
          { status: 400 }
        )
      }
    }

    const updateSql = `
      UPDATE public.customers
      SET first_name = $1,
          last_name = $2,
          email = $3,
          phone = $4,
          company_id = $5,
          source_id = $6,
          industry_id = $7,
          event_id = $8,
          position_id = $9,
          business_profile_id = $10,
          title_id = $11,
          call_workflow_status_id = $12,
          updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `

    const paramsArr = [
      first_name,
      last_name,
      email,
      phone,
      company_id,
      source_id,
      industry_id,
      event_id,
      position_id,
      business_profile_id,
      title_id,
      call_workflow_status_id,
      params.id,
    ]

    const { rows } = await query(updateSql, paramsArr)
    const customer = rows[0]

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'Customer',
      entityId: params.id,
      oldValue: currentCustomer,
      newValue: customer,
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rows: currentRows } = await query(
      'SELECT * FROM public.customers WHERE id = $1 LIMIT 1',
      [params.id]
    )
    const currentCustomer = currentRows[0]
    if (!currentCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    await query(
      'UPDATE public.customers SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
      [params.id]
    )

    await query(
      'INSERT INTO public.activities (action, entity_type, entity_id, old_value, user_id) VALUES ($1,$2,$3,$4,$5)',
      ['DELETE', 'Customer', params.id, currentCustomer, session.user.id]
    )

    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}