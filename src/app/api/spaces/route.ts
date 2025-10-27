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

    const offset = (page - 1) * limit

    const listSql = `
      SELECT s.id, s.name, s.description, s.slug, s.is_default, s.is_active, 
             s.icon, s.logo_url, s.created_at, s.updated_at
      FROM spaces s
      WHERE s.deleted_at IS NULL AND s.is_active = true
      ORDER BY s.is_default DESC, s.name ASC
      LIMIT $1 OFFSET $2
    `
    
    const countSql = `
      SELECT COUNT(*)::int AS total 
      FROM spaces s
      WHERE s.deleted_at IS NULL AND s.is_active = true
    `
    
    const [{ rows: spaces }, { rows: totalRows }] = await Promise.all([
      query<any>(listSql, [limit, offset]),
      query<{ total: number }>(countSql, []),
    ])
    
    const total = totalRows[0]?.total || 0
    return NextResponse.json({
      spaces: spaces || [],
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching spaces:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spaces' },
      { status: 500 }
    )
  }
}