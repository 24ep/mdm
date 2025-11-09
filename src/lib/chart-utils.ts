/**
 * Shared Chart Utilities
 * Common chart configuration and data processing utilities
 */

export type ChartType = 
  | 'BAR' | 'HORIZONTAL_BAR' | 'LINE' | 'AREA' | 'PIE' | 'DONUT'
  | 'SCATTER' | 'RADAR' | 'GAUGE' | 'FUNNEL' | 'WATERFALL'
  | 'TREEMAP' | 'HEATMAP' | 'BUBBLE_MAP' | 'COMPOSED' | 'TABLE' | 'PIVOT_TABLE'

export interface ChartConfig {
  type: ChartType
  title?: string
  dimensions: string[]
  measures: string[]
  filters?: any[]
  colors?: string[]
  isLive?: boolean
  refreshInterval?: number
}

export interface ChartDataPoint {
  [key: string]: any
}

export const DEFAULT_CHART_COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
  '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'
]

/**
 * Process chart data with filters
 */
export function processChartData(
  data: ChartDataPoint[],
  dimensions: string[],
  measures: string[],
  filters?: any[]
): ChartDataPoint[] {
  let processed = [...data]

  // Apply filters
  if (filters && filters.length > 0) {
    filters.forEach(filter => {
      if (filter.field && filter.value !== undefined) {
        processed = processed.filter(item => {
          const itemValue = item[filter.field]
          switch (filter.operator) {
            case 'equals':
              return itemValue === filter.value
            case 'not_equals':
              return itemValue !== filter.value
            case 'contains':
              return String(itemValue).toLowerCase().includes(String(filter.value).toLowerCase())
            case 'greater_than':
              return Number(itemValue) > Number(filter.value)
            case 'less_than':
              return Number(itemValue) < Number(filter.value)
            default:
              return true
          }
        })
      }
    })
  }

  return processed
}

/**
 * Validate chart configuration
 */
export function validateChartConfig(config: ChartConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.type) {
    errors.push('Chart type is required')
  }

  if (!config.dimensions || config.dimensions.length === 0) {
    errors.push('At least one dimension is required')
  }

  if (!config.measures || config.measures.length === 0) {
    errors.push('At least one measure is required')
  }

  // Chart-specific validations
  if (['PIE', 'DONUT'].includes(config.type)) {
    if (config.dimensions.length !== 1) {
      errors.push('Pie/Donut charts require exactly one dimension')
    }
    if (config.measures.length !== 1) {
      errors.push('Pie/Donut charts require exactly one measure')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get chart type display name
 */
export function getChartTypeDisplayName(type: ChartType): string {
  const names: Record<ChartType, string> = {
    'BAR': 'Bar Chart',
    'HORIZONTAL_BAR': 'Horizontal Bar Chart',
    'LINE': 'Line Chart',
    'AREA': 'Area Chart',
    'PIE': 'Pie Chart',
    'DONUT': 'Donut Chart',
    'SCATTER': 'Scatter Plot',
    'RADAR': 'Radar Chart',
    'GAUGE': 'Gauge Chart',
    'FUNNEL': 'Funnel Chart',
    'WATERFALL': 'Waterfall Chart',
    'TREEMAP': 'Treemap Chart',
    'HEATMAP': 'Heatmap Chart',
    'BUBBLE_MAP': 'Bubble Map',
    'COMPOSED': 'Combo Chart',
    'TABLE': 'Table',
    'PIVOT_TABLE': 'Pivot Table'
  }
  return names[type] || type
}

/**
 * Aggregate data by dimensions
 */
export function aggregateChartData(
  data: ChartDataPoint[],
  dimensions: string[],
  measures: string[],
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' = 'sum'
): ChartDataPoint[] {
  const grouped = new Map<string, ChartDataPoint>()

  data.forEach(item => {
    const key = dimensions.map(dim => item[dim] || '').join('|')
    
    if (!grouped.has(key)) {
      grouped.set(key, {
        ...dimensions.reduce((acc, dim) => {
          acc[dim] = item[dim]
          return acc
        }, {} as ChartDataPoint),
        ...measures.reduce((acc, measure) => {
          acc[measure] = 0
          return acc
        }, {} as ChartDataPoint)
      })
    }

    const group = grouped.get(key)!
    measures.forEach(measure => {
      const value = Number(item[measure]) || 0
      switch (aggregation) {
        case 'sum':
          group[measure] = (group[measure] || 0) + value
          break
        case 'avg':
          group[measure] = ((group[measure] || 0) + value) / 2
          break
        case 'count':
          group[measure] = (group[measure] || 0) + 1
          break
        case 'min':
          group[measure] = Math.min(group[measure] || value, value)
          break
        case 'max':
          group[measure] = Math.max(group[measure] || value, value)
          break
      }
    })
  })

  return Array.from(grouped.values())
}

