import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { triggerCustomerNotification } from '@/lib/notification-triggers'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const sort = searchParams.get('sort') || ''
    const order = searchParams.get('order') || 'asc'
    
    // Multi-select filters
    const companies = searchParams.get('companies')?.split(',').filter(Boolean) || []
    const industries = searchParams.get('industries')?.split(',').filter(Boolean) || []
    const sources = searchParams.get('sources')?.split(',').filter(Boolean) || []
    const events = searchParams.get('events')?.split(',').filter(Boolean) || []
    const positions = searchParams.get('positions')?.split(',').filter(Boolean) || []
    const businessProfiles = searchParams.get('business_profiles')?.split(',').filter(Boolean) || []
    const titles = searchParams.get('titles')?.split(',').filter(Boolean) || []
    const callStatuses = searchParams.get('call_statuses')?.split(',').filter(Boolean) || []
    
    // Date filters
    const dateFrom = searchParams.get('date_from') || ''
    const dateTo = searchParams.get('date_to') || ''
    
    // Column-specific filters
    const name = searchParams.get('name') || ''
    const email = searchParams.get('email') || ''
    const phone = searchParams.get('phone') || ''
    const company = searchParams.get('company') || ''
    const position = searchParams.get('position') || ''
    const source = searchParams.get('source') || ''
    const industry = searchParams.get('industry') || ''
    const statusFilter = searchParams.get('status') || ''
    const lastContactFrom = searchParams.get('last_contact_from') || ''
    const lastContactTo = searchParams.get('last_contact_to') || ''

    const offset = (page - 1) * limit

    const filters: string[] = ['c.deleted_at IS NULL']
    const params: any[] = []

    // Search filter
    if (search) {
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
      filters.push('(c.first_name ILIKE $' + (params.length - 3) + ' OR c.last_name ILIKE $' + (params.length - 2) + ' OR c.email ILIKE $' + (params.length - 1) + ' OR c.phone ILIKE $' + params.length + ')')
    }

    // Status filter
    if (statusFilter) {
      params.push(statusFilter === 'active')
      filters.push('c.is_active = $' + params.length)
    }

    // Column-specific text filters
    if (name) {
      params.push(`%${name}%`)
      filters.push('(c.first_name ILIKE $' + params.length + ' OR c.last_name ILIKE $' + params.length + ')')
    }

    if (email) {
      params.push(`%${email}%`)
      filters.push('c.email ILIKE $' + params.length)
    }

    if (phone) {
      params.push(`%${phone}%`)
      filters.push('c.phone ILIKE $' + params.length)
    }

    // Multi-select filters
    if (companies.length > 0) {
      params.push(companies)
      filters.push('comp.name = ANY($' + params.length + ')')
    }

    if (industries.length > 0) {
      params.push(industries)
      filters.push('ind.name = ANY($' + params.length + ')')
    }

    if (sources.length > 0) {
      params.push(sources)
      filters.push('src.name = ANY($' + params.length + ')')
    }

    if (positions.length > 0) {
      params.push(positions)
      filters.push('pos.name = ANY($' + params.length + ')')
    }

    // Single value filters
    if (company) {
      params.push(`%${company}%`)
      filters.push('comp.name ILIKE $' + params.length)
    }

    if (industry) {
      params.push(`%${industry}%`)
      filters.push('ind.name ILIKE $' + params.length)
    }

    if (source) {
      params.push(`%${source}%`)
      filters.push('src.name ILIKE $' + params.length)
    }

    if (position) {
      params.push(`%${position}%`)
      filters.push('pos.name ILIKE $' + params.length)
    }

    // Date filters
    if (dateFrom) {
      params.push(dateFrom)
      filters.push('c.created_at >= $' + params.length)
    }

    if (dateTo) {
      params.push(dateTo + ' 23:59:59')
      filters.push('c.created_at <= $' + params.length)
    }

    if (lastContactFrom) {
      params.push(lastContactFrom)
      filters.push('c.updated_at >= $' + params.length)
    }

    if (lastContactTo) {
      params.push(lastContactTo + ' 23:59:59')
      filters.push('c.updated_at <= $' + params.length)
    }

    const whereClause = filters.length ? 'WHERE ' + filters.join(' AND ') : ''

    // Build ORDER BY clause
    let orderBy = 'c.created_at DESC'
    if (sort) {
      const validSortFields: Record<string, string> = {
        'first_name': 'c.first_name',
        'last_name': 'c.last_name',
        'email': 'c.email',
        'phone': 'c.phone',
        'company': 'comp.name',
        'position': 'pos.name',
        'source': 'src.name',
        'industry': 'ind.name',
        'is_active': 'c.is_active',
        'updated_at': 'c.updated_at',
        'created_at': 'c.created_at'
      }
      
      const sortField = validSortFields[sort] || 'c.created_at'
      orderBy = `${sortField} ${order.toUpperCase()}`
    }

    const customersSql = `
      SELECT c.*,
             comp.name as company_name,
             pos.name as position_name,
             src.name as source_name,
             ind.name as industry_name
      FROM public.customers c
      LEFT JOIN public.companies comp ON c.company_id = comp.id
      LEFT JOIN public.positions pos ON c.position_id = pos.id
      LEFT JOIN public.sources src ON c.source_id = src.id
      LEFT JOIN public.industries ind ON c.industry_id = ind.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `

    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM public.customers c
      LEFT JOIN public.companies comp ON c.company_id = comp.id
      LEFT JOIN public.positions pos ON c.position_id = pos.id
      LEFT JOIN public.sources src ON c.source_id = src.id
      LEFT JOIN public.industries ind ON c.industry_id = ind.id
      ${whereClause}
    `

    const [{ rows: customers }, { rows: countRows }] = await Promise.all([
      query(customersSql, params),
      query<{ count: number }>(countSql, params),
    ])

    const total = countRows[0]?.count || 0

    // Transform the data to match the expected format
    const transformedCustomers = (customers || []).map((customer: any) => ({
      ...customer,
      companies: customer.company_name ? { name: customer.company_name } : null,
      positions: customer.position_name ? { name: customer.position_name } : null,
      sources: customer.source_name ? { name: customer.source_name } : null,
      industries: customer.industry_name ? { name: customer.industry_name } : null,
    }))

    return NextResponse.json({
      customers: transformedCustomers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    if (email) {
      const { rows: existing } = await query<{ id: string }>(
        'SELECT id FROM public.customers WHERE email = $1 AND deleted_at IS NULL LIMIT 1',
        [email]
      )
      if (existing.length > 0) {
        return NextResponse.json(
          { error: 'Customer with this email already exists' },
          { status: 400 }
        )
      }
    }

    const insertSql = `
      INSERT INTO public.customers (
        first_name, last_name, email, phone,
        company_id, source_id, industry_id, event_id,
        position_id, business_profile_id, title_id, call_workflow_status_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
      ) RETURNING *
    `

    const params = [
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
    ]

    const { rows } = await query(insertSql, params)
    const customer = rows[0]

    await query(
      'INSERT INTO public.activities (action, entity_type, entity_id, new_value, user_id) VALUES ($1,$2,$3,$4,$5)',
      ['CREATE', 'Customer', customer.id, customer, session.user.id]
    )

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}