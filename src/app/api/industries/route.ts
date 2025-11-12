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
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    const offset = (page - 1) * limit

    const filters: string[] = ['deleted_at IS NULL']
    const params: any[] = []
    if (search) {
      params.push(`%${search}%`)
      filters.push(`name ILIKE $${params.length}`)
    }
    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : ''

    const dataSql = `
      SELECT id, name, description, parent_id
      FROM industries
      ${where}
      ORDER BY name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    const countSql = `SELECT COUNT(*)::int AS total FROM industries ${where}`

    const [{ rows: industries }, { rows: totals }] = await Promise.all([
      query(dataSql, [...params, limit, offset]),
      query(countSql, params),
    ])

    const total = totals[0]?.total || 0

    return NextResponse.json({
      industries: industries || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching industries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


