import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dataModelId, filters, columns, elementId, datasourceId, query } = await request.json()

    // Support both old format (elementId/datasourceId) and new format (dataModelId)
    const modelId = dataModelId || datasourceId

    if (!modelId) {
      return NextResponse.json(
        { error: 'Data Model ID is required' },
        { status: 400 }
      )
    }

    // Fetch data from data model
    const dataResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/data-models/${modelId}/data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          customQuery: query || undefined,
          filters: filters || {},
          limit: 10000, // Max records for export
          offset: 0
        })
      }
    )

    if (!dataResponse.ok) {
      const error = await dataResponse.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to fetch data')
    }

    const { data, metadata } = await dataResponse.json()

    // Filter columns if specified
    let exportData = data || []
    if (columns && Array.isArray(columns) && columns.length > 0) {
      exportData = exportData.map((record: any) => {
        const filtered: any = {}
        columns.forEach((col: string) => {
          if (record[col] !== undefined) {
            filtered[col] = record[col]
          }
        })
        return filtered
      })
    }

    const exportPayload = {
      elementId: elementId || null,
      dataModelId: modelId,
      query: query || null,
      filters: filters || {},
      data: exportData,
      metadata: {
        ...metadata,
        exportedAt: new Date().toISOString(),
        totalRecords: exportData.length,
        columns: columns || metadata?.attributes?.map((attr: any) => attr.name) || []
      }
    }

    // Create response with JSON content
    const filename = elementId 
      ? `chart_data_${elementId}.json`
      : `export_${modelId}_${new Date().toISOString().split('T')[0]}.json`

    const response = new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

    return response
  } catch (error: any) {
    console.error('Error exporting to JSON:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export data to JSON' },
      { status: 500 }
    )
  }
}
