import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { createExternalClient } from '@/lib/external-db'
import { isUuid } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // Temporarily bypass authentication for testing
    // if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const dataModelId = searchParams.get('data_model_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!dataModelId) {
      return NextResponse.json({ error: 'data_model_id is required' }, { status: 400 })
    }
    if (!isUuid(dataModelId)) {
      return NextResponse.json({ error: 'Invalid data_model_id' }, { status: 400 })
    }

    const offset = (page - 1) * limit

    // Load data model and potential external configuration
    const { rows: modelRows } = await query<any>(
      `SELECT dm.id, dm.source_type, dm.external_connection_id, dm.external_schema, dm.external_table, dm.external_primary_key
             , ec.id as conn_id, ec.db_type, ec.host, ec.port, ec.database, ec.username, ec.password, ec.options
       FROM public.data_models dm
       LEFT JOIN public.external_connections ec ON ec.id = dm.external_connection_id AND ec.deleted_at IS NULL AND ec.is_active = TRUE
       WHERE dm.id = $1 AND dm.deleted_at IS NULL`,
      [dataModelId]
    )
    const model = modelRows[0]
    if (!model) {
      return NextResponse.json({ error: 'data_model not found' }, { status: 404 })
    }
    
    // Extract filters from search params
    const filters: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      if (key.startsWith('filter_')) {
        const attributeName = key.replace('filter_', '')
        filters[attributeName] = value
      }
    })

    // Sort params
    const sortBy = (searchParams.get('sort_by') || '').trim()
    const sortDirectionRaw = (searchParams.get('sort_direction') || 'desc').trim().toLowerCase()
    const sortDirection = sortDirectionRaw === 'asc' ? 'ASC' : 'DESC'
    
    console.log('🔍 Fetching records for model:', dataModelId)
    console.log('🔍 Page:', page, 'Limit:', limit, 'Offset:', offset)
    console.log('🔍 Filters:', filters)
    console.log('🔍 Sort:', { sortBy, sortDirection })
    
    // If EXTERNAL model, query external database
    if (model.source_type === 'EXTERNAL' && model.conn_id && model.external_table) {
      // Load attribute mappings
      const { rows: attrs } = await query<{ name: string; external_column: string | null }>(
        `SELECT name, external_column FROM public.data_model_attributes WHERE data_model_id = $1 AND deleted_at IS NULL ORDER BY "order" ASC` as any,
        [dataModelId]
      )

      // Build select list mapping
      const nameToColumn: Record<string, string> = {}
      for (const a of attrs) {
        if (a.external_column) nameToColumn[a.name] = a.external_column
      }

      // Quoting helpers
      const isPg = model.db_type === 'postgres'
      const q = (id: string) => (isPg ? `"${id}"` : `\`${id}\``)
      const qualify = (schema: string | null, table: string) => {
        if (!schema) return isPg ? q(table) : q(table)
        return isPg ? `${q(schema)}.${q(table)}` : `${q(schema)}.${q(table)}`
      }

      const tableRef = qualify(model.external_schema, model.external_table)

      // Build WHERE from filters
      const whereClauses: string[] = []
      const extParams: any[] = []
      for (const [attrName, filterValue] of Object.entries(filters)) {
        const col = nameToColumn[attrName]
        if (!col) continue
        if (typeof filterValue === 'string' && filterValue.includes(',')) {
          const values = filterValue.split(',').map(v => v.trim()).filter(Boolean)
          if (values.length) {
            const placeholders = values.map(() => '?').join(',')
            whereClauses.push(`${q(col)} IN (${placeholders})`)
            extParams.push(...values)
          }
        } else {
          whereClauses.push(`${q(col)} LIKE ?`)
          extParams.push(`%${filterValue}%`)
        }
      }

      // Sorting
      let orderClause = ''
      if (sortBy) {
        const sortCol = nameToColumn[sortBy] || sortBy
        orderClause = `ORDER BY ${q(sortCol)} ${sortDirection}`
      }

      // Pagination
      const limitClause = isPg ? 'LIMIT $1 OFFSET $2' : 'LIMIT ? OFFSET ?'

      // Build select columns
      const selectCols = Object.entries(nameToColumn).map(([attr, col]) => `${q(col)} AS ${isPg ? '"' + attr + '"' : '`' + attr + '`'}`)
      const pkCol = model.external_primary_key ? q(model.external_primary_key) : (isPg ? 'NULL::text' : 'NULL')
      const selectSql = `SELECT ${pkCol} AS id${selectCols.length ? ', ' + selectCols.join(', ') : ''} FROM ${tableRef}`
      const whereSql = whereClauses.length ? ` WHERE ${whereClauses.join(' AND ')}` : ''
      const finalSql = `${selectSql}${whereSql} ${orderClause} ${limitClause}`.trim()

      // Prepare parameter placeholders for pg vs mysql
      let runSql = finalSql
      let paramsAny: any[] = []
      if (isPg) {
        // Replace '?' with $n
        let counter = 1
        runSql = finalSql.replace(/\?/g, () => `$${counter++}`)
        paramsAny = [...extParams, limit, offset]
      } else {
        paramsAny = [...extParams, limit, offset]
      }

      // Count query
      const countBase = `SELECT COUNT(1) as total FROM ${tableRef}${whereSql}`
      let countSql = countBase
      let countParams: any[] = []
      if (isPg) {
        let counter = 1
        countSql = countBase.replace(/\?/g, () => `$${counter++}`)
        countParams = [...extParams]
      } else {
        countParams = [...extParams]
      }

      const client = await createExternalClient({
        id: model.conn_id,
        db_type: model.db_type,
        host: model.host,
        port: model.port,
        database: model.database,
        username: model.username,
        password: model.password,
        options: model.options,
      })
      try {
        const [{ rows: extRows }, { rows: countRows }]: any = await Promise.all([
          client.query(runSql, paramsAny),
          client.query(countSql, countParams),
        ])

        const total = (countRows?.[0]?.total as number) || 0
        const mapped = (extRows || []).map((r: any) => ({
          id: String(r.id ?? ''),
          data_model_id: dataModelId,
          is_active: true,
          created_at: null,
          updated_at: null,
          deleted_at: null,
          values: Object.fromEntries(
            Object.entries(nameToColumn).map(([attr]) => [attr, r[attr] ?? null])
          ),
        }))

        return NextResponse.json({
          records: mapped,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        })
      } finally {
        await client.close()
      }
    }

    // INTERNAL: Build dynamic query with filters
    let whereConditions = ['dr.data_model_id = $1', 'dr.is_active = TRUE']
    let params: any[] = [dataModelId]
    let paramIndex = 2
    
    // Add filter conditions
    Object.entries(filters).forEach(([attributeName, filterValue]) => {
      if (filterValue && filterValue.trim() !== '') {
        // Check if it's a comma-separated value (could be multi-select or range)
        if (filterValue.includes(',')) {
          const values = filterValue.split(',').map(v => v.trim()).filter(v => v)
          
          if (values.length > 0) {
            // Check if it's a range (2 values, both numeric or date-like)
            const isRange = values.length === 2 && (
              (!isNaN(Number(values[0])) && !isNaN(Number(values[1]))) || // Number range
              (values[0].includes('-') && values[1].includes('-')) || // Date range
              (values[0].includes('T') && values[1].includes('T')) // DateTime range
            )
            
            if (isRange) {
              // Range filter: min <= value <= max
              whereConditions.push(`EXISTS (
                SELECT 1 FROM public.data_record_values drv2 
                JOIN public.data_model_attributes dma2 ON drv2.attribute_id = dma2.id 
                WHERE drv2.data_record_id = dr.id 
                AND dma2.name = $${paramIndex} 
                AND (
                  ($${paramIndex + 1} = '' OR drv2.value >= $${paramIndex + 1}) 
                  AND ($${paramIndex + 2} = '' OR drv2.value <= $${paramIndex + 2})
                )
              )`)
              params.push(attributeName, values[0] || '', values[1] || '')
              paramIndex += 3
            } else {
              // Multi-select: check if any of the values match
              const valueConditions = values.map((_, index) => `drv2.value = $${paramIndex + index + 1}`).join(' OR ')
              whereConditions.push(`EXISTS (
                SELECT 1 FROM public.data_record_values drv2 
                JOIN public.data_model_attributes dma2 ON drv2.attribute_id = dma2.id 
                WHERE drv2.data_record_id = dr.id 
                AND dma2.name = $${paramIndex} 
                AND (${valueConditions})
              )`)
              params.push(attributeName, ...values)
              paramIndex += values.length + 1
            }
          }
        } else {
          // Single value: use ILIKE for partial matching
          whereConditions.push(`EXISTS (
            SELECT 1 FROM public.data_record_values drv2 
            JOIN public.data_model_attributes dma2 ON drv2.attribute_id = dma2.id 
            WHERE drv2.data_record_id = dr.id 
            AND dma2.name = $${paramIndex} 
            AND drv2.value ILIKE $${paramIndex + 1}
          )`)
          params.push(attributeName, `%${filterValue}%`)
          paramIndex += 2
        }
      }
    })

    // Capture number of WHERE params before adding sort/limit/offset
    const whereParamCount = params.length

    // Determine ORDER BY clause
    let orderClause = ''
    if (sortBy) {
      if (['created_at','updated_at','id'].includes(sortBy)) {
        orderClause = `ORDER BY dr.${sortBy} ${sortDirection}`
      } else {
        // Sort by attribute value
        orderClause = `ORDER BY MAX(CASE WHEN dma.name = $${paramIndex} THEN drv.value END) ${sortDirection} NULLS LAST`
        params.push(sortBy)
        paramIndex += 1
      }
    } else {
      orderClause = 'ORDER BY dr.created_at DESC'
    }
    
    const baseQuery = `
      SELECT 
        dr.id,
        dr.data_model_id,
        dr.is_active,
        dr.created_at,
        dr.updated_at,
        dr.deleted_at,
        COALESCE(
          jsonb_object_agg(
            dma.name, 
            drv.value
          ) FILTER (WHERE drv.attribute_id IS NOT NULL), 
          '{}'::jsonb
        ) as values
      FROM public.data_records dr
      LEFT JOIN public.data_record_values drv ON dr.id = drv.data_record_id
      LEFT JOIN public.data_model_attributes dma ON drv.attribute_id = dma.id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY dr.id, dr.data_model_id, dr.is_active, dr.created_at, dr.updated_at, dr.deleted_at
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    params.push(limit, offset)
    
    // Count query with same filters
    const countQuery = `
      SELECT COUNT(DISTINCT dr.id)::int AS total 
      FROM public.data_records dr
      WHERE ${whereConditions.join(' AND ')}
    `
    
    const countParams = params.slice(0, whereParamCount)
    
    console.log('🔍 Main Query:', baseQuery)
    console.log('🔍 Main Parameters:', params)
    console.log('🔍 Count Query:', countQuery)
    console.log('🔍 Count Parameters:', countParams)

    const [{ rows: records }, { rows: totalRows }] = await Promise.all([
      query<any>(baseQuery, params),
      query<{ total: number }>(countQuery, countParams),
    ])
    
    const total = totalRows[0]?.total || 0
    
    console.log('🔍 Records found:', records.length)
    console.log('🔍 Total records:', total)
    
    if (records.length > 0) {
      const sampleRecord = records[0]
      console.log('🔍 Sample record ID:', sampleRecord.id)
      console.log('🔍 Sample record values:', sampleRecord.values)
      console.log('🔍 Sample record values keys:', Object.keys(sampleRecord.values || {}))
      console.log('🔍 Sample record values count:', Object.keys(sampleRecord.values || {}).length)
    }

    return NextResponse.json({
      records: records || [],
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching records:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { data_model_id, values } = body

    if (!data_model_id || !Array.isArray(values)) {
      return NextResponse.json({ error: 'data_model_id and values[] required' }, { status: 400 })
    }

    const { rows: recordRows } = await query<any>(
      'INSERT INTO public.data_records (data_model_id) VALUES ($1) RETURNING *',
      [data_model_id]
    )
    const record = recordRows[0]

    if (values.length) {
      const insertValuesSql = `
        INSERT INTO public.data_record_values (data_record_id, attribute_id, value)
        VALUES ${values.map((_, idx) => `($1, $${idx * 2 + 2}, $${idx * 2 + 3})`).join(', ')}
      `
      const flatParams: any[] = [record.id]
      for (const v of values) {
        flatParams.push(v.attribute_id, v.value ?? null)
      }
      await query(insertValuesSql, flatParams)
    }

    const { rows: fullRows } = await query<any>(
      'SELECT * FROM public.data_records WHERE id = $1',
      [record.id]
    )
    return NextResponse.json({ record: fullRows[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


