import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: dataModelId } = params
    const { customQuery, filters, limit, offset } = await request.json()

    // Get data model information
    const { rows: modelRows } = await query(
      `SELECT dm.*, dma.name as attribute_name, dma.display_name as attribute_display_name, 
              dma.type as attribute_type, dma.is_required, dma.is_unique, dma.order
       FROM public.data_models dm
       LEFT JOIN public.data_model_attributes dma ON dma.data_model_id = dm.id
       WHERE dm.id = $1 AND dm.deleted_at IS NULL
       ORDER BY dma.order ASC`,
      [dataModelId]
    )

    if (modelRows.length === 0) {
      return NextResponse.json({ error: 'Data model not found' }, { status: 404 })
    }

    const dataModel = modelRows[0]
    const attributes = modelRows
      .filter(row => row.attribute_name)
      .map(row => ({
        name: row.attribute_name,
        display_name: row.attribute_display_name,
        type: row.attribute_type,
        is_required: row.is_required,
        is_unique: row.is_unique,
        order: row.order
      }))

    // Build the query to fetch data records
    let dataQuery = customQuery || `SELECT * FROM data_records WHERE data_model_id = $1`
    let queryParams = [dataModelId]

    // Add filters if provided
    if (filters && filters.length > 0) {
      const filterConditions = filters.map((filter: any, index: number) => {
        const paramIndex = queryParams.length + 1
        queryParams.push(filter.value)
        
        switch (filter.operator) {
          case '=':
            return `values->>'${filter.field}' = $${paramIndex}`
          case '!=':
            return `values->>'${filter.field}' != $${paramIndex}`
          case '>':
            return `(values->>'${filter.field}')::numeric > $${paramIndex}`
          case '<':
            return `(values->>'${filter.field}')::numeric < $${paramIndex}`
          case '>=':
            return `(values->>'${filter.field}')::numeric >= $${paramIndex}`
          case '<=':
            return `(values->>'${filter.field}')::numeric <= $${paramIndex}`
          case 'contains':
            return `values->>'${filter.field}' ILIKE $${paramIndex}`
          case 'starts_with':
            return `values->>'${filter.field}' ILIKE $${paramIndex}`
          case 'ends_with':
            return `values->>'${filter.field}' ILIKE $${paramIndex}`
          default:
            return `values->>'${filter.field}' = $${paramIndex}`
        }
      })

      if (!customQuery) {
        dataQuery += ` AND ${filterConditions.join(' AND ')}`
      }
    }

    // Add ordering and pagination
    if (!customQuery) {
      dataQuery += ` ORDER BY created_at DESC`
      if (limit) {
        queryParams.push(limit)
        dataQuery += ` LIMIT $${queryParams.length}`
      }
      if (offset) {
        queryParams.push(offset)
        dataQuery += ` OFFSET $${queryParams.length}`
      }
    }

    // Execute the query
    const { rows: dataRows } = await query(dataQuery, queryParams)

    // Transform the data to a more usable format
    const transformedData = dataRows.map(row => ({
      id: row.id,
      ...row.values,
      created_at: row.created_at,
      updated_at: row.updated_at
    }))

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM data_records WHERE data_model_id = $1`
    let countParams = [dataModelId]

    if (filters && filters.length > 0 && !customQuery) {
      const filterConditions = filters.map((filter: any, index: number) => {
        const paramIndex = countParams.length + 1
        countParams.push(filter.value)
        
        switch (filter.operator) {
          case '=':
            return `values->>'${filter.field}' = $${paramIndex}`
          case '!=':
            return `values->>'${filter.field}' != $${paramIndex}`
          case '>':
            return `(values->>'${filter.field}')::numeric > $${paramIndex}`
          case '<':
            return `(values->>'${filter.field}')::numeric < $${paramIndex}`
          case '>=':
            return `(values->>'${filter.field}')::numeric >= $${paramIndex}`
          case '<=':
            return `(values->>'${filter.field}')::numeric <= $${paramIndex}`
          case 'contains':
            return `values->>'${filter.field}' ILIKE $${paramIndex}`
          case 'starts_with':
            return `values->>'${filter.field}' ILIKE $${paramIndex}`
          case 'ends_with':
            return `values->>'${filter.field}' ILIKE $${paramIndex}`
          default:
            return `values->>'${filter.field}' = $${paramIndex}`
        }
      })
      countQuery += ` AND ${filterConditions.join(' AND ')}`
    }

    const { rows: countRows } = await query(countQuery, countParams)
    const total = parseInt(countRows[0]?.total || '0')

    return NextResponse.json({
      success: true,
      data: transformedData,
      metadata: {
        dataModelId,
        dataModelName: dataModel.display_name,
        attributes,
        total,
        limit: limit || null,
        offset: offset || 0,
        filters: filters || [],
        customQuery: customQuery || null,
        fetchedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching data model data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data model data' },
      { status: 500 }
    )
  }
}
