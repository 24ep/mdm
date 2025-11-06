/**
 * Query Results Statistics Calculator
 * Calculates statistics for query result columns
 */

export interface ColumnStatistics {
  columnName: string
  dataType: 'number' | 'string' | 'date' | 'boolean' | 'null' | 'mixed'
  totalCount: number
  nullCount: number
  nonNullCount: number
  uniqueCount: number
  // Numeric statistics
  min?: number
  max?: number
  avg?: number
  sum?: number
  median?: number
  // String statistics
  minLength?: number
  maxLength?: number
  avgLength?: number
  // Common values
  topValues?: Array<{ value: any; count: number }>
  // Date statistics
  minDate?: Date
  maxDate?: Date
}

export class ResultStatisticsCalculator {
  calculateStatistics(results: any[], columns: string[]): ColumnStatistics[] {
    return columns.map(column => this.calculateColumnStatistics(results, column))
  }

  private calculateColumnStatistics(results: any[], columnName: string): ColumnStatistics {
    const values = results.map(row => row[columnName])
    const nonNullValues = values.filter(v => v !== null && v !== undefined)
    const uniqueValues = new Set(nonNullValues.map(v => String(v)))
    
    // Determine data type
    const dataType = this.detectDataType(nonNullValues)
    
    const stats: ColumnStatistics = {
      columnName,
      dataType,
      totalCount: values.length,
      nullCount: values.length - nonNullValues.length,
      nonNullCount: nonNullValues.length,
      uniqueCount: uniqueValues.size
    }

    // Calculate type-specific statistics
    if (dataType === 'number') {
      const numbers = nonNullValues.map(v => {
        const num = typeof v === 'string' ? parseFloat(v) : Number(v)
        return isNaN(num) ? null : num
      }).filter(n => n !== null) as number[]

      if (numbers.length > 0) {
        stats.min = Math.min(...numbers)
        stats.max = Math.max(...numbers)
        stats.sum = numbers.reduce((a, b) => a + b, 0)
        stats.avg = stats.sum / numbers.length
        
        // Calculate median
        const sorted = [...numbers].sort((a, b) => a - b)
        const mid = Math.floor(sorted.length / 2)
        stats.median = sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid]
      }
    } else if (dataType === 'string') {
      const strings = nonNullValues.map(v => String(v))
      const lengths = strings.map(s => s.length)
      
      if (lengths.length > 0) {
        stats.minLength = Math.min(...lengths)
        stats.maxLength = Math.max(...lengths)
        stats.avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length
      }
    } else if (dataType === 'date') {
      const dates = nonNullValues
        .map(v => {
          const date = v instanceof Date ? v : new Date(v)
          return isNaN(date.getTime()) ? null : date
        })
        .filter(d => d !== null) as Date[]

      if (dates.length > 0) {
        stats.minDate = new Date(Math.min(...dates.map(d => d.getTime())))
        stats.maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
      }
    }

    // Calculate top values (most frequent)
    if (nonNullValues.length > 0 && nonNullValues.length <= 10000) {
      const valueCounts = new Map<any, number>()
      nonNullValues.forEach(v => {
        const key = typeof v === 'object' ? JSON.stringify(v) : String(v)
        valueCounts.set(key, (valueCounts.get(key) || 0) + 1)
      })

      const topValues = Array.from(valueCounts.entries())
        .map(([value, count]) => {
          // Try to parse back to original type
          let parsedValue: any = value
          try {
            if (dataType === 'number') {
              parsedValue = parseFloat(value)
            } else if (dataType === 'date') {
              parsedValue = new Date(value)
            } else if (value.startsWith('{') || value.startsWith('[')) {
              parsedValue = JSON.parse(value)
            }
          } catch {
            // Keep as string
          }
          
          return { value: parsedValue, count }
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Top 10

      if (topValues.length > 0) {
        stats.topValues = topValues
      }
    }

    return stats
  }

  private detectDataType(values: any[]): ColumnStatistics['dataType'] {
    if (values.length === 0) return 'null'

    let numberCount = 0
    let stringCount = 0
    let dateCount = 0
    let booleanCount = 0
    let nullCount = 0

    values.forEach(v => {
      if (v === null || v === undefined) {
        nullCount++
      } else if (typeof v === 'boolean') {
        booleanCount++
      } else if (typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v)) && isFinite(Number(v)))) {
        numberCount++
      } else if (v instanceof Date || (typeof v === 'string' && !isNaN(Date.parse(v)))) {
        dateCount++
      } else {
        stringCount++
      }
    })

    const total = values.length
    const threshold = total * 0.5 // 50% threshold

    if (numberCount / total >= 0.5) return 'number'
    if (dateCount / total >= 0.5) return 'date'
    if (booleanCount / total >= 0.5) return 'boolean'
    if (stringCount / total >= 0.5) return 'string'
    if (nullCount === total) return 'null'
    
    return 'mixed'
  }

  formatStatValue(value: any, dataType: ColumnStatistics['dataType']): string {
    if (value === null || value === undefined) return 'N/A'
    
    if (dataType === 'number') {
      if (typeof value === 'number') {
        // Format large numbers with commas
        if (Math.abs(value) >= 1000) {
          return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
        }
        return value.toFixed(2)
      }
      return String(value)
    }
    
    if (dataType === 'date' && value instanceof Date) {
      return value.toLocaleString()
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    
    return String(value)
  }
}

// Export singleton instance
export const statisticsCalculator = new ResultStatisticsCalculator()

