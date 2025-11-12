import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { reportSchema } from '@/lib/validation/report-schemas'
import { auditLogger } from '@/lib/utils/audit-logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')
    const spaceId = searchParams.get('space_id')
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('category_id')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    const params: any[] = [session.user.id]
    const filters: string[] = ['r.deleted_at IS NULL']

    if (source) {
      params.push(source.toUpperCase().replace('-', '_'))
      filters.push('r.source = $' + params.length)
    }

    if (spaceId) {
      params.push(spaceId)
      filters.push('rs.space_id = $' + params.length)
    }

    if (categoryId) {
      params.push(categoryId)
      filters.push('r.category_id = $' + params.length)
    }

    if (status) {
      params.push(status === 'active')
      filters.push('r.is_active = $' + params.length)
    }

    if (dateFrom) {
      params.push(dateFrom)
      filters.push('r.created_at >= $' + params.length + '::date')
    }

    if (dateTo) {
      params.push(dateTo)
      filters.push('r.created_at <= $' + params.length + '::date')
    }

    if (search) {
      params.push(`%${search}%`, `%${search}%`)
      filters.push('(r.name ILIKE $' + (params.length - 1) + ' OR r.description ILIKE $' + params.length + ')')
    }

    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : ''

    const reportsSql = `
      SELECT DISTINCT r.*,
             c.name as category_name,
             f.name as folder_name
      FROM public.reports r
      LEFT JOIN report_spaces rs ON rs.report_id = r.id
      LEFT JOIN report_permissions rp ON rp.report_id = r.id AND rp.user_id = $1
      LEFT JOIN report_categories c ON c.id = r.category_id
      LEFT JOIN report_folders f ON f.id = r.folder_id
      WHERE (
        r.created_by = $1 OR
        rp.user_id = $1 OR
        (rs.space_id IN (
          SELECT sm.space_id FROM space_members sm WHERE sm.user_id = $1
        )) OR
        r.is_public = true
      )
      ${where.replace('WHERE', 'AND')}
      ORDER BY r.created_at DESC
    `

    const categoriesSql = `
      SELECT * FROM report_categories
      WHERE deleted_at IS NULL
      ORDER BY name
    `

    const foldersSql = `
      SELECT * FROM report_folders
      WHERE deleted_at IS NULL
      ORDER BY name
    `

    const [{ rows: reports }, { rows: categories }, { rows: folders }] = await Promise.all([
      query(reportsSql, params),
      query(categoriesSql, []),
      query(foldersSql, [])
    ])

    return NextResponse.json({
      reports: reports || [],
      categories: categories || [],
      folders: folders || []
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      name,
      description,
      source,
      category_id,
      folder_id,
      owner,
      link,
      workspace,
      embed_url,
      metadata,
      space_ids
    } = body

    if (!name || !source) {
      return NextResponse.json({ error: 'Name and source are required' }, { status: 400 })
    }

    const insertSql = `
      INSERT INTO public.reports (
        name, description, source, category_id, folder_id,
        owner, link, workspace, embed_url, metadata,
        created_by, is_active, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `

    const result = await query(insertSql, [
      name,
      description || null,
      source,
      category_id || null,
      folder_id || null,
      owner || null,
      link || null,
      workspace || null,
      embed_url || null,
      metadata ? JSON.stringify(metadata) : null,
      session.user.id,
      true,
      false
    ])

    const report = result.rows[0]

    // Log audit event
    auditLogger.reportCreated(report.id, { source: validationResult.data.source })

    // Associate with spaces
    if (space_ids && space_ids.length > 0) {
      for (const spaceId of space_ids) {
        await query(
          'INSERT INTO report_spaces (report_id, space_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [report.id, spaceId]
        )
      }
    }

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

