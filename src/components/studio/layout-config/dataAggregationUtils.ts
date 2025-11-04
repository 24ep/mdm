/**
 * Data aggregation utilities for applying aggregations to data
 * Groups data by dimensions and applies aggregations to measures
 */

import { AggregationType } from './ChartDataSourceConfig'

export interface AggregationConfig {
  dimensions: string[]
  measures: Record<string, AggregationType> // measure name -> aggregation type
}

/**
 * Apply aggregations to data grouped by dimensions
 * @param data Raw data array
 * @param config Aggregation configuration
 * @returns Aggregated data array
 */
export function applyAggregations(
  data: any[],
  config: AggregationConfig
): any[] {
  const { dimensions, measures } = config

  // If no dimensions, we can't group - return data as-is or apply aggregations across all rows
  if (dimensions.length === 0) {
    if (Object.keys(measures).length === 0) {
      return data
    }

    // Apply aggregations across all rows without grouping
    const aggregated: any = {}
    Object.keys(measures).forEach(measure => {
      const aggregation = measures[measure]
      aggregated[measure] = aggregateValue(data, measure, aggregation)
    })
    return [aggregated]
  }

  // Group data by dimension values
  const grouped = new Map<string, any[]>()

  data.forEach(row => {
    // Create group key from dimension values
    const groupKey = dimensions
      .map(dim => {
        const value = row[dim]
        return value !== undefined && value !== null ? String(value) : '__null__'
      })
      .join('|||')

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, [])
    }
    grouped.get(groupKey)!.push(row)
  })

  // Apply aggregations to each group
  const result: any[] = []

  grouped.forEach((groupRows, groupKey) => {
    const dimensionValues = groupKey.split('|||')
    const aggregatedRow: any = {}

    // Add dimension values
    dimensions.forEach((dim, index) => {
      const value = dimensionValues[index]
      aggregatedRow[dim] = value === '__null__' ? null : value
    })

    // Apply aggregations to measures
    Object.keys(measures).forEach(measure => {
      const aggregation = measures[measure]
      aggregatedRow[measure] = aggregateValue(groupRows, measure, aggregation)
    })

    result.push(aggregatedRow)
  })

  return result
}

/**
 * Aggregate a single measure value from an array of rows
 * @param rows Array of data rows
 * @param measureName Name of the measure attribute
 * @param aggregation Aggregation type to apply
 * @returns Aggregated value
 */
function aggregateValue(
  rows: any[],
  measureName: string,
  aggregation: AggregationType
): number | null {
  if (!rows || rows.length === 0) {
    return null
  }

  const values = rows
    .map(row => row[measureName])
    .filter(v => v !== undefined && v !== null)
    .map(v => {
      // Try to convert to number
      const num = typeof v === 'number' ? v : parseFloat(String(v))
      return isNaN(num) ? null : num
    })
    .filter(v => v !== null) as number[]

  if (values.length === 0) {
    return null
  }

  switch (aggregation) {
    case 'SUM':
      return values.reduce((sum, val) => sum + val, 0)
    
    case 'AVG':
      return values.reduce((sum, val) => sum + val, 0) / values.length
    
    case 'COUNT':
      return rows.length
    
    case 'COUNT_DISTINCT':
      const distinctValues = new Set(values)
      return distinctValues.size
    
    case 'MIN':
      return Math.min(...values)
    
    case 'MAX':
      return Math.max(...values)
    
    case 'NONE':
      // Return first value
      return values[0] ?? null
    
    default:
      return values[0] ?? null
  }
}

/**
 * Get aggregation configuration from widget properties
 * @param chartDimensions Chart dimensions configuration
 * @param aggregations Aggregations configuration
 * @param dimensionKeys Keys that represent dimensions (non-measures)
 * @param measureKeys Keys that represent measures (values/metrics)
 * @returns Aggregation configuration
 */
export function getAggregationConfig(
  chartDimensions: Record<string, string | string[]>,
  aggregations: Record<string, Record<string, AggregationType>>,
  dimensionKeys: string[],
  measureKeys: string[]
): AggregationConfig {
  const dimensions: string[] = []
  const measures: Record<string, AggregationType> = {}

  // Extract dimensions
  dimensionKeys.forEach(key => {
    const value = chartDimensions[key]
    if (Array.isArray(value)) {
      dimensions.push(...value.filter(v => v))
    } else if (value) {
      dimensions.push(value)
    }
  })

  // Extract measures with their aggregations
  measureKeys.forEach(key => {
    const value = chartDimensions[key]
    const attrNames = Array.isArray(value) 
      ? value.filter(v => v)
      : value 
        ? [value] 
        : []
    
    attrNames.forEach(attrName => {
      // Get aggregation for this attribute in this dimension key
      const aggregation = aggregations[key]?.[attrName]
      if (aggregation) {
        measures[attrName] = aggregation
      } else {
        // Default aggregation if not set
        measures[attrName] = 'SUM'
      }
    })
  })

  return { dimensions, measures }
}

