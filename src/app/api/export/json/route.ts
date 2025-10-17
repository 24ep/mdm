import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { elementId, datasourceId, query, filters } = await request.json()

    // Validate required fields
    if (!elementId || !datasourceId) {
      return NextResponse.json(
        { error: 'Element ID and Data Source ID are required' },
        { status: 400 }
      )
    }

    // TODO: Implement actual data fetching from data source
    // For now, return mock JSON data
    const mockData = {
      elementId,
      datasourceId,
      query,
      filters,
      data: [
        { date: '2024-01-01', value: 100, category: 'A' },
        { date: '2024-01-02', value: 150, category: 'B' },
        { date: '2024-01-03', value: 200, category: 'A' },
        { date: '2024-01-04', value: 175, category: 'C' },
        { date: '2024-01-05', value: 225, category: 'B' }
      ],
      metadata: {
        exportedAt: new Date().toISOString(),
        totalRecords: 5,
        dataSource: datasourceId
      }
    }

    // Create response with JSON content
    const response = new NextResponse(JSON.stringify(mockData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="chart_data_${elementId}.json"`
      }
    })

    return response
  } catch (error) {
    console.error('Error exporting to JSON:', error)
    return NextResponse.json(
      { error: 'Failed to export data to JSON' },
      { status: 500 }
    )
  }
}
