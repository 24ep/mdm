import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const dataModelId = searchParams.get('data_model_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!dataModelId) {
      return NextResponse.json({ error: 'data_model_id is required' }, { status: 400 })
    }

    const offset = (page - 1) * limit
    const listSql = `
      SELECT * FROM public.data_model_attributes
      WHERE data_model_id = $1::uuid AND is_active = TRUE
      ORDER BY "order" ASC
      LIMIT $2 OFFSET $3
    `
    const countSql = `
      SELECT COUNT(*)::int AS total FROM public.data_model_attributes
      WHERE data_model_id = $1::uuid AND is_active = TRUE
    `
    const [{ rows: attributes }, { rows: totals }] = await Promise.all([
      query(listSql, [dataModelId, limit, offset]),
      query(countSql, [dataModelId]),
    ])
    const total = totals[0]?.total || 0
    return NextResponse.json({
      attributes: attributes || [],
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching attributes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { data_model_id, name, display_name, type, is_required, is_unique, default_value, options, validation, order } = body

    if (!data_model_id || !name || !display_name || !type) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    // Map type to uppercase for database enum
    const typeMapping: Record<string, string> = {
      'text': 'TEXT',
      'number': 'NUMBER', 
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'email': 'EMAIL',
      'phone': 'PHONE',
      'url': 'URL',
      'select': 'SELECT',
      'multi_select': 'MULTI_SELECT',
      'textarea': 'TEXTAREA',
      'json': 'JSON',
      'user': 'USER',
      'user_multi': 'USER_MULTI'
    }
    const mappedType = typeMapping[type?.toLowerCase()] || type?.toUpperCase() || 'TEXT'

    const insertSql = `
      INSERT INTO public.data_model_attributes
      (data_model_id, name, display_name, type, is_required, is_unique, default_value, options, validation, "order")
      VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `
    const { rows } = await query(insertSql, [
      data_model_id,
      name,
      display_name,
      mappedType,
      !!is_required,
      !!is_unique,
      default_value ?? null,
      options ? JSON.stringify(options) : null,
      validation ? JSON.stringify(validation) : null,
      order ?? 0,
    ])
    return NextResponse.json({ attribute: rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating attribute:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


