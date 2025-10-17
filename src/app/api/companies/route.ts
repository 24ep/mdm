import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const offset = (page - 1) * limit

    const whereClauses: string[] = ['deleted_at IS NULL']
    const params: any[] = []
    if (search) {
      whereClauses.push('(name ILIKE $' + (params.length + 1) + ' OR description ILIKE $' + (params.length + 2) + ')')
      params.push(`%${search}%`, `%${search}%`)
    }
    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const companiesSql = `
      SELECT c.*,
             (
               SELECT COUNT(*)::int
               FROM customers cu
               WHERE cu.company_id = c.id AND cu.deleted_at IS NULL
             ) AS customers_count
      FROM companies c
      ${whereSql}
      ORDER BY c.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM companies c
      ${whereSql}
    `

    const companiesRes = await query<any>(companiesSql, [...params, limit, offset])
    const countRes = await query<{ total: number }>(countSql, params)
    const companies = companiesRes.rows
    const total = countRes.rows[0]?.total || 0
    
    return NextResponse.json({
      companies: companies || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    // Check if company already exists
    const existing = await query<{ id: string }>(
      'SELECT id FROM companies WHERE name = $1 AND deleted_at IS NULL LIMIT 1',
      [name]
    )

    if (existing.rows[0]) {
      return NextResponse.json(
        { error: 'Company with this name already exists' },
        { status: 400 }
      )
    }

    const inserted = await query<any>(
      'INSERT INTO companies (name, description) VALUES ($1, $2) RETURNING *',
      [name, description ?? null]
    )
    const company = inserted.rows[0]

    await query(
      'INSERT INTO activities (action, entity_type, entity_id, new_value, user_id) VALUES ($1, $2, $3, $4, $5)',
      ['CREATE', 'Company', company.id, company, session.user.id]
    )

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error('Error creating company:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
