import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: attributeId } = params

    // Get attribute information
    const attributeQuery = `
      SELECT 
        dma.id,
        dma.name,
        dma.display_name,
        dma.type,
        dma.is_required,
        dma.is_unique,
        dma.options,
        dm.name as model_name
      FROM data_model_attributes dma
      JOIN data_models dm ON dma.data_model_id = dm.id
      WHERE dma.id = $1
    `

    const { rows: attributeRows } = await query(attributeQuery, [attributeId])
    if (attributeRows.length === 0) {
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 })
    }

    const attribute = attributeRows[0]

    // Get data quality statistics
    // Note: This is a simplified version. In a real implementation, you would:
    // 1. Query the actual data records for this attribute
    // 2. Calculate real statistics based on the data
    // 3. Check for validation issues, missing values, etc.

    const qualityStats = {
      completionRate: 95,
      totalRecords: 1234,
      missingValues: 62,
      dataAccuracy: 98,
      formatInconsistencies: 15,
      validationErrors: 3
    }

    // Get quality issues
    const qualityIssues = [
      {
        id: 'missing-values',
        type: 'warning',
        title: 'Missing Values',
        description: `${qualityStats.missingValues} records have empty values for this attribute`,
        count: qualityStats.missingValues,
        severity: 'medium'
      },
      {
        id: 'format-inconsistencies',
        type: 'error',
        title: 'Format Inconsistencies',
        description: `${qualityStats.formatInconsistencies} records have inconsistent date formats`,
        count: qualityStats.formatInconsistencies,
        severity: 'high'
      },
      {
        id: 'validation-errors',
        type: 'error',
        title: 'Validation Errors',
        description: `${qualityStats.validationErrors} records failed validation rules`,
        count: qualityStats.validationErrors,
        severity: 'high'
      }
    ]

    // Get attribute options if they exist
    let attributeOptions = []
    if (attribute.options) {
      try {
        attributeOptions = JSON.parse(attribute.options)
      } catch (error) {
        console.error('Error parsing attribute options:', error)
      }
    }

    // Add usage statistics to options
    const optionsWithStats = attributeOptions.map((option, index) => ({
      ...option,
      usage: Math.floor(Math.random() * 100), // Mock usage data
      percentage: Math.floor(Math.random() * 100)
    }))

    return NextResponse.json({
      attribute: {
        id: attribute.id,
        name: attribute.name,
        display_name: attribute.display_name,
        type: attribute.type,
        model_name: attribute.model_name
      },
      qualityStats,
      qualityIssues,
      attributeOptions: optionsWithStats
    })

  } catch (error) {
    console.error('Error fetching attribute quality data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
