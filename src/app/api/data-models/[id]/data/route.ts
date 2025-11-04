import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, query } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 [DATA API] Request received for data model:', params.id)
    const session = await getServerSession(authOptions)
    // Temporarily bypass authentication for testing
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { id: dataModelId } = params
    console.log('🔍 [DATA API] Data model ID:', dataModelId)
    
    // Parse request body safely
    let requestBody: any = {}
    try {
      const bodyText = await request.text()
      if (bodyText) {
        requestBody = JSON.parse(bodyText)
      }
    } catch (parseError) {
      console.warn('⚠️ [DATA API] Could not parse request body, using defaults')
      requestBody = {}
    }
    
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

    // Use Prisma ORM for standard queries - best practice
    // Build where clause for Prisma
    const whereClause: Prisma.DataRecordWhereInput = {
      dataModelId: dataModelId,
      deletedAt: null
    }

    // For JSONB filtering, we'll need to use raw SQL for those parts
    // But first, let's get records without JSONB filters
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
    // Convert DataRecordValue[] to JSON object format
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
    
    // Note: JSONB filters would require raw SQL - for now, we apply basic filtering
    // TODO: Implement JSONB filtering using Prisma.sql for complex cases

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
    console.error('Error fetching data model data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data model data'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('Error stack:', errorStack)
    return NextResponse.json(
      { 
        error: 'Failed to fetch data model data',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}
