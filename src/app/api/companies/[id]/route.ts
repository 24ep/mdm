import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const res = await query(
      `SELECT c.*,
              COALESCE(
                (
                  SELECT json_agg(cu ORDER BY cu.created_at DESC)
                  FROM customers cu
                  WHERE cu.company_id = c.id AND cu.deleted_at IS NULL
                ), '[]'::json
              ) AS customers
       FROM companies c
       WHERE c.id = $1 AND c.deleted_at IS NULL
       LIMIT 1`,
      [id]
    )

    const company = res.rows[0]
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, is_active } = body

    const current = await query('SELECT * FROM companies WHERE id = $1 LIMIT 1', [id])
    const currentCompany = current.rows[0]
    if (!currentCompany) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    if (name && name !== currentCompany.name) {
      const existing = await query(
        'SELECT id FROM companies WHERE name = $1 AND deleted_at IS NULL AND id <> $2 LIMIT 1',
        [name, id]
      )
      if (existing.rows[0]) {
        return NextResponse.json(
          { error: 'Company with this name already exists' },
          { status: 400 }
        )
      }
    }

    const updated = await query(
      'UPDATE companies SET name = $1, description = $2, is_active = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [name ?? currentCompany.name, description ?? currentCompany.description, typeof is_active === 'boolean' ? is_active : currentCompany.is_active, id]
    )

    const updatedCompany = updated.rows[0]

    await query(
      'INSERT INTO activities (action, entity_type, entity_id, old_value, new_value, user_id) VALUES ($1,$2,$3,$4,$5,$6)',
      ['UPDATE', 'Company', id, currentCompany, updatedCompany, session.user.id]
    )

    return NextResponse.json(updatedCompany)
  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const cnt = await query(
      'SELECT COUNT(*)::int AS total FROM customers WHERE company_id = $1 AND deleted_at IS NULL',
      [id]
    )
    if ((cnt.rows[0]?.total || 0) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete company with associated customers' },
        { status: 400 }
      )
    }

    await query(
      'UPDATE companies SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
      [id]
    )

    await query(
      'INSERT INTO activities (action, entity_type, entity_id, user_id) VALUES ($1,$2,$3,$4)',
      ['DELETE', 'Company', id, session.user.id]
    )

    return NextResponse.json({ message: 'Company deleted successfully' })
  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
