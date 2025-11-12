import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, query } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { parseJsonBody, handleApiError } from '@/lib/api-middleware'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 [DATA API] Request received for data model:', params.id)
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: dataModelId } = params
    console.log('🔍 [DATA API] Data model ID:', dataModelId)
    
    // Parse request body safely using shared utility
    const requestBody = await parseJsonBody<{
      customQuery?: string
      filters?: any
      limit?: number
      offset?: number
    }>(request) || {}
    
    const { customQuery, filters, limit, offset } = requestBody
    console.log('🔍 [DATA API] Request params:', { customQuery, filters, limit, offset })

    // Get data model and attributes using Prisma ORM - best practice
    const dataModel = await db.dataModel.findFirst({
      where: {
        id: dataModelId,
        deletedAt: null
      },
      include: {
        attributes: {
          where: {
            isActive: true,
            deletedAt: null
          },
          orderBy: [
            { order: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    })

    if (!dataModel) {
      console.error('❌ [DATA API] Data model not found:', dataModelId)
      return NextResponse.json({ 
        error: 'Data model not found',
        details: `No data model found with ID: ${dataModelId}`
      }, { status: 404 })
    }
    
    console.log('✅ [DATA API] Data model found:', dataModel.name)
    console.log('✅ [DATA API] Attributes count:', dataModel.attributes.length)

    // Transform attributes to match expected format
    const attributes = dataModel.attributes.map(attr => ({
      name: attr.name,
      display_name: attr.displayName,
      type: attr.type,
      is_required: attr.isRequired,
      is_unique: attr.isUnique,
      order: attr.order
    }))

    // Handle custom query - if provided, use raw SQL (for complex queries)
    if (customQuery) {
      const { rows: dataRows } = await query(customQuery, [dataModelId])
      const transformedData = dataRows.map(row => ({
        id: row.id,
        ...(row.values || {}),
        created_at: row.created_at,
        updated_at: row.updated_at
      }))
      
      return NextResponse.json({
        success: true,
        data: transformedData,
        metadata: {
          dataModelId,
          dataModelName: dataModel.name,
          attributes,
          total: transformedData.length,
          limit: null,
          offset: 0,
          filters: filters || [],
          customQuery,
          fetchedAt: new Date().toISOString()
        }
      })
    }

    // Check if we have filters - if so, use raw SQL for JSONB filtering
    const hasFilters = filters && typeof filters === 'object' && Object.keys(filters).length > 0

    if (hasFilters) {
      // Use raw SQL for JSONB filtering
      let whereConditions: string[] = ['dr.data_model_id = $1::uuid', 'dr.deleted_at IS NULL']
      let params: any[] = [dataModelId]
      let paramIndex = 2

      // Build filter conditions for each attribute
      for (const [attributeName, filterValue] of Object.entries(filters)) {
        if (!filterValue || filterValue === '') continue

        // Find the attribute to get its type
        const attribute = dataModel.attributes.find(attr => attr.name === attributeName)
        if (!attribute) continue

        // Handle different filter value types
        if (Array.isArray(filterValue)) {
          // Multi-select: check if any of the values match
          if (filterValue.length === 0) continue
          
          const valueConditions = filterValue.map((_, index) => 
            `drv2.value = $${paramIndex + index + 1}`
          ).join(' OR ')
          
          whereConditions.push(`EXISTS (
            SELECT 1 FROM data_record_values drv2 
            JOIN data_model_attributes dma2 ON drv2.attribute_id = dma2.id 
            WHERE drv2.data_record_id = dr.id 
            AND dma2.name = $${paramIndex} 
            AND dma2.deleted_at IS NULL
            AND (${valueConditions})
          )`)
          params.push(attributeName, ...filterValue)
          paramIndex += filterValue.length + 1
        } else if (typeof filterValue === 'object' && filterValue !== null) {
          // Range filter or complex filter object
          if ('min' in filterValue || 'max' in filterValue) {
            // Range filter
            const rangeFilter = filterValue as { min?: any; max?: any }
            const minValue = rangeFilter.min || ''
            const maxValue = rangeFilter.max || ''
            
            whereConditions.push(`EXISTS (
              SELECT 1 FROM data_record_values drv2 
              JOIN data_model_attributes dma2 ON drv2.attribute_id = dma2.id 
              WHERE drv2.data_record_id = dr.id 
              AND dma2.name = $${paramIndex} 
              AND dma2.deleted_at IS NULL
              AND (
                ($${paramIndex + 1} = '' OR drv2.value >= $${paramIndex + 1}) 
                AND ($${paramIndex + 2} = '' OR drv2.value <= $${paramIndex + 2})
              )
            )`)
            params.push(attributeName, minValue, maxValue)
            paramIndex += 3
          } else if ('contains' in filterValue) {
            // Contains filter
            whereConditions.push(`EXISTS (
              SELECT 1 FROM data_record_values drv2 
              JOIN data_model_attributes dma2 ON drv2.attribute_id = dma2.id 
              WHERE drv2.data_record_id = dr.id 
              AND dma2.name = $${paramIndex} 
              AND dma2.deleted_at IS NULL
              AND drv2.value ILIKE $${paramIndex + 1}
            )`)
            params.push(attributeName, `%${filterValue.contains}%`)
            paramIndex += 2
          } else if ('equals' in filterValue) {
            // Exact match
            whereConditions.push(`EXISTS (
              SELECT 1 FROM data_record_values drv2 
              JOIN data_model_attributes dma2 ON drv2.attribute_id = dma2.id 
              WHERE drv2.data_record_id = dr.id 
              AND dma2.name = $${paramIndex} 
              AND dma2.deleted_at IS NULL
              AND drv2.value = $${paramIndex + 1}
            )`)
            params.push(attributeName, filterValue.equals)
            paramIndex += 2
          }
        } else {
          // Simple string filter: use ILIKE for partial matching
          whereConditions.push(`EXISTS (
            SELECT 1 FROM data_record_values drv2 
            JOIN data_model_attributes dma2 ON drv2.attribute_id = dma2.id 
            WHERE drv2.data_record_id = dr.id 
            AND dma2.name = $${paramIndex} 
            AND dma2.deleted_at IS NULL
            AND drv2.value ILIKE $${paramIndex + 1}
          )`)
          params.push(attributeName, `%${filterValue}%`)
          paramIndex += 2
        }
      }

      // Build the query with filters
      const whereClause = whereConditions.join(' AND ')
      
      // Get filtered records
      const dataQuery = `
        SELECT DISTINCT dr.id, dr.created_at, dr.updated_at
        FROM data_records dr
        WHERE ${whereClause}
        ORDER BY dr.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `
      params.push(limit || 100, offset || 0)

      // Get total count
      const countQuery = `
        SELECT COUNT(DISTINCT dr.id) as total
        FROM data_records dr
        WHERE ${whereClause}
      `
      const countParams = params.slice(0, paramIndex)

      const { rows: dataRows } = await query(dataQuery, params)
      const { rows: countRows } = await query(countQuery, countParams)
      const total = parseInt(countRows[0]?.total || '0', 10)

      // Get the full records with values
      const recordIds = dataRows.map(row => row.id)
      if (recordIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          metadata: {
            dataModelId,
            dataModelName: dataModel.name,
            attributes,
            total: 0,
            limit: limit || null,
            offset: offset || 0,
            filters: filters || [],
            fetchedAt: new Date().toISOString()
          }
        })
      }

      const dataRecords = await db.dataRecord.findMany({
        where: {
          id: { in: recordIds },
          dataModelId: dataModelId,
          deletedAt: null
        },
        include: {
          values: {
            include: {
              attribute: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // Transform data records to match expected format
      const transformedData = dataRecords.map(record => {
        const values: Record<string, any> = {}
        record.values.forEach(drv => {
          if (drv.attribute) {
            values[drv.attribute.name] = drv.value
          }
        })
        
        return {
          id: record.id,
          ...values,
          created_at: record.createdAt,
          updated_at: record.updatedAt
        }
      })

      console.log('✅ [DATA API] Filtered data records found:', transformedData.length)
      console.log('✅ [DATA API] Total filtered count:', total)

      return NextResponse.json({
        success: true,
        data: transformedData,
        metadata: {
          dataModelId,
          dataModelName: dataModel.name,
          attributes,
          total,
          limit: limit || null,
          offset: offset || 0,
          filters: filters || [],
          fetchedAt: new Date().toISOString()
        }
      })
    }

    // Use Prisma ORM for standard queries without filters
    const whereClause: Prisma.DataRecordWhereInput = {
      dataModelId: dataModelId,
      deletedAt: null
    }

    let dataRecords = await db.dataRecord.findMany({
      where: whereClause,
      include: {
        values: {
          include: {
            attribute: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit || 100,
      skip: offset || 0
    })

    // Get total count
    const total = await db.dataRecord.count({
      where: whereClause
    })

    // Transform data records to match expected format
    const transformedData = dataRecords.map(record => {
      const values: Record<string, any> = {}
      record.values.forEach(drv => {
        if (drv.attribute) {
          values[drv.attribute.name] = drv.value
        }
      })
      
      return {
        id: record.id,
        ...values,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      }
    })
    
    console.log('✅ [DATA API] Data records found:', dataRecords.length)
    console.log('✅ [DATA API] Total count:', total)
    console.log('✅ [DATA API] Transformed data count:', transformedData.length)

    const response = {
      success: true,
      data: transformedData,
      metadata: {
        dataModelId,
        dataModelName: dataModel.name,
        attributes,
        total,
        limit: limit || null,
        offset: offset || 0,
        filters: filters || [],
        customQuery: customQuery || null,
        fetchedAt: new Date().toISOString()
      }
    }
    
    console.log('✅ [DATA API] Sending response with', transformedData.length, 'records')
    return NextResponse.json(response)
  } catch (error) {
    return handleApiError(error, 'DataModelDataAPI')
  }
}
